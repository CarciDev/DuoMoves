import { MovingObject } from './components/movingObjects.js'
import { Player, getNormalizedCanvasCoordinates } from './components/player.js'

const startGameButton = document.getElementById('startGameButton')
const playAgainButton = document.getElementById('playAgainButton')
const exitGameButton = document.getElementById('exitGameButton')
const startScreen = document.getElementById('startScreen')
const canvas = document.getElementById('myCanvas')
const ctx = canvas.getContext('2d')
const gameHeader = document.querySelector('header')
const timerDisplay = document.getElementById('timer')
const gameOverMessage = document.getElementById('gameOverMessage')
const winnerMessage = document.getElementById('winnerMessage')

const countdownDisplay = document.createElement('div')
countdownDisplay.style.position = 'absolute'
countdownDisplay.style.top = '50%'
countdownDisplay.style.left = '50%'
countdownDisplay.style.transform = 'translate(-50%, -50%)'
countdownDisplay.style.fontSize = '48px'
countdownDisplay.style.color = 'white'
countdownDisplay.style.display = 'none'
document.body.appendChild(countdownDisplay)

let timeLeft = 60
let gameInterval
let countdownInterval
let isPaused = true

function resizeCanvas() {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}
resizeCanvas()
window.addEventListener('resize', resizeCanvas)

// start a game when button is clicked
startGameButton.addEventListener('click', () => {
  gameHeader.style.visibility = ''
  startScreen.style.display = 'none'
  canvas.style.display = 'block'
  isPaused = false 
  countdownInterval = setInterval(updateTimer, 1000)
  createMovingObjects()
})

function updateTimer() {
  if (isPaused) {
    return
  }
  timeLeft--
  timerDisplay.innerText = 'TIME: ' + timeLeft

  if (timeLeft <= 0) {
    clearInterval(countdownInterval) // countdown stops
    endGame()
  }
}

export function endGame() {
  cancelAnimationFrame(gameInterval)

  timerDisplay.style.display = 'none'

  document.getElementById('gameControls').style.display = 'block'
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  if (player1.health > player2.health) {
    winnerMessage.innerText = 'PLAYER 1 WINS.'
  } else if (player2.health > player1.health) {
    winnerMessage.innerText = 'PLAYER 2 WINS.'
    console.log("Here");
  } else {
    winnerMessage.innerText = 'DRAW'
  }

  // setTimeout(() => {
  //     window.location.href = 'index.html';
  // }, 5000);
}

// Collision detection function
function detectCollision(obj1, obj2) {
  if (obj1 === null || obj2 === null) {
    return false
  }
  return (
    obj1.x < obj2.x + obj2.width &&
    obj1.x + obj1.width > obj2.x &&
    obj1.y < obj2.y + obj2.height &&
    obj1.y + obj1.height > obj2.y
  )
}

// creating moving objects
let movingObjects = []

function createMovingObjects() {
  const movementTypes = ['straight', 'angle', 'parabola']

  // Bad guys
  for (let i = 0; i < 12; i++) {
    const x = Math.random() * (canvas.width - 150)
    const y = Math.random() * (canvas.height - 50)
    const width = 50
    const height = 50
    const dx = Math.random() * 2 - 1
    const dy = 2
    const color = 'red'
    const isEnemy = true
    const movementType =
      movementTypes[Math.floor(Math.random() * movementTypes.length)]
    movingObjects.push(
      new MovingObject(
        x,
        y,
        width,
        height,
        dx,
        dy,
        color,
        isEnemy,
        movementType
      )
    )
  }

  // Good guys
  for (let i = 0; i < 3; i++) {
    const x = Math.random() * (canvas.width - 150)
    const y = Math.random() * (canvas.height - 50)
    const width = 50
    const height = 50
    const dx = Math.random() * 2 - 1 // Random dx for angle movement
    const dy = 2
    const color = 'green'
    const isEnemy = false
    const movementType =
      movementTypes[Math.floor(Math.random() * movementTypes.length)]
    movingObjects.push(
      new MovingObject(
        x,
        y,
        width,
        height,
        dx,
        dy,
        color,
        isEnemy,
        movementType
      )
    )
  }
}

const player1 = new Player(1)
const player2 = new Player(2)
let mouseX = 1
let mouseY = 1

window.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect()
    // const scaleX = canvas.width / rect.width
    // const scaleY = canvas.height / rect.height
    // mouseX = (event.clientX - rect.left) * scaleX
    // mouseY = (event.clientY - rect.top) * scaleY
  const { x, y } = getNormalizedCanvasCoordinates(event.clientX, event.clientY)
  mouseX = x
  mouseY = y
})

function animate() {
  if (detections === null || detections.length === 2) {
    isPaused = false
  } else {
    isPaused = true
  }

  if (isPaused) {
    gameInterval = requestAnimationFrame(animate)
    return
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  try {
    const [detectionA, detectionB] = detections

    const playerAX = detectionA['nose'].x
    const playerBX = detectionB['nose'].x

    if (playerAX < playerBX) {
      // player 1 is on the left side (smaller x-coordinate)
      player1.update(detectionA)
      player2.update(detectionB)
    } else {
      player1.update(detectionB)
      player2.update(detectionA)
    }
  } catch (e) {
    player1.update({ nose: { x: mouseX, y: mouseY } })
  }

  //   try {
  //     let player1Detection = detections[0]
  //     player1.update(player1Detection)
  //     player2.update(player1Detection)
  //   } catch (e) {
  //     console.log('no detections')
  //   }

  movingObjects.forEach((obj) => {
    obj.update()
    for (let player of [player1, player2]) {
      if (detectCollision(obj, player.nose)) {
        obj.isColliding = true
        player.isColliding = true
        player.loseHealth(obj)
        obj.isDeleted = true
      } else if (
        detectCollision(obj, player.leftWrist) ||
        detectCollision(obj, player.rightWrist)
      ) {
        player.isColliding = false
        obj.isColliding = false
        obj.isDeleted = true
      }
    }
  })

  movingObjects = movingObjects.filter((obj) => !obj.isDeleted)
  gameInterval = requestAnimationFrame(animate)
}

animate()

document.addEventListener('DOMContentLoaded', () => {
  const playAgainButton = document.getElementById('playAgainButton')
  const exitGameButton = document.getElementById('exitGameButton')

  playAgainButton.addEventListener('click', () => {
    resetGame()
    animate()
  })

  exitGameButton.addEventListener('click', () => {
    window.location.href = 'thankYou.html'
  }) 
})

function resetGame() {
  clearInterval(countdownInterval)
  cancelAnimationFrame(gameInterval)

  for (let player of [player1, player2]) {
    player.health = 5;
  }

  timeLeft = 60
  movingObjects = []
  createMovingObjects()

  document.getElementById('gameControls').style.display = 'none'
  timerDisplay.style.display = 'block'
  timerDisplay.innerText = 'TIME: ' + timeLeft
}
