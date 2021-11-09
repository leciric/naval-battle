import Controller from "./Controller";

export default class Player {
  constructor(context, x, y, radius, color, velocity) {
    this._context = context;

    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;

    this.controller = new Controller(this);
  }

  draw() {
    this._context.beginPath();
    this._context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    this._context.fillStyle = this.color;
    this._context.fill();
  }

  update(x, y) {
    this.x += x;
    this.y += y;

    this.draw();
  }
}
