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

  function handleNewGame({canvasWidth, canvasHeight }) {
    const player = {
      id: client.id,
      y: canvasHeight / 2,
      x: canvasWidth / 2,
      color: 'blue',
      radius: 30,
      live: 10,
      aim: 0,
      velocity: {
        x: 0,
        y: 0,
      },
      screen: client.id,
      canvasWidth,
      canvasHeight,
    }
    state.players.push(player)
    client.emit('init', player);

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


  function handleMoving({ vector, force, angle, clientIndex }) {

    state.players[clientIndex] = {
      ...state.players[clientIndex],
      velocity: {
        x: vector.x * force,
        y: vector.y * -force,
      },
      aim: angle.radian,
    }
  }


  function handleStopMoving() {
    const clientIndex = 0;

    state.players[clientIndex] = {
      ...state.players[clientIndex],
      velocity: {
        x: 0,
        y: 0,
      }
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

  client.on('player-reachs-left', () => {
    const playerIndex = state.players.findIndex(item => item.id === client.id) - 1 !== -1 && state.players.findIndex(item => item.id === client.id) - 1


    // const playerIndex = state.players.findIndex(item => {
    //   return state.players.flatMap(item2 => {
    //     item2.screen === client.id
    //   })
    // })

    if (playerIndex >= 0) {
      state.players[playerIndex + 1] = {
        ...state.players[playerIndex + 1],
        x: state.players[playerIndex].canvasWidth - 30,
        screen: state.players[playerIndex].id,
      }
    }
  });

  client.on('player-reachs-right', () => {
    const playerIndex = state.players.findIndex(item => item.id === client.id) + 1 !== state.players.length && state.players.findIndex(item => item.id === client.id) + 1
    if (playerIndex && playerIndex >= 0) {
      state.players[playerIndex - 1] = {
        ...state.players[playerIndex - 1],
        x: 25,
        screen: state.players[playerIndex].id,
      }
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
