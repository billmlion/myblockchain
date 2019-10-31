const vorpal = require('vorpal')();
const Blockchain = require('./blockchain')
const blockchain = new Blockchain()
const Table = require('cli-table');

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

    const res = data.map(v=>{
        return head.map(h=>v[h])
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
    .command('mine', ' 挖矿')
    .action(function (args, callback) {
        const newBlock = blockchain.mine()
        if (newBlock) {
            // this.log(newBlock)
            formatLog(newBlock)
        }
        callback();
    });

vorpal
    .command('chain', '查看区块链')
    .action(function (args, callback) {
        // this.log(blockchain.blockchain);
        formatLog(blockchain.blockchain)
        callback();
    });

vorpal
    .delimiter('woniu-chain => ')
    .show();