const { gameLoop } = require('./src/game');

const io = require('socket.io')();

const state = {
  players: []
};

io.on('connection', client => {

  client.on('moving', handleMoving);
  client.on('stop-moving', handleStopMoving);
  client.on('newGame', handleNewGame);

  function handleNewGame({x, y}) {
    state.players.push({
      id: client.id,
      y: 0,
      x: 0,
    })
    client.emit('init', {id: client.id, x, y});

    startGameInterval();
  }


  function handleMoving({vector, force}) {
      const clientIndex = 0;
  
      state.players[clientIndex] = {
        x: vector.x * force,
        y:  vector.y * -force,
      }
  }

  function handleStopMoving() {
    const clientIndex = 0;

    state.players[clientIndex] = {
      x: 0,
      y: 0,
    }
}

  client.on('disconnect', () => {
    const remove = state.players.findIndex(item => item.id === client.id);
    state.players.splice(remove, 1)
  })

})

function startGameInterval() {
  const intervalId = setInterval(() => {
    const winner = gameLoop(state);

    if (!winner) {
      emitGameState(state)
    } else {
      emitGameOver(winner);
      state = null;
      clearInterval(intervalId);
    }
  }, 1000 / 100);
}

function emitGameState(gameState) {
  io.emit('gameState', JSON.stringify(gameState));
}

function emitGameOver(room, winner) {
  io.sockets.in(room)
    .emit('gameOver', JSON.stringify({ winner }));
}

io.listen(process.env.PORT || 3000);
