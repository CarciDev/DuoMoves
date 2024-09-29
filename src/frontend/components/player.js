import { endGame } from "../script.js"

const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext("2d");

export class Player {
    constructor(x, y, width, height, name) {
        this.health = 5; 
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.name = name;
        this.isColliding = false; 
    }

    draw() {
        ctx.fillStyle = this.isColliding ? 'orange' : 'green'; 
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    update(mouseX, mouseY) {
        this.x = mouseX - this.width / 2;
        this.y = mouseY - this.height / 2;
        this.draw();
    }

    loseHealth() {
        this.health = Math.max(0, this.health - 1); 
        console.log(`${this.name} lost health! Current health: ${this.health}`);
        if (this.health === 0) {
            endGame(); 
        }
    }

    gainHealth(){
        this.health = Math.min(5, this.health + 1); 
        console.log(`${this.name} gained health! Current health: ${this.health}`);
    }
}