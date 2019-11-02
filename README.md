# myblockchain
my  blockchain for test
# 发布生产
1.修改blockchain.js,替换生产节点ip，作为种子节点，用于P2P网络链接网件ip和端口发现
```Javascript
this.seed = { port: 8001, address: '127.0.0.1' } //种子节点,发布生产时替换为外网IP
```

