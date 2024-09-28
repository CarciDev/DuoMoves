const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// class represent moving objects (and stationary object for rn before we get coords)
class MovingObject {
    constructor(x, y, width, height, dx, dy, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.dx = dx; 
        this.dy = dy; 
        this.color = color;
        this.isColliding = false;
    }

    draw() {
        ctx.fillStyle = this.isColliding ? 'red' : this.color; 
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    update() {
        this.x += this.dx;
        this.y += this.dy;

        // Check if the object has fallen off the screen
        if (this.y > canvas.height) {
            // Reset position to the top with a random x-coordinate
            this.x = Math.random() * (canvas.width - this.width);
            this.y = -this.height; // Start just above the top of the canvas
        }

        this.draw();
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
for (let i = 0; i < 10; i++) {
    const x = Math.random() * (canvas.width - 150);
    const y = Math.random() * (canvas.height - 50);
    const width = 50;
    const height = 50;
    const dx = 0; 
    const dy = 2; 
    const color = "#fff"; 
    movingObjects.push(new MovingObject(x, y, width, height, dx, dy, color));
}

// Create two statues (stationary objects)
const leftStatue = new MovingObject(50, canvas.height / 2 - 25, 50, 50, 0, 0, "#00f"); // Left statue
const rightStatue = new MovingObject(canvas.width - 100, canvas.height / 2 - 25, 50, 50, 0, 0, "#00f"); // Right statue

// Animation loop
function animate() {
    // Clear the canvas before each frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the statues
    leftStatue.draw();
    rightStatue.draw();

    // Draw and update the moving objects, check for collisions
    movingObjects.forEach((obj) => {
        obj.update();
        // Detect collision with both statues
        if (detectCollision(obj, leftStatue) || detectCollision(obj, rightStatue)) {
            obj.isColliding = true;
        } else {
            obj.isColliding = false;
        }
    });

    // Request the next animation frame
    requestAnimationFrame(animate);
}

// Start the animation
animate();
