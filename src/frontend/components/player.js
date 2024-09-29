import { endGame } from "../script.js"

const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext("2d");

export class Player {

    constructor(){
        this.health = 5; 
        this.nose_x = null;
        this.nose_y = null;
        this.left_wrist_x = null;
        this.left_wrist_y = null;
        this.right_wrist_x = null;
        this.right_wrist_y = null;
        this.isColliding = false;
        this.width = 50;
        this.height = 50;
    }

    draw() {
        ctx.fillStyle = 'blue';
        ctx.fillRect(this.left_wrist_x, this.left_wrist_y, this,width, this.height);
        ctx.fillRect(this.right_wrist_x, this.right_wrist_y, this,width, this.height);
        ctx.fillStyle = this.isColliding ? 'orange' : 'blue'; 
        ctx.fillRect(this.nose_x, this.nose_y, this,width, this.height);
    }
    
    update(player1Detection){
        this.nose_x = player1Detection['nose'].x;
        this.nose_y = player1Detection['nose'].y;
        this.left_wrist_x = player1Detection['left_wrist'].x;
        this.left_wrist_y = player1Detection['left_wrist'].y;
        this.right_wrist_x = player1Detection['right_wrist'].x;
        this.right_wrist_y = player1Detection['right_wrist'].y;
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