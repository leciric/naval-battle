const socket = io('http://localhost:3000/');

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

    joystick.on('move', (_, { vector, force }) => {
      socket.emit('moving', {vector, force});
    })

    joystick.on('end', () => {
      socket.emit('stop-moving');
    })

 
