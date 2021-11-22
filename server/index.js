const { gameLoop } = require('./src/game');

const io = require('socket.io')();

const state = {
  players: []
};

io.on('connection', client => {

  client.on('moving', handleMoving);
  client.on('shot', handleShot);
  client.on('stop-moving', handleStopMoving);
  client.on('newGame', handleNewGame);

  function handleNewGame({ x, y, canvasWidth, canvasHeight }) {
    state.players.push({
      id: client.id,
      y: 0,
      x: 0,
      screen: client.id,
      canvasWidth,
      canvasHeight,
    })
    client.emit('init', { id: client.id, x, y });

    startGameInterval();
  }

  function handleShot(playerIndex) {

    state.players[playerIndex] = {
      ...state.players[playerIndex],
      isShooting: true,
    }

    setTimeout(() => {
      state.players[playerIndex] = {
        ...state.players[playerIndex],
        isShooting: false,
      }
    }, 50)

  }


  function handleMoving({ vector, force, angle }) {
    const clientIndex = 0;

    state.players[clientIndex] = {
      ...state.players[clientIndex],
      x: vector.x * force,
      y: vector.y * -force,
      aim: angle.radian,
    }
  }


  function handleStopMoving() {
    const clientIndex = 0;

    state.players[clientIndex] = {
      ...state.players[clientIndex],
      x: 0,
      y: 0,
    }
  }

  client.on('disconnect', () => {
    const remove = state.players.findIndex(item => item.id === client.id);
    state.players.splice(remove, 1)
  })


  client.on('shot-reachs-left', (msg) => {
    const shotIndex = state.players.findIndex(item => item.id === client.id) - 1 !== -1 && state.players.findIndex(item => item.id === client.id) - 1

    if (shotIndex) {
      io.to(state.players[shotIndex].id).emit('shot-reachs-left', msg)
    }
  });


  client.on('shot-reachs-right', (msg) => {
    const shotIndex = state.players.findIndex(item => item.id === client.id) + 1 !== state.players.length && state.players.findIndex(item => item.id === client.id) + 1
    if (shotIndex) {
      io.to(state.players[shotIndex].id).emit('shot-reachs-right', msg)
    }
  });

  client.on('player-reachs-left', (msg) => {
    const currentPlayer = state.players.find(item => item.id === client.id);

    const playerIndex = state.players.findIndex(item => item.id === client.id) - 1 !== -1 && state.players.findIndex(item => item.id === client.id) - 1

    if (playerIndex) {

      state.players.forEach(playerItem => {
        if (currentPlayer) {
          return (
            {
              ...playerItem,
              x: state.players[playerIndex].canvasWidth,
              screen: state.players[playerIndex].id,
            }
          )
        }

        return playerItem;
      })
      // io.to(state.players[playerIndex].id).emit('player-reachs-left', msg)
    }
  });


  client.on('player-reachs-right', (msg) => {
    const currentPlayer = state.players.find(item => item.id === client.id);
    const playerIndex = state.players.findIndex(item => item.id === client.id) + 1 !== state.players.length && state.players.findIndex(item => item.id === client.id) + 1
    if (playerIndex) {

      state.players.forEach(playerItem => {
        if (currentPlayer) {
          return (
            {
              ...playerItem,
              x: 5,
              screen: state.players[playerIndex].id,
            }
          )
        }

        return playerItem;
      })
      // io.to(state.players[playerIndex].id).emit('player-reachs-right', msg)
    }
  });


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

  // console.log(gameState)
  io.emit('gameState', JSON.stringify(gameState));

}

function emitGameOver(room, winner) {
  io.sockets.in(room)
    .emit('gameOver', JSON.stringify({ winner }));
}

io.listen(process.env.PORT || 3000);
