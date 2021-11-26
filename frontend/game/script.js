const socket = io("http://localhost:3000/");

let isDead = false;

const HEIGHT = window.innerHeight;
const WIDTH = window.innerWidth;

function createCanvas() {
  const canvasEl = document.querySelector("canvas");
  const canvas = canvasEl.getContext("2d");

  canvasEl.width = innerWidth;
  canvasEl.height = innerHeight;

  canvas.lineWidth = 4;
  canvas.fillStyle = "blue";

  return canvas;
}

const canvas = createCanvas();

socket.emit("newGame", {
  canvasWidth: WIDTH,
  canvasHeight: HEIGHT,
});

// array de projeteis disparados
const projectiles = [];
const players = [];

let playerId;

socket.on("init", (player) => {
  if (!playerId) {
    playerId = player.id;

    players.push(new Player({ ...player }));
  }
});

function animate() {
  requestAnimationFrame(animate);
  canvas.clearRect(0, 0, WIDTH, HEIGHT);

  if (players.length > 0) {
    players.forEach((playerItem) => {
      playerItem.draw();
      canvas.font = "28px arial";
      canvas.fillText("Vida: " + playerItem.live, 50, 50);
    });
  }

  if (isDead) {
    canvas.font = "50px arial";
    canvas.fillText("GAME OVER!!!", 50, 50);
  }

  projectiles.forEach((projectile, index) => {
    projectile.update();

    if (projectile.x - projectile.radius < 0) {
      socket.emit("shot-reachs-left", projectile);
      projectiles.splice(index, 1);
    }

    if (projectile.x - projectile.radius > WIDTH) {
      socket.emit("shot-reachs-right", projectile);
      projectiles.splice(index, 1);
    }

    if (projectile.y - projectile.radius > HEIGHT) {
      projectiles.splice(index, 1);
    }

    if (projectile.y - projectile.radius < 0) {
      projectiles.splice(index, 1);
    }
  });

  players.forEach((player, index) => {
    if (player.x - player.radius < 0) {
      socket.emit("player-reachs-left", player);
      players.splice(index, 1);
    }

    if (player.x - player.radius > WIDTH) {
      socket.emit("player-reachs-right", player);
      players.splice(index, 1);
    }

    if (player.y - player.radius > HEIGHT) {
      player.y = HEIGHT - 5;
    }

    if (player.y - player.radius < 0) {
      player.y = 20;
    }
  });

  isCollide();
}

function isCollide() {
  if (players.length > 0) {
    players.forEach((playerItem, index) => {
      //variável auxiliar para remoção do player da list
      var playerindex = index;
      if (projectiles.length > 0) {
        projectiles.forEach((projectile, index) => {
          projectile.update();
          var dx = playerItem.x - projectile.x;
          var dy = playerItem.y - projectile.y;
          var distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < playerItem.radius + projectile.radius) {
            //colisão detectada!
            projectiles.splice(index, 1);
            playerItem.color = "green";
            playerItem.live = playerItem.live - 1;
            if (playerItem.live <= 0) {
              players.splice(playerindex, 1);
              isDead = true;
              console.log("O jogador morreu!");
            }
          }
        });
      }
    });
  }
}

socket.on("gameState", (state) => {
  const parsedState = JSON.parse(state);

  if (players.length > 0) {
    players.forEach((player) => {
      const index = parsedState.players.findIndex(
        (item) => item.id === player.id
      );

      const otherPlayer = parsedState.players.find(
        (item) => item.screen === playerId && item.id !== playerId // revisar playerId
      );

      if (otherPlayer) {
        players.push(new Player({ ...otherPlayer }));
        console.log(players);
      }

      if (index !== -1) {
        const selectedPlayer = parsedState.players[index];

        player.update(
          selectedPlayer?.velocity?.x,
          selectedPlayer?.velocity?.y,
          selectedPlayer?.aim
        );

        if (selectedPlayer.isShooting) {
          // salvando a localizacao do player
          var pX, pY, pRad, pAim;

          if (players.length > 0) {
            players.forEach((playerItem) => {
              pX = playerItem.x;
              pY = playerItem.y;
              pRad = playerItem.radius;
              pAim = playerItem.aim;
            });
          }

          // velocidade do projetil
          const velocity = {
            x: Math.cos(pAim) * 5,
            y: Math.sin(pAim) * -1 * 5,
          };

          // instancia um novo projetil (ainda está com posição fixa de inicio, exatamente onde o player é instanciado)
          // Iremos implementar para isso acompanhar a posição do player.
          projectiles.push(
            new Projectile({
              //utilizando a localização do player (inclui o radius do player para que o tiro ficasse para "fora" do jogador)
              //precisa ver como utilizar a "frente" do jogador para iniciar o disparo.

              x: pX + 1 + pRad * Math.cos(pAim),
              y: pY + 1 + pRad * (Math.sin(pAim) * -1),
              radius: 5,
              color: "red",
              velocity,
            })
          );
        }
      }
    });
  }
});

// socket fica ouvindo esperando pelo evento de tiro que atingir o lado esquerdo
socket.on("shot-reachs-left", (projectile) => {
  projectiles.push(new Projectile({ ...projectile, x: WIDTH }));
});

// socket fica ouvindo esperando pelo evento de tiro que atingir o lado direito
socket.on("shot-reachs-right", (projectile) => {
  projectiles.push(new Projectile({ ...projectile, x: 5 }));
});

socket.on("player-reachs-left", (player) => {
  players.push(new Player({ ...player }));
});

animate();

let reconnect = true;
let reconnectionDelay = 5000;
let reconnectionTry = 0;

socket.on("disconnect", handleDisconnect);
socket.on("connect_error", handleConnectError);

// caso ocorra algum erro durante a conexão com o socket
function handleConnectError() {
  reconnectionTry++;
  console.log("Reconnection attempt #" + reconnectionTry);
}

function handleDisconnect() {
  socket.disconnect();
  console.log("client disconnected");
  if (reconnect) {
    setTimeout(function () {
      console.log("client trying reconnect");
      connectClient();
    }, reconnectionDelay);
  }
}

class Player {
  constructor({ id, x, y, radius, color, live, aim }) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.live = live;
    this.aim = aim;
  }

  draw() {
    canvas.beginPath();
    canvas.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    canvas.fillStyle = this.color;
    canvas.fill();
    canvas.arc(
      this.x + (this.radius + 6) * Math.cos(this.aim),
      this.y + (this.radius + 6) * (Math.sin(this.aim) * -1),
      5,
      0,
      Math.PI * 2,
      false
    );
    canvas.fill();
    // pX + pRad * (Math.cos(angle))
  }

  update(x, y, aim) {
    this.x += x;
    this.y += y;
    this.aim = aim;
    this.draw();
  }
}

class Projectile {
  constructor({ x, y, radius, color, velocity }) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
  }
  draw() {
    canvas.beginPath();
    canvas.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    canvas.fillStyle = this.color;
    canvas.fill();
  }
  update() {
    this.draw();
    this.x += this.velocity.x;
    this.y += this.velocity.y;
  }
}
