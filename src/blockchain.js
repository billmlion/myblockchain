// 1. 迷你区块链
// 2. 区块链的生成，新增，校驗
// 3. 交易
// 4. 非對稱加密
// 5. 挖礦
// 6. p2p网络,同步各个节点的区块信息，包含：已经交易和未交易信息等

const crypto = require('crypto')
let dgrm = require('dgram')
const rsa = require('./rsa')

//创世区块
const initBlock = {
    index: 0,
    prevHash: 0,
    timestamp: 1572407704360,
    data: 'Welcome to iblockchain!',
    nonce: 873,
    hash:
        '0006a0108e02fd342d7728ca2b156b0f5a10ec81763e9236768c3799e0a9f283'
}

class Blockchain {
    constructor() {
        this.blockchain = [initBlock]
        this.data = [] //保存本地交易
        this.difficulty = 3 //生产hash的难度
        // const hash = this.computeHash(0, '0', new Date().getTime(), 'Hello woniu-chain!', 1)
        // console.log(hash)
        //所有的网络节点信息,包含address，port
        this.peers = []
        this.remote = {}
        this.seed = { port: 8001, address: '127.0.0.1' } //种子节点,发布生产时替换为外网IP
        this.udp = dgrm.createSocket('udp4')
        this.init()
    }

    init() {
        this.bindP2p()
        this.bindExit()
    }

    bindP2p() {
        this.udp.on('message', (data, remote) => {
            const { address, port } = remote
            const action = JSON.parse(data)
            //   data格式{type:'xxx', data:'xxx'}
            if (action.type) {
                this.dispatch(action, { address, port })
            }
        })

        this.udp.on('listening', () => {
            const address = this.udp.address()
            console.log('[信息]： udp监听完毕 端口是' + address.port)
        })
        //区分种子节点和普通节点 普通节点端口随机(0)，种子节点端口固定8001
        const port = Number(process.argv[2]) || 0
        this.startNode(port)
    }

    startNode(port) {
        this.udp.bind(port)
        //如果不是种子节点， 需要发送一个消息给种子节点，告诉我来了
        if (port !== 8001) {
            this.send({
                type: 'newpeer',
            }, this.seed.port, this.seed.address)
        }
        // 把种子节点加入到本地节点中
        this.peers.push(this.seed)
    }

    send(message, port, address) {
        // console.log('>>>>>>>send', message, port, address)
        this.udp.send(JSON.stringify(message), port, address)
    }

    dispatch(action, remote) {
        console.log('====>接受到P2P网络的消息', action)
        switch (action.type) {
            case 'newpeer':
                //种子节点要做的事情,主要有4件：

                // 1.告诉大家你的公网ip和port
                this.send({
                    type: 'remoteAddress',
                    data: remote
                }, remote.port, remote.address)

                // 2.现在全部节点的列表
                this.send({
                    type: 'peerList',
                    data: this.peers
                }, remote.port, remote.address)

                // 3.告诉所有已知节点 来了新朋友，可让大家与新朋友相互打招呼
                this.boardcast({
                    type: 'sayhi',
                    data: remote
                })

                // 4.告诉你现在区块链的数据
                this.send({
                    type: 'blockchain',
                    data: JSON.stringify({
                        blockchain: this.blockchain,
                        trans: this.data
                    })
                }, remote.port, remote.address)



                this.peers.push(remote)
                console.log('你好，新节点', remote)
                break
            case 'blockchain':
                //同步本地链
                let allData = JSON.parse(action.data)
                let newChain = allData.blockchain
                let newTrans = allData.trans
                // if(newChain.length>1){
                this.replaceChain(newChain)
                this.replaceTrans(newTrans)
                // }
                break
            case 'remoteAddress':
                //存储远程消息，当种子节点退出的时候使用
                this.remote = action.data
                break
            case 'peerList':
                //远程种子节点告诉我，现在的节点列表
                const newPeers = action.data
                this.addPeers(newPeers)
                this.boardcast({ type: 'hi', data: 'hi!' })
                break
            case 'sayhi':
                let remotePeer = action.data
                this.peers.push(remotePeer)
                console.log('[信息] 新朋友你好！ - sayhi')
                this.send({ type: 'hi', data: 'hi!' }, remotePeer.port, remotePeer.address)
                break
            case 'hi':
                console.log(`${remote.address}:${remote.port}:${action.data}`)
                break
            case 'trans':
                //网络上收到的交易请求
                //是否有重复交易
                if (!this.data.find(v => this.isEqualObj(v, action.data))) {
                    console.log('有新的交易，请注意查收')
                    this.addTrans(action.data)
                    this.boardcast({
                        type: 'trans',
                        data: action.data
                    })
                }
                break
            case 'mine':
                //网络上有人挖矿成功
                const lastBlock = this.getLastBlock()
                if (lastBlock.hash === action.data.hash) {
                    //重复的消息
                    return
                }
                if (this.isValidaBlock(action.data, lastBlock)) {
                    console.log('[信息] 有人挖矿成功，耶耶耶')
                    this.blockchain.push(action.data)
                    //清空本地消息
                    this.data = []
                    //不用担心，上面已有去重，只为了某些没收到的再接收
                    this.boardcast({
                        type: 'mine',
                        data: action.data
                    })
                } else {
                    console.log('挖矿区块不合法')
                }
                break
            default:
                console.log('不认识该类型action')
                break
        }
    }

