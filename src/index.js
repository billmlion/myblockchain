const vorpal = require('vorpal')();
const Blockchain = require('./blockchain')
const blockchain = new Blockchain()
const Table = require('cli-table');
const rsa = require('./rsa')


// // instantiate
// const table = new Table({
//     head: ['TH 1 label', 'TH 2 label']
//   , colWidths: [10, 20]
// });


// // table is an Array, so you can `push`, `unshift`, `splice` and friends
// table.push(
//     ['First value', 'Second value']
//   , ['First value', 'Second value']
// );

// console.log(table.toString());

function formatLog(data) {
    if (!data || data.length === 0) {
        return
    }
    if (!Array.isArray(data)) {
        data = [data]
    }
    const first = data[0]
    // console.log(first)
    const head = Object.keys(first)
    const table = new Table({
        head: head,
        colWidths: new Array(head.length).fill(15)
    })

    const res = data.map(v => {
        return head.map(h => JSON.stringify(v[h], null, 1))
    })

    table.push(...res)
    console.log(table.toString());
}

vorpal
    .command('hello', 'outputs "bar".')
    .action(function (args, callback) {
        this.log('你好 区块链');
        callback();
    });

vorpal
    .command('mine', ' 挖矿 <矿工地址>')
    .action(function (args, callback) {
        const newBlock = blockchain.mine(rsa.keys.pub)
        if (newBlock) {
            // this.log(newBlock)
            formatLog(newBlock)
        }
        callback();
    });

vorpal
    .command('blockchain', '查看区块链')
    .action(function (args, callback) {
        // this.log(blockchain.blockchain);
        formatLog(blockchain.blockchain)
        callback();
    });

vorpal
    .command('trans <to> <amount>', '转账')
    .action(function (args, callback) {
        //本地公钥作为转出地址
        let trans = blockchain.transfer(rsa.keys.pub, args.to, args.amount)
        if (trans) {
            formatLog(trans)
        }
        callback();
    });

vorpal
    .command('detail <index>', '查看区块详情')
    .action(function (args, callback) {
        const block = blockchain.blockchain[args.index]
        this.log(JSON.stringify(block, null, 2))
        callback();
    });

vorpal
    .command('blance <address>', '查看用户账号余额')
    .action(function (args, callback) {
        const blance = blockchain.blance(args.address)
        if (blance) {
            formatLog({ blance, address: args.address })
        }
        callback();
    });


vorpal
    .command('pub', '查看本地地址')
    .action(function (args, callback) {
        console.log(rsa.keys.pub)
        callback();
    });

vorpal
    .command('peers', '查看网络列表')
    .action(function (args, callback) {
        formatLog(blockchain.peers)
        callback();
    });

vorpal
    .command('chat <msg>', '跟別的节点打个招呼')
    .action(function (args, callback) {
        blockchain.boardcast({
            type: 'hi',
            data: args.msg
        })
        callback();
    });

vorpal
    .command('pending', '查看还没有打包的交易')
    .action(function (args, callback) {
        formatLog(blockchain.data)
        callback();
    });

vorpal
    .delimiter('woniu-chain => ')
    .show();