const express = require('express');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

server.listen(3000);
app.use(express.static(path.join(__dirname, 'public')));

//let connectedUsers = []; //Inicializa um array vazio para guardar os usuarios conectados

// Objeto com arrays para guardar as salas e seus usuarios
let rooms = {
    geral: [],
    tads: [],
    tga: [],
    tmi: []
};

io.on('connection', (socket) => {
    console.info("Conexão detectada..."); // Exibe uma mensagem quando um usuario se conecta via socket

    socket.on('join-request', (username) => {
        const user = {
            username,
            id: socket.id,
        };

        socket.username = username; // Define o nome do usuario para o socket
        rooms['geral'].push(user); // Adiciona o nome de usuario a lista de usuarios conectados
        console.info('Usuarios na sala geral: ' + JSON.stringify(rooms['geral'])); // Exibe a lista de usuarios conectados ao socket

        socket.join('geral'); // Adiciona o cliente a sala geral

        socket.emit('user-joined', {
            list: rooms,
            name: 'geral'
        }); // Envia a lista de usuarios da sala para o cliente

        socket.to('geral').broadcast.emit('user-joined', {
            list: rooms,
            name: 'geral'
        }); // Envia a lista de usuarios da sala para o restante

        socket.to('geral').broadcast.emit('room-update', {
            joined: socket.username,
            list: rooms,
            name: 'geral'
        });
    });

    //
    // Define o que fazer quando o cliente envia uma solicitação para participar de uma sala em particular
    //
    socket.on('join-room', (data) => {
        socket.join(data.room); // Adiciona o cliente a sala

        const user = {
            username: data.user,
            id: socket.id
        };

        rooms[data.room].push(user); // coloca o cliente na lista da sala

        console.info('Usuarios na sala ' + data.room + ': ' + JSON.stringify(rooms[data.room]));

        socket.emit('user-joined', {
            list: rooms,
            name: data.room
        }); // Envia a lista de usuarios da sala para o cliente

        socket.to(data.room).broadcast.emit('user-joined', {
            list: rooms,
            name: data.room
        }); // Envia a lista de usuarios da sala para o restante

        socket.to(data.room).broadcast.emit('room-update', {
            joined: socket.user,
            list: rooms,
            name: data.room
        });
    });

    socket.on('leave-room', (roomName) => {
        console.info('Usuario ' + socket.username + ' saindo da sala: ' + roomName);
        rooms[roomName] = rooms[roomName].filter(u => u.id !== socket.id); // remove o cliente da lista da sala em particular
        
        socket.to(roomName).broadcast.emit('room-update', {
            left: socket.username,
            list: rooms,
            name: roomName
        });
        socket.leave(roomName); // Remove o cliente a sala
    });

    socket.on('disconnect', () => {
        Object.values(rooms).forEach(array => {
            array = array.filter(user => user.id == socket.id);
        });
        socket.broadcast.emit('room-update', {
            disconnected: socket.username,
            list: rooms
        }); // Informa aos outros clientes que um usuario desconectou
        console.info('Usuarios restantes: ' + JSON.stringify(rooms)); // Exibe a lista atualizada de usuarios conectados ao socket
    });

    socket.on('send-msg', (txt, roomName) => {
        // Envia a mensagem dentro da sala especificada
        let payload = {
            roomName,
            username: socket.username,
            message: txt
        };
        socket.to(roomName).broadcast.emit('show-msg', payload);
    });
});