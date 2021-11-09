import nipplejs from "nipplejs";

export default class Controller {
  constructor(player) {
    this._nipple = nipplejs.create({
      color: "#6e3216",
      zone: document.getElementById("nipple"),
      mode: "static",
    });

    this._nipple.on("move", (_, { vector, force }) => {
      console.log(vector, force);
      player.update(vector.x * force, vector.y * -force);
    });
  }
}
