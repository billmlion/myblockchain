var dgram = require('dgram');

var client = dgram.createSocket('udp4');

var message = new Buffer('我是客户端的消息');
// client.send(message, 0, message.length, 8888, '192.168.100.208', function (err, bytes) {
client.send(message, 0, message.length, 8001, '192.168.100.181', function (err, bytes) {
    console.log('客户端发送完成，关闭客户端');
    client.close();
});
