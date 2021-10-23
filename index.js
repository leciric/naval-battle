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
    const shotIndex = users.indexOf(socket.id)-1 === -1 ? users.length -1 : users.indexOf(socket.id)-1
    io.to(users[shotIndex]).emit('shot-reachs-left', msg)


  });
  socket.on('shot-reachs-right', (msg) => {
    const shotIndex = users.indexOf(socket.id)+1 === users.length ? 0 : users.indexOf(socket.id)+1
    io.to(users[shotIndex]).emit('shot-reachs-left', msg)
  });
});

server.listen(3000, () => {
  console.log('listening on port 3000');
});