    boardcast(action) {
        //广播全场
        this.peers.forEach(v => {
            this.send(action, v.port, v.address)
        })
    }

    addTrans(trans) {
        if (this.isValidTransfer(trans)) {
            this.data.push(trans)
        }
    }
    // isEqualPeer(peer1, peer2) {
    //     return peer1.address == peer2.address && peer1.port == peer2.port
    // }
    isEqualObj(obj1, obj2) {
        const keys1 = Object.keys(obj1)
        const keys2 = Object.keys(obj2)
        if (keys1.length !== keys2.length) {
            return false
        }
        return keys1.every(key => obj1[key] === obj2[key])
    }

    addPeers(newpeers) {
        console.log('new peers:' + JSON.stringify(newpeers));
        console.log('this peers:' + JSON.stringify(this.peers));
        // newpeers.forEach(peer => {
        //     //新的节点如果不存在，就添加一个到peers上
        //     if (!this.peers.find(v => this.isEqualObj(v, peer))) {
        //         this.peers.push(peer)
        //     }
        // })
        newpeers.forEach(peer => {
            if (!this.peers.find(v => this.isEqualObj(v, peer))) {
                this.peers.push(peer)
            }
        })
    }

    bindExit() {
        process.on('exit', () => {
            console.log('[信息]：网络关闭 再见')
        })
    }

    getLastBlock() {
        return this.blockchain[this.blockchain.length - 1]
    }

    isValidTransfer(trans) {
        // 是不是合法的转账
        return rsa.verify(trans, trans.from)
    }

    //挖矿,其实就是打包交易
    mine(address) {
        //  校验所以交易合法性，有兩種：
        // 第一种方式
        // if (!this.data.every(v => this.isValidTransfer(v))) {
        //     console.log('trans is not valid')
        //     return
        // }
        //第二种：过滤不合法的
        this.data = this.data.filter(v => this.isValidTransfer(v))

        //   1. 生产新的区块 -页新的记账加入了区块链
        //   2.不停的计算哈希 直到计算出符合条件的哈希值，获得记账权

        //挖矿结束 矿工奖励 每次挖矿成功奖励100
        this.transfer('0', address, 100)

        const newBlock = this.generateNewBlock()
        // 区块合法 并且区块链合法，就新增
        if (this.isValidaBlock(newBlock) &&
            this.isValidChain()) {
            this.blockchain.push(newBlock)
            this.data = []
            console.log('[信息] 挖矿成功')
            this.boardcast({
                type: 'mine',
                data: newBlock
            })
            return newBlock
        } else {
            console.log('error,invalid block', newBlock)
        }
    }

