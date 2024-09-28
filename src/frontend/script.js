const startGameButton = document.getElementById('startGameButton');
const playAgainButton = document.getElementById('playAgainButton');
const exitGameButton = document.getElementById('exitGameButton');
const startScreen = document.getElementById('startScreen');
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext("2d");
const timerDisplay = document.getElementById('timer');
const gameOverMessage = document.getElementById('gameOverMessage');
const winnerDisplay = document.getElementById('winner');
// const healthBars = document.getElementById('healthBars');


const countdownDisplay = document.createElement('div');
countdownDisplay.style.position = 'absolute';
countdownDisplay.style.top = '50%';
countdownDisplay.style.left = '50%';
countdownDisplay.style.transform = 'translate(-50%, -50%)';
countdownDisplay.style.fontSize = '48px';
countdownDisplay.style.color = 'white';
countdownDisplay.style.display = 'none';
document.body.appendChild(countdownDisplay);

let p1Health = 5; 
let p2Health = 5; 
let timeLeft = 60;
let gameInterval;
let countdownInterval;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

function startCountdown() {
    let countdownValue = 3; 
    countdownDisplay.style.display = 'block'; 

    const countdown = setInterval(() => {
        countdownDisplay.innerText = countdownValue; 
        countdownValue--;

        if (countdownValue < 0) {
            clearInterval(countdown); 
            countdownDisplay.style.display = 'none'; 
            startGame(); 
        }
    }, 1000); 
}

function startGame() {
    countdownInterval = setInterval(updateTimer, 1000); 
    animate();
}

// start a game when button is clicked
startGameButton.addEventListener('click', () => {
    startScreen.style.display = 'none'; 
    canvas.style.display = 'block'; 
    countdownInterval = setInterval(updateTimer, 1000); 
    animate();
});

function updateTimer() {
    timeLeft--;
    timerDisplay.innerText = 'TIME: ' + timeLeft;

    if (timeLeft <= 0) {
        clearInterval(countdownInterval); // countdown stops
        endGame(time);
    }
}

function endGame(reason) {
    cancelAnimationFrame(gameInterval);
    
    timerDisplay.style.display = 'none'; 

    document.getElementById('gameControls').style.display = 'block';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height); 

        // if (reason === 'time') {
        //     winnerDisplay.innerText = 'TIME UP!';
        // } else {
        //     if (p1Health > p2Health) {
        //         winnerDisplay.innerText = 'PLAYER 1 WINS.';
        //     } else if (p2Health > p1Health) {
        //         winnerDisplay.innerText = 'PLAYER 2 WINS.';
        //     } else {
        //         winnerDisplay.innerText = 'DRAW';
        //     }
        // }
    

    // setTimeout(() => {
    //     window.location.href = 'index.html';
    // }, 5000);
}

// class represent moving objects (and stationary object for rn before we get coords)
class MovingObject {
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

class Player {
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

// Collision detection function
function detectCollision(obj1, obj2) {
    return (
        obj1.x < obj2.x + obj2.width &&
        obj1.x + obj1.width > obj2.x &&
        obj1.y < obj2.y + obj2.height &&
        obj1.y + obj1.height > obj2.y
    );
}

// creating moving objects
let movingObjects = [];

function createMovingObjects() {
    // Bad guys
    for (let i = 0; i < 10; i++) {
        const x = Math.random() * (canvas.width - 150);
        const y = Math.random() * (canvas.height - 50);
        const width = 50;
        const height = 50;
        const dx = 0; 
        const dy = 2; 
        const color = "red"; 
        const isEnemy = true;
        movingObjects.push(new MovingObject(x, y, width, height, dx, dy, color, isEnemy));
    }

    // Good guys
    for (let i = 0; i < 5; i++){
        const x = Math.random() * (canvas.width - 150);
        const y = Math.random() * (canvas.height - 50);
        const width = 50;
        const height = 50;
        const dx = 0; 
        const dy = 2; 
        const color = "green"; 
        const isEnemy = false;
        movingObjects.push(new MovingObject(x, y, width, height, dx, dy, color, isEnemy));
    }
}

// Player character
// TODO: Add second player character once configured with camera
const player1 = new Player(0, canvas.height / 2 - 25, 50, 50, "player 1");
let mouseX = player1.x;
let mouseY = player1.y;

// Mouse move event listener to update player's position
canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;
});

createMovingObjects();

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    player1.update(mouseX, mouseY);

    movingObjects.forEach((obj) => {
        obj.update();
        if (detectCollision(obj, player1)) {
            if (obj.isEnemy){
                obj.isColliding = true;
                player1.isColliding = true;
                player1.loseHealth();
            }
            else {
                player1.isColliding = true;
                player1.gainHealth();
            }
            obj.isDeleted = true;
        } else {
            obj.isColliding = false;
            player1.isColliding = false;
        }
    });

    movingObjects = movingObjects.filter(obj => !obj.isDeleted);
    gameInterval = requestAnimationFrame(animate);

}

document.addEventListener('DOMContentLoaded', () => {
    const playAgainButton = document.getElementById('playAgainButton');
    const exitGameButton = document.getElementById('exitGameButton');

    playAgainButton.addEventListener('click', () => {
        resetGame(); 
        animate();
    });

    exitGameButton.addEventListener('click', () => {
        window.location.href = 'index.html'; 
    });
});

function resetGame() {
    clearInterval(countdownInterval); 
    cancelAnimationFrame(gameInterval); 

    p1Health = 5; 
    p2Health = 5; 
    timeLeft = 60; 
    createMovingObjects();


    document.getElementById('gameControls').style.display = 'none'; 
    timerDisplay.style.display = 'block'; 
    timerDisplay.innerText = 'TIME: ' + timeLeft; 
}
