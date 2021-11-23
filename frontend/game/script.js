const socket = io('http://localhost:3000/');

var messages = document.getElementById('messages');
var form = document.getElementById('form');
var input = document.getElementById('input');

var shooting = true;
var isDead = false;

const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

c.lineWidth = 4;
c.fillStyle = 'blue';

canvas.width = innerWidth
canvas.height = innerHeight

class Player {
  constructor(id, x, y, radius, color, live, aim) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.live = live;
    this.aim = aim;
  }

  draw() {
    c.beginPath()
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
    c.fillStyle = this.color
    c.fill()
    c.arc(this.x + (this.radius + 6) * (Math.cos(this.aim)), this.y + (this.radius + 6) * (Math.sin(this.aim) * -1), 5, 0, Math.PI * 2, false)
    c.fill()
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
    c.beginPath()
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
    c.fillStyle = this.color
    c.fill()
  }
  update() {
    this.draw()
    this.x += this.velocity.x
    this.y += this.velocity.y
  }
}

let isGameStarted = false;


if (!isGameStarted) {
  socket.emit('newGame', { x: canvas.width / 2, y: canvas.height / 2, canvasWidth: canvas.width, canvasHeight: canvas.height });
}

// posição onde o player irá iniciar
const x = canvas.width / 2
const y = canvas.height / 2

let player;
let playerId;
// array de projeteis disparados
const projectiles = []

let players = []

socket.on('init', ({ id, x, y }) => {
  if (!playerId) {

    playerId = id

    players.push(new Player(id, x, y, 30, 'blue', 1000, 0));
  }
})



function animate() {
  requestAnimationFrame(animate)
  c.clearRect(0, 0, canvas.width, canvas.height)

  if (players.length > 0) {

    players.forEach(playerItem => {
      console.log(playerItem)
      playerItem.draw();
      c.font = '12px arial';
      c.fillText('Vida: ' + playerItem.live, playerItem.x - 28, playerItem.y - 50);
    })
  }

  if (isDead) {
    c.font = '50px arial';
    c.fillText('GAME OVER!!!', 50, 50);
  }


  projectiles.forEach((projectile, index) => {
    console.log(projectile)
    projectile.update()

    if (projectile.x - projectile.radius < 0) {

      socket.emit('shot-reachs-left', projectile);
      projectiles.splice(index, 1)
    }

    if (projectile.x - projectile.radius > canvas.width) {
      socket.emit('shot-reachs-right', projectile);
      projectiles.splice(index, 1)
    }

    if (projectile.y - projectile.radius > canvas.height) {
      projectiles.splice(index, 1)
    }

    if (projectile.y - projectile.radius < 0) {
      projectiles.splice(index, 1)
    }
  })

  players.forEach((player, index) => {
    if (player.x - player.radius < 0) {

      socket.emit('player-reachs-left', player);
      players.splice(index, 1)
    }

    if (player.x - player.radius > canvas.width) {
      socket.emit('player-reachs-right', player);
      players.splice(index, 1)
    }

    if (player.y - player.radius > canvas.height) {
      player.y = canvas.height - 5;
    }

    if (player.y - player.radius < 0) {
      player.y = 20;
    }
  })

  isCollide()
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
            projectiles.splice(index, 1)
            playerItem.color = 'green';
            playerItem.live = playerItem.live - 1;
            if (playerItem.live <= 0) {
              players.splice(playerindex, 1);
              isDead = true;
              console.log('O jogador morreu!')
            }
          }

        })
      }
    })
  }
}



var reconnection = true,
  reconnectionDelay = 5000,
  reconnectionTry = 0;

socket.on('gameState', (state) => {
  const parsedState = JSON.parse(state)

  if (players.length > 0) {

    players.forEach(player => {
      const index = parsedState.players.findIndex(item => item.id === player.id)

      if (index >= 0) {

        if (player.screen === playerId) {
          new Player(...item)
        }

        console.log(players)

        const selectedPlayer = parsedState.players[index]
        player.update(selectedPlayer.x, selectedPlayer.y, selectedPlayer.aim)


        if (selectedPlayer.isShooting) {
          // salvando a localizacao do player
          var pX, pY, pRad, pAim;

          if (players.length > 0) {
            players.forEach(playerItem => {
              pX = playerItem.x;
              pY = playerItem.y;
              pRad = playerItem.radius;
              pAim = playerItem.aim;
            })
          }

          // velocidade do projetil
          const velocity = {
            x: Math.cos(pAim) * 5,
            y: (Math.sin(pAim) * -1) * 5,
          }

          // instancia um novo projetil (ainda está com posição fixa de inicio, exatamente onde o player é instanciado)
          // Iremos implementar para isso acompanhar a posição do player.
          projectiles.push(new Projectile(
            {
              //utilizando a localização do player (inclui o radius do player para que o tiro ficasse para "fora" do jogador)
              //precisa ver como utilizar a "frente" do jogador para iniciar o disparo.

              x: pX + 1 + pRad * (Math.cos(pAim)),
              y: pY + 1 + pRad * (Math.sin(pAim) * -1),
              radius: 5,
              color: 'red',
              velocity,
            }
          ))
        }
      }


    })
  }
})

// socket fica ouvindo esperando pelo evento de tiro que atingir o lado esquerdo
socket.on('shot-reachs-left', msg => {
  console.log('teste')
  projectiles.push(new Projectile({ ...msg, x: canvas.width }))
});

// socket fica ouvindo esperando pelo evento de tiro que atingir o lado direito
socket.on('shot-reachs-right', msg => {

  console.log(msg)
  projectiles.push(new Projectile({ ...msg, x: 5 }))
});

// // socket fica ouvindo esperando pelo evento de tiro que atingir o lado esquerdo
// socket.on('player-reachs-left', msg => {
//   console.log('teste')
//   players.forEach(item => {
//     if(item.id === playerId) {
//       players.push(new Player({ ...msg, x: canvas.width }))
//     }
//   })
// });

// // socket fica ouvindo esperando pelo evento de tiro que atingir o lado direito
// socket.on('player-reachs-right', msg => {
//   players.forEach(item => {
//     if(item.id === playerId) {
//       players.push(new Player({ ...msg, x: 5 }))
//     }
//   })
// });

// caso ocorra algum erro durante a conexão com o socket
socket.on("connect_error", function (e) {
  reconnectionTry++;
  console.log("Reconnection attempt #" + reconnectionTry);
});

socket.on('disconnect', function () {
  socket.disconnect();
  console.log("client disconnected");
  if (reconnection === true) {
    setTimeout(function () {
      console.log("client trying reconnect");
      connectClient();
    }, reconnectionDelay);
  }
})


animate()