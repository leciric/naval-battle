const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

let users = []

io.on('connection', (socket) => {
  users.push(socket.id)
  console.log(users)

  socket.on('shot-reachs-left', (msg) => {
    const shotIndex = users.indexOf(socket.id) - 1 === -1 ? users.length - 1 : users.indexOf(socket.id) - 1
    console.log('Estou enviando para a direita do ', users[shotIndex])

    io.to(users[shotIndex]).emit('shot-reachs-left', msg)
  });
  socket.on('shot-reachs-right', (msg) => {
    const shotIndex = users.indexOf(socket.id) + 1 === users.length ? 0 : users.indexOf(socket.id) + 1
    console.log(shotIndex)
    console.log('Estou enviando para a esquerda do ', users[shotIndex])
    io.to(users[shotIndex]).emit('shot-reachs-right', msg)
  });
  socket.on('disconnect', user => {
    const remove = users.indexOf(socket.id)
    users.splice(remove, 1)
  })
});

server.listen(3000, () => {
  console.log('listening on port 3000');
});