// 1.公私钥对
// 2.公钥直接当成地址用（或者截取公钥前20位）
// 3.公钥可以通过私钥计算出来

let fs = require('fs')
let EC = require('elliptic').ec;

// Create and initialize EC context
// (better do it once and reuse it)
let ec = new EC('secp256k1');

// Generate keys
let keypair = ec.genKeyPair();

// const res = {
//     prv: keypair.getPrivate('hex').toString(),
//     pub: keypair.getPublic('hex').toString(),
// }

function getPub(prv) {
    //根据私钥算出公钥
    return ec.keyFromPrivate(prv).getPublic('hex').toString()
}

// 1. 获取公私钥对（持久化）
function generateKeys() {
    const fileName = './wallet.json'
    try {
        let res = JSON.parse(fs.readFileSync(fileName))
        if (res.prv && res.pub && getPub(res.prv) == res.pub) {
            keypair = ec.keyFromPrivate(res.prv)
            return res
        } else {
            //验证失败 重新生成
            throw 'not valid wallet.'
        }
    } catch (error) {
        const res = {
            prv: keypair.getPrivate('hex').toString(),
            pub: keypair.getPublic('hex').toString(),
        }
        fs.writeFileSync(fileName, JSON.stringify(res))
        return res
    }
}

const keys = generateKeys()


// 2.签名
function sign({ from, to, amount,timestamp }) {
    const bufferMsg = Buffer.from('${timestamp}-${amount}-${from}-${to}')
    let signature = Buffer.from(keypair.sign(bufferMsg).toDER()).toString('hex')
    return signature
}

//3.校验签名
function verify({ from, to, amount, signature }, pub) {
    //校验是没有私钥
    const keypairTemp = ec.keyFromPublic(pub, 'hex')
    const bufferMsg = Buffer.from('${timestamp}-${amount}-${from}-${to}')
    return keypairTemp.verify(bufferMsg, signature)
}

// console.log(res)

// const trans = { from: 'bill', to: 'mao', amount: 100 }
// // const trans1 = { from: 'bill1', to: 'mao', amount: 80 }
// const signature = sign(trans)
// trans.signature = signature
// console.log(signature)
// const isVerify = verify(trans,keys.pub)
// console.log(isVerify)
module.exports = {sign, verify, keys}