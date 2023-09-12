const express = require('express');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

server.listen(3000);
app.use(express.static(path.join(__dirname, 'public')));

let = connectedUsers = []; //Inicializa um array vazio para guardar os usuarios conectados

io.on('connection', (socket) => {
    console.info("Conexão detectada..."); // Exibe uma mensagem quando um usuario se conecta via socket

    socket.on('join-request', (username) => {
        socket.username = username; // Define o nome do usuario para o socket
        connectedUsers.push(username); // Adiciona o nome de usuario a lista de usuarios conectados
        console.info(connectedUsers); // Exibe a lista de usuarios conectados ao socket
    
        socket.emit('user-ok', connectedUsers); // Envia a lista de usuarios conectados para o cliente
        socket.broadcast.emit('list-update', {
            joined: username,
            list: connectedUsers
        });
    });

    socket.on('disconnect', () => {
        connectedUsers = connectedUsers.filter(u => u != socket.username); // Remove o usuario da lista de usuarios conectados
        console.info(connectedUsers); // Exibe a lista atualizada de usuarios conectados ao socket

        socket.broadcast.emit('list-update', {
            left: socket.username,
            list: connectedUsers
        }); // Informa aos outros clientes que um usuario desconectou
    });

    socket.on('send-msg', (txt) => {
        let mensagem = {
            username: socket.username,
            message: txt
        };

        socket.broadcast.emit('show-msg', mensagem); // Envia a mensagem a todos os clientes, exceto o remetente
    });
});