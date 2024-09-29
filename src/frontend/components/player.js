import { endGame } from '../script.js'

const canvas = document.getElementById('myCanvas')
const ctx = canvas.getContext('2d')

class BodyPart {
  static size = 50
  constructor({ x, y }) {
    this.x = x - BodyPart.size / 2
    this.y = y - BodyPart.size / 2
    this.width = BodyPart.size
    this.height = BodyPart.size
  }
}

export class Player {
  constructor(id) {
    this.health = 5
    this.nose = null
    this.leftWrist = null
    this.rightWrist = null
    this.isColliding = false
    this.width = 50
    this.height = 50
    this.id = id
  }

  draw() {
    ctx.fillStyle = 'blue'
    if (this.leftWrist) {
      ctx.fillRect(
        this.leftWrist.x,
        this.leftWrist.y,
        this.leftWrist.width,
        this.leftWrist.height
      )
    }
    if (this.rightWrist) {
      ctx.fillRect(
        this.rightWrist.x,
        this.rightWrist.y,
        this.rightWrist.width,
        this.rightWrist.height
      )
    }
    if (this.nose) {
      ctx.fillStyle = this.isColliding ? 'orange' : 'blue'
      ctx.fillRect(this.nose.x, this.nose.y, this.nose.width, this.nose.height)
    }
  }

  update({ nose = null, left_wrist = null, right_wrist = null }) {
    if (nose) {
      this.nose = new BodyPart(nose)
    }
    if (left_wrist) {
      this.leftWrist = new BodyPart(left_wrist)
    }
    if (right_wrist) {
      this.rightWrist = new BodyPart(right_wrist)
    }
    this.draw()
  }

  loseHealth() {
    this.health = Math.max(0, this.health - 1)
    document.querySelector(`.health-${this.id}`).style.width = `${
      this.health * 20
    }%`
    if (this.health === 0) {
      endGame()
    }
  }

  gainHealth() {
    this.health = Math.min(5, this.health + 1)
    document.querySelector(`.health-${this.id}`).style.width = `${
      this.health * 20
    }%`
  }
}

export const getNormalizedCanvasCoordinates = (x, y) => {
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  return {
    x: (x - rect.left) * scaleX,
    y: (y - rect.top) * scaleY,
  }
}
