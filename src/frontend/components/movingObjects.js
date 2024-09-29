const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext("2d");

export class MovingObject {
    constructor(x, y, width, height, dx, dy, color, isEnemy){
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.dx = dx; 
        this.dy = dy; 
        this.color = color;
        this.isColliding = false;
        this.isEnemy = isEnemy;
        this.isDeleted = false;
    }

    draw() {
        ctx.fillStyle = this.isColliding ? 'red' : this.color; 
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    update() {
        if (!this.isDeleted){
            this.x += this.dx;
            this.y += this.dy;

        if (this.y > canvas.height) {
            this.x = Math.random() * (canvas.width - this.width);
            this.y = -this.height; 
        }

            this.draw();
        }
    }

    delete() {
        this.isDeleted = true;
    }
}
