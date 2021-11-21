const socket = io('http://localhost:3000/');

var messages = document.getElementById('messages');
var form = document.getElementById('form');
var input = document.getElementById('input');

var shooting = true;
var isDead = false;

const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

c.lineWidth=4;
c.fillStyle='blue';

canvas.width = innerWidth
canvas.height = innerHeight

class Player {
  constructor(id, x, y, radius, color, live) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.live = live;
  }

  draw() {
    c.beginPath()
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
    c.fillStyle = this.color
    c.fill()
  }

  update(x, y) {
    this.x += x;
    this.y += y;
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


if(!isGameStarted){
  socket.emit('newGame', {x: canvas.width / 2, y: canvas.height / 2});
}

// posição onde o player irá iniciar
const x = canvas.width / 2
const y = canvas.height / 2

let player;
let playerId;

socket.on('init', ({id, x, y}) => {
  if(!playerId) {
    
    playerId = id
    
    players.push(new Player(id, x, y, 30, 'blue', 10));
  }
})

// array de projeteis disparados
const projectiles = []

const players = []




function animate() {
  requestAnimationFrame(animate)
  c.clearRect(0, 0, canvas.width, canvas.height)

  if(players.length > 0) {

    players.forEach(playerItem => {
      playerItem.draw();
      c.font='28px arial';
      c.fillText('Vida: ' + playerItem.live,50,50);
    })
  }

  if(isDead){
    c.font='50px arial';
    c.fillText('GAME OVER!!!', 50,50);
  }
    

  projectiles.forEach((projectile, index) => {
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
  
  isCollide()
}

function isCollide(){
  if (players.length > 0){
    players.forEach((playerItem, index) => {
      //variável auxiliar para remoção do player da list
      var playerindex = index;
      if (projectiles.length > 0){
        projectiles.forEach((projectile,index) => {
          projectile.update();
          var dx = playerItem.x - projectile.x;
          var dy = playerItem.y - projectile.y;
          var distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < playerItem.radius + projectile.radius){
            //colisão detectada!
            projectiles.splice(index,1)
            playerItem.color = 'green';
            playerItem.live = playerItem.live - 1;
            if(playerItem.live <= 0){
              players.splice(playerindex,1);
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

    if(players.length > 0) {
      players.forEach(player => {
        const index = parsedState.players.findIndex(item => item.id === player.id)
        player.update(parsedState.players[index - 1].x, parsedState.players[index - 1].y)
      })
    }
  })

// socket fica ouvindo esperando pelo evento de tiro que atingir o lado esquerdo
socket.on('shot-reachs-left', msg => {
  projectiles.push(new Projectile({ ...msg, x: canvas.width }))
});

// socket fica ouvindo esperando pelo evento de tiro que atingir o lado direito
socket.on('shot-reachs-right', msg => {
  console.log(msg)
  projectiles.push(new Projectile({ ...msg, x: 5 }))
});

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

// função que dispara os tiros por evento de click.
addEventListener('click', event => {
  // angulo que o projetil irá seguir
  const angle = Math.atan2(event.clientY - canvas.height / 2, event.clientX - canvas.width / 2)

  // velocidade do projetil
  const velocity = {
    x: Math.cos(angle) * 5,
    y: Math.sin(angle) * 5,
  }

  // salvando a localizacao do player
  var pX, pY, pRad;

  if(players.length > 0) {
    players.forEach(playerItem => {
      pX = playerItem.x;
      pY = playerItem.y;
      pRad = playerItem.radius;
    })
  }

  // instancia um novo projetil (ainda está com posição fixa de inicio, exatamente onde o player é instanciado)
  // Iremos implementar para isso acompanhar a posição do player.
  projectiles.push(new Projectile(
    {
      //utilizando a localização do player (inclui o radius do player para que o tiro ficasse para "fora" do jogador)
      //precisa ver como utilizar a "frente" do jogador para iniciar o disparo.
      x: pX + pRad + 5,
      y: pY ,
      radius: 5,
      color: 'red',
      velocity,
    }
  ))
});

  animate()