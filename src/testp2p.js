let dgrm = require('dgram')
let udp = dgrm.createSocket('udp4')

//upd 发送信息
udp.on('message', (data, remote) => {
    console.log('accept message' + data.toString())
    console.log(remote)
})

udp.on('listening', function () {
    const address = udp.address()
    console.log('udp server is listening' + address.address + ':' + address.port)
})

udp.bind(8001)

function send(message, port, host) {
    console.log('send message', message, port, host)
    udp.send(Buffer.from(message), port, host)
}

const port = Number(process.argv[2])
const host = process.argv[3]
if(port && host){
    send('hi ', port, host)
}


console.log(process.argv)