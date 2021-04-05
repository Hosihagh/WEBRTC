const express = require('express');
const app = express();
const socketio = require('socket.io')

app.use(express.static('public'))

server = app.listen(3000, () => {
    console.log('started listenin on port 3000')
})

const io = socketio(server);



io.on('connection', socket => {
    console.log('socket opened')


    socket.on('create', room => {
        if (io.sockets.adapter.rooms.get(room) === undefined) {
            console.log('socket creating room' + room)
            socket.join(room);
            socket.emit('created', room)
        } else {
            console.log('room already exists')
            socket.emit('exists', room)
        }


    })

    socket.on('join', room => {
        let numClients = io.sockets.adapter.rooms.get(room).size
        if (numClients == 1) {
            socket.join(room)
            socket.emit('joined', room)
        } else {
            socket.emit('full', room)
        }
    })


    socket.on('ready', room => {
        socket.broadcast.to(room).emit('ready')
    })

    socket.on('offer', event => {
        socket.broadcast.to(event.room).emit('offer', event.sdp)
    })

    socket.on('answer', event => {
        socket.broadcast.to(event.room).emit('answer', event.sdp)
    })

    socket.on('candidate', event => {
        console.log(event)
        socket.broadcast.to(event.room).emit('candidate', event)
    })

})