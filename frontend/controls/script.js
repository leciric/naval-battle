const socket = io('http://192.168.15.6:3000/');

const playerIndex = document.getElementById('playerIndex').value || 0;

const shot = document.getElementById('shot');

console.log(playerIndex)

const joystick = nipplejs.create({
      color: "#6e3216",
      zone: document.getElementById("nipple"),
      mode: "static",
      position: {
        left: '25%',
        top: '50%'
      },
    });

    let isMoving = false;

    console.log(isMoving)

    joystick.on('move', (_, { vector, force, angle }) => {

      socket.emit('moving', {vector, force, angle});
    })

    joystick.on('end', () => {
      socket.emit('stop-moving');
    })

    function handleButtonShotClick() {
      socket.emit('shot', playerIndex);
    }