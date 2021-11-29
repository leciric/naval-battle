const socket = io("http://localhost:3000/");

const shot = document.getElementById("shot");

const joystick = nipplejs.create({
  color: "#6e3216",
  zone: document.getElementById("nipple"),
  mode: "static",
  position: {
    left: "25%",
    top: "50%",
  },
});

joystick.on("move", (_, { vector, force, angle }) => {
  const playerIndex = document.getElementById("playerIndex").value || 0;

  socket.emit("moving", { vector, force, angle, playerIndex });
});

joystick.on("end", () => {
  const playerIndex = document.getElementById("playerIndex").value || 0;

  socket.emit("stop-moving", Number(playerIndex));
});

function handleButtonShotClick() {
  const playerIndex = document.getElementById("playerIndex").value || 0;

  socket.emit("shot", Number(playerIndex));
}
