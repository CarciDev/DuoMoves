const startGameButton = document.getElementById('startGameButton');
const startScreen = document.getElementById('startScreen');
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext("2d");

let p1Health = 100; // wait for kesh's code
let p2Health = 100; // wait for kesh's code
let timeLeft = 60;
let gameInterval;
let countdownInterval;

// const healthBars = document.getElementById('healthBars');
const timerDisplay = document.getElementById('timer');
const gameOverMessage = document.getElementById('gameOverMessage');
const winnerDisplay = document.getElementById('winner');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// start a game when button is clicked
startGameButton.addEventListener('click', () => {
    startScreen.style.display = 'none'; 
    canvas.style.display = 'block'; 
    startGame(); 
});

// game logic starts here
function startGame() {
    console.log("started game!");
    // healthBars.style.display = 'flex';
    timerDisplay.style.display = 'block';
    gameOverMessage.style.display = 'none';
    countdownInterval = setInterval(updateTimer, 1000); // Update timer every second
    gameInterval = setInterval(animate, 100);
    // updateHealthBars(); // wait for kesh's code
    // animate();
}

function updateTimer() {
    timeLeft--;
    timerDisplay.innerText = 'TIME: ' + timeLeft;

    if (timeLeft <= 0) {
        clearInterval(countdownInterval); // countdown stops
        endGame();
    }
}

function endGame() {
    timerDisplay.style.display = 'none'; 
    gameOverMessage.style.display = 'block'; 

    if (p1Health > p2Health) {
        winnerDisplay.innerText = 'PLAYER 1 WINS.';
    } else if (p2Health > p1Health) {
        winnerDisplay.innerText = 'PLAYER 2 WINS.';
    } else {
        winnerDisplay.innerText = 'DRAW';
    }
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
        this.health--;
        console.log(`${this.name} lost health! Current health: ${this.health}`);
    }

    gainHealth(){
        this.health++;
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



// Player character
// TODO: Add second player character once configured with camera
const player1 = new Player(0, canvas.height / 2 - 25, 50, 50, "Kesh");
let mouseX = player1.x;
let mouseY = player1.y;

// Mouse move event listener to update player's position
canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;
});

// Animation loop
function animate() {
    // Clear the canvas before each frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the character
    player1.update(mouseX, mouseY);

    // Draw and update the moving objects, check for collisions
    movingObjects.forEach((obj) => {
        obj.update();
        // Detect collision with both statues
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

    // Remove the objects that are marked as deleted
    movingObjects = movingObjects.filter(obj => !obj.isDeleted);

    // Request the next animation frame
    requestAnimationFrame(animate);
}

// Start the animation
animate();
