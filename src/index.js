import { connect, io } from "socket.io-client";

import Player from "./classes/Player";
import Projectile from "./classes/Projectile";

const socket = io();

const canvas = document.querySelector("canvas");
const context = canvas.getContext("2d");

canvas.width = innerWidth;
canvas.height = innerHeight;

const resizeCanvas = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
};

window.addEventListener("resize", resizeCanvas, false);

// posição onde o player irá iniciar
const x = canvas.width / 2;
const y = canvas.height / 2;

const player = new Player(context, x, y, 30, "#ff0000");

// array de projeteis disparados
const projectiles = [];

function animate() {
  requestAnimationFrame(animate);
  context.clearRect(0, 0, canvas.width, canvas.height);
  player.draw(context);

  projectiles.forEach((projectile, index) => {
    projectile.update(context);

    if (projectile.x - projectile.radius < 0) {
      socket.emit("shot-reachs-left", projectile);
      projectiles.splice(index, 1);
    }

    if (projectile.x - projectile.radius > canvas.width) {
      socket.emit("shot-reachs-right", projectile);
      projectiles.splice(index, 1);
    }

    if (projectile.y - projectile.radius > canvas.height) {
      projectiles.splice(index, 1);
    }

    if (projectile.y - projectile.radius < 0) {
      projectiles.splice(index, 1);
    }
  });
}

let reconnection = true;
let reconnectionDelay = 5000;
let reconnectionTry = 0;

// socket fica ouvindo esperando pelo evento de tiro que atingir o lado esquerdo
socket.on("shot-reachs-left", (msg) => {
  projectiles.push(new Projectile({ ...msg, x: canvas.width }));
});

// socket fica ouvindo esperando pelo evento de tiro que atingir o lado direito
socket.on("shot-reachs-right", (msg) => {
  projectiles.push(new Projectile({ ...msg, x: 5 }));
});

// caso ocorra algum erro durante a conexão com o socket
socket.on("connect_error", function () {
  reconnectionTry++;
  console.log("Reconnection attempt #" + reconnectionTry);
});

socket.on("disconnect", function () {
  socket.disconnect();
  console.log("client disconnected");
  if (reconnection === true) {
    setTimeout(function () {
      console.log("client trying reconnect");
      connect();
    }, reconnectionDelay);
  }
});

// função que dispara os tiros por evento de click.
document.addEventListener("click", (event) => {
  // angulo que o projetil irá seguir

  const angle = Math.atan2(
    event.clientY - canvas.height / 2,
    event.clientX - canvas.width / 2
  );

  // velocidade do projetil
  const velocity = {
    x: Math.cos(angle) * 5,
    y: Math.sin(angle) * 5,
  };

  // TODO:
  // instancia um novo projetil (ainda está com posição fixa de inicio, exatamente onde o player é instanciado)
  // Iremos implementar para isso acompanhar a posição do player.
  projectiles.push(
    new Projectile({
      x: player.x,
      y: player.y,
      radius: 5,
      color: "red",
      velocity,
    })
  );
});

animate();