    //生产新区块
    generateNewBlock() {
        let nonce = 0
        const index = this.blockchain.length
        const data = this.data
        const prevHash = this.getLastBlock().hash
        let timestamp = new Date().getTime()
        let hash = this.computeHash(index, prevHash, timestamp, data, nonce)
        while (hash.slice(0, this.difficulty) !== '0'.repeat(this.difficulty)) {
            nonce += 1
            hash = this.computeHash(index, prevHash, timestamp, data, nonce)
        }
        // console.log('mine over', {
        //     index, prevHash, timestamp, data, nonce, hash
        // })
        // console.log('compute agin ', this.computeHash( index, prevHash, timestamp, data, nonce))

        return {
            // index, data, prevHash, timestamp, nonce, hash
            index, prevHash, timestamp, data, nonce, hash
        }
    }

    computeHashForBlock({ index, prevHash, timestamp, data, nonce }) {
        // return this.computeHash({index, prevHash, timestamp, data, nonce})
        // console.log({index, prevHash, timestamp, data, nonce})
        return this.computeHash(index, prevHash, timestamp, data, nonce)
    }

    computeHash(index, prevHash, timestamp, data, nonce) {
        return crypto.
            createHash('sha256').
            update(index + prevHash + timestamp + data + nonce).digest('hex')
    }

    //校验区块
    isValidaBlock(newBlock, lastBlock = this.getLastBlock()) {
        //  1. 区块的index 等于最新区块index +1
        //  2. 区块的time <= 最新区块
        //  3. 最新区块的preHash 等于 最新区块的Hash
        //  4. 区块的哈希值 符合难度要求
        //  5. 新区块的哈希值计算正确
        // const lastBlock = this.getLastBlock()
        if (newBlock.index !== lastBlock.index + 1) {
            return false
        } else if (newBlock.timestamp <= lastBlock.timestamp) {
            return false
        } else if (newBlock.prevHash !== lastBlock.hash) {
            return false
        } else if (newBlock.hash.slice(0, this.difficulty) !== '0'.repeat(this.difficulty)) {
            return false
            // } else if (newBlock.hash !== this.computeHash( newBlock.index, newBlock.prevHash, newBlock.timestamp, newBlock.data, newBlock.nonce)) {
        } else if (newBlock.hash !== this.computeHashForBlock(newBlock)) {
            return false
        }
        return true
    }

    //校验区块链
    isValidChain(chain = this.blockchain) {
        //除创世区块的校验
        for (let i = chain.length - 1; i >= 1; i = i - 1) {
            if (!this.isValidaBlock(chain[i], chain[i - 1])) {
                return false
            }
        }
        if (JSON.stringify(chain[0]) !== JSON.stringify(initBlock)) {
            return false
        }
        return true
    }


    transfer(from, to, amount) {
        const timestamp = new Date().getTime()
        // 签名校验
        const transObj = { from, to, amount, timestamp }
        // console.log(transObj)
        const signature = rsa.sign(transObj)
        const sigTrans = { from, to, amount, timestamp, signature }

        if (from !== '0') {
            // 非挖矿交易
            const blance = this.blance(from)
            if (blance < amount) {
                console.log('not enouth blance', from, blance, amount)
                return
            }
            this.boardcast({
                type: 'trans',
                data: sigTrans
            })
        }
        this.data.push(sigTrans)
        return sigTrans
    }

    // 查看余额
    blance(address) {
        let blance = 0
        this.blockchain.forEach(block => {
            if (!Array.isArray(block.data)) {
                //   创世区块
                return
            }
            //   console.log(block)
            block.data.forEach(trans => {
                if (address == trans.from) {
                    blance -= trans.amount
                }
                if (address == trans.to) {
                    blance += trans.amount
                }
            })
        })
        return blance
    }

    replaceChain(newChain) {
        //先不校验交易
        if (newChain.length === 1) {
            return
        }
        if (this.isValidChain(newChain) && newChain.length > this.blockchain.length) {
            this.blockchain = JSON.parse(JSON.stringify(newChain))
        } else {
            console.log('[错误] 不合法链')
        }
    }

    replaceTrans(trans) {
        if (trans.every(v => this.isValidTransfer(v))) {
            this.data = trans
        }
    }
}

// let bc = new Blockchain()
// // console.log(bc.generateNewBlock())

// bc.mine()
// // bc.blockchain[1].nonce =1
// bc.mine()
// // bc.blockchain[2].nonce =1
// bc.mine()
// console.log(bc.blockchain)

module.exports = Blockchain

