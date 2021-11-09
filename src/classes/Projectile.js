export default class Projectile {
  constructor({ x, y, radius, color, velocity }) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
  }

  draw(context) {
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    context.fillStyle = this.color;
    context.fill();
    this.x += this.velocity.x;
    this.y += this.velocity.y;
  }

  update(context) {
    this.draw(context);

    this.x += this.velocity.x;
    this.y += this.velocity.y;
  }
}
