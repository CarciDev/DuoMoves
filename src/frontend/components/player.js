import { endGame } from "../script.js"

const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext("2d");

export class Player {

    constructor(){
        this.health = 5; 
        this.nose = null;
        this.leftWrist = null;
        this.rightWrist = null;
        this.isColliding = false;
        this.width = 50;
        this.height = 50;
    }

    draw() {
        ctx.fillStyle = 'blue';
        if (this.leftWrist) {
            ctx.fillRect(this.leftWrist.x, this.leftWrist.y, this.width, this.height);
        }
        if (this.rightWrist) {
            ctx.fillRect(this.rightWrist.x, this.rightWrist.y, this.width, this.height);
        }
        if (this.nose) {
            ctx.fillStyle = this.isColliding ? 'orange' : 'blue'; 
            ctx.fillRect(this.nose.x, this.nose.y, this.width, this.height);
        }
    }
    
    update({nose = null, left_wrist = null, right_wrist = null}) {
        this.nose = nose;
        this.leftWrist = left_wrist;
        this.rightWrist = right_wrist;
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