const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// lista de usuários conectados.
const users = []

// ouve a conexão de um novo player.
io.on('connection', (socket) => {
  // assim que um player se conecta, o id (gerado pelo proprio socket), é adicionado no array de players
  // essa é a razão pela qual a order que as telas devem estar organizadas tem que ser exatamente as mesmas da ordem de conexão.
  users.push(socket.id)
  console.log(users)
  // ouve o evento emitido pelo front-end, e emite o mesmo evento para o usuário ao lado
  // (pego a posição do usuário que emitiu o evento e subtraio um para pegar o usuário da esquerda)
  // caso o usuário da esquerda não exista (devido ao emissor ser o primeiro), pego o ultimo
  socket.on('shot-reachs-left', (msg) => {
    const shotIndex = users.indexOf(socket.id) - 1 === -1 ? users.length - 1 : users.indexOf(socket.id) - 1
    console.log('Estou enviando para a direita do ', users[shotIndex])

    io.to(users[shotIndex]).emit('shot-reachs-left', msg)
  });

  // ouve o evento emitido pelo front-end, e emite o mesmo evento para o usuário ao lado
  // (pego a posição do usuário que emitiu o evento e subtraio um para pegar o usuário da direita)
  // caso o usuário da direita não exista (devido ao emissor ser o ultimo), pego o primeiro
  socket.on('shot-reachs-right', (msg) => {
    const shotIndex = users.indexOf(socket.id) + 1 === users.length ? 0 : users.indexOf(socket.id) + 1
    console.log(shotIndex)
    console.log('Estou enviando para a esquerda do ', users[shotIndex])
    io.to(users[shotIndex]).emit('shot-reachs-right', msg)
  });


  // ouve o evento de disconnect, e remove o usuário que disconectou da lista.
  socket.on('disconnect', user => {
    const remove = users.indexOf(socket.id)
    users.splice(remove, 1)
  })
});

server.listen(3000, () => {
  console.log('listening on port 3000');
});