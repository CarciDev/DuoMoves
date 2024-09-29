const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext("2d");

export class MovingObject {
    constructor(x, y, width, height, dx, dy, color, isEnemy, movementType){
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
        this.movementType = movementType;
        this.startY = y;
    }

    draw() {
        ctx.fillStyle = this.isColliding ? 'red' : this.color; 
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    update() {
        if (!this.isDeleted){
            switch (this.movementType) {
                case 'straight':
                    this.y += this.dy;
                    break;
                case 'angle':
                    this.x += this.dx;
                    this.y += this.dy;
                    break;
                case 'parabola':
                    const intensity = 0.2;
                    this.y = this.startY - intensity * Math.pow(this.x - canvas.width / 2, 2);
                    this.x += this.dx;
                    break;
            }

            if (this.y > canvas.height || this.x > canvas.width || this.x < 0) {
                this.x = Math.random() * (canvas.width - this.width);
                this.y = -this.height; 
                this.startY = this.y; // Reset startY for parabolic movement
            }

            this.draw();
        }
    }

    delete() {
        this.isDeleted = true;
    }
}
