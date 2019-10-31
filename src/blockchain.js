// 1. 迷你区块链
// 2. 区块链的生成，新增，校驗
// 3. 交易
// 4. 非對稱加密
// 5. 挖礦
// 6. p2p网络

const crypto = require('crypto')
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
        this.data = []
        this.difficulty = 3
        // const hash = this.computeHash(0, '0', new Date().getTime(), 'Hello woniu-chain!', 1)
        // console.log(hash)
    }

    getLastBlock() {
        return this.blockchain[this.blockchain.length - 1]
    }

    //挖矿,其实就是打包交易
    mine(address) {
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
        if(from!=='0'){
            // 非挖矿交易
            const blance = this.blance(from)
            if(blance<amount){
                console.log('not enouth blance' , from, blance,amount)
                return
            }
        }
        //TODO：签名校验
        const transObj = { from, to, amount }
        // console.log(transObj)
        this.data.push(transObj)
        return transObj
    }

    // 查看余额
    blance(address) {
      let blance = 0
      this.blockchain.forEach(block=>{
          if(!Array.isArray(block.data)){
            //   创世区块
              return
          }
        //   console.log(block)
          block.data.forEach(trans=>{
              if(address==trans.from){
                  blance -= trans.amount
              }
              if(address==trans.to){
                blance +=trans.amount
            }
          })
      })
      return blance
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

