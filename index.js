const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  socket.on('shot-reachs-left', (msg) => {
    socket.broadcast.emit('shot-reachs-left', msg);
  });
  socket.on('shot-reachs-right', (msg) => {
    socket.broadcast.emit('shot-reachs-right', msg);
  });
});

server.listen(3000, () => {
  console.log('listening on port 3000');
});