const { gameLoop } = require("./src/game");

const io = require("socket.io")();

const state = {
  players: [],
};

io.on("connection", (client) => {
  client.on("moving", handleMoving);
  client.on("shot", handleShot);
  client.on("stop-moving", handleStopMoving);
  client.on("newGame", handleNewGame);

  function handleNewGame({ canvasWidth, canvasHeight }) {
    const player = {
      id: client.id,
      y: canvasHeight / 2,
      x: canvasWidth / 2,
      color: "blue",
      radius: 30,
      live: 100,
      aim: 0,
      velocity: {
        x: 0,
        y: 0,
      },
      screen: 0,
      name: 0,
      canvasWidth,
      canvasHeight,
    };
    state.players.push(player);
    player.screen = state.players.length - 1;
    player.name = state.players.length - 1;
    client.emit("init", player);

    startGameInterval();
  }

  function handleShot(playerIndex) {
    state.players[playerIndex] = {
      ...state.players[playerIndex],
      isShooting: true,
    };

    setTimeout(() => {
      state.players[playerIndex] = {
        ...state.players[playerIndex],
        isShooting: false,
      };
    }, 50);
  }

  function handleMoving({ vector, force, angle, playerIndex }) {
    const x = vector.x * force;
    const y = vector.y * -force;
    const aim = angle.radian;

    state.players[playerIndex] = {
      ...state.players[playerIndex],
      aim,
      velocity: { x, y },
    };

    client.emit("moving", { x, y, aim });
  }

  function handleStopMoving(playerIndex) {
    state.players[playerIndex] = {
      ...state.players[playerIndex],
      velocity: {
        x: 0,
        y: 0,
      },
    };
  }

  client.on("shot-reachs-left", (projectile) => {
    const shootingPlayerIndex = state.players.findIndex(
      (item) => item.id === client.id
    );

    if (shootingPlayerIndex !== -1 && shootingPlayerIndex > 0) {
      io.to(state.players[shootingPlayerIndex - 1].id).emit(
        "shot-reachs-left",
        projectile
      );
    }
  });

  client.on("shot-reachs-right", (projectile) => {
    const shootingPlayerIndex = state.players.findIndex(
      (item) => item.id === client.id
    );

    if (
      shootingPlayerIndex !== -1 &&
      shootingPlayerIndex !== state.players.length - 1
    ) {
      io.to(state.players[shootingPlayerIndex + 1].id).emit(
        "shot-reachs-right",
        projectile
      );
    }
  });

  client.on("player-reachs-left", (player) => {
    const playerIndex = state.players.findIndex(
      (item) => item.id === client.id
    );

    if (playerIndex !== -1 && player.screen > 0) {
      io.to(state.players[playerIndex - 1].id).emit(
        "player-reachs-left",
        player
      );
    }
    
    // const playerIndex = state.players.findIndex(
    //   (item) => item.id === client.id
    // );

    // if (playerIndex !== -1) {
    //   state.players[playerIndex] = {
    //     ...state.players[playerIndex],
    //     x: state.players[playerIndex].canvasWidth - 30,
    //     screen: state.players[playerIndex].id,
    //   };
    // }
  });

  client.on("player-reachs-right", (player) => {
    const playerIndex = state.players.findIndex(
      (item) => item.id === client.id
    );

    if (playerIndex !== -1 &&
        player.screen !== state.players.length - 1) {
      io.to(state.players[playerIndex + 1].id).emit(
        "player-reachs-right",
        player
      );
    }
    // const playerIndex = state.players.findIndex(
    //   (item) => item.id === client.id
    // );

    // if (playerIndex !== -1) {
    //   state.players[playerIndex] = {
    //     ...state.players[playerIndex],
    //     x: 30,
    //     screen: state.players[playerIndex].id,
    //   };
    // }
  });

  client.on("disconnect", () => {
    const remove = state.players.findIndex((item) => item.id === client.id);
    state.players.splice(remove, 1);
  });
});

function startGameInterval() {
  const intervalId = setInterval(() => {
    const winner = gameLoop(state);

    if (!winner) {
      emitGameState(state);
    } else {
      emitGameOver(winner);
      state = null;
      clearInterval(intervalId);
    }
  }, 1000 / 100);
}

// revisar gameState
function emitGameState(gameState) {
  io.emit("gameState", JSON.stringify(gameState));
}

function emitGameOver(room, winner) {
  io.sockets.in(room).emit("gameOver", JSON.stringify({ winner }));
}

io.listen(process.env.PORT || 3000);
