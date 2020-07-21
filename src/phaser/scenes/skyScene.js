import Phaser from 'phaser'
import { scoreChanged, gameOver } from '../score'

/**
 *
 * @param {Phaser.Scene} scene
 * @param {number} totalWidth
 * @param {string} texture
 * @param {number} scrollFactor
 */
const createAligned = (scene, totalWidth, texture, scrollFactor) => {
  const getWidth = scene.textures.get(texture).getSourceImage().width
  const count = Math.ceil(totalWidth / getWidth) * scrollFactor
  let x = 0
  for (let i = 0; i < count; ++i) {
    const m = scene.add
      .image(x, scene.scale.height, texture)
      .setOrigin(0, 1)
      .setScrollFactor(scrollFactor)

    x += m.width
  }
}

let scoreText
let checkText
let checkAmount = 0
const checksToPass = 4
let currentSceneScore

const collectScore = (player, type) => {
  if (type.texture.key === 'react') {
    type.disableBody(true, true)
    currentSceneScore += 10
    scoreText.setText('Score: ' + currentSceneScore)
    scoreChanged(currentSceneScore)
  } else {
    type.disableBody(true, true)
    currentSceneScore += 20
    checkAmount += 1
    scoreText.setText('Score: ' + currentSceneScore)
    scoreChanged(currentSceneScore)
    checkText.setText('Trello: ' + checkAmount + ' / ' + checksToPass)
    if (checkAmount === checksToPass) {
      canAsk = true
    }
  }
}

let canAsk = false
let noQuestion
let paraLevelComplete = false

const askQuestion = () => {
  if (canAsk) {
    noQuestion.setText('Congrats, you have completed your trello card!')
    setTimeout(() => {
      paraLevelComplete = true
    }, 1000)
  } else {
    noQuestion.setText('Please come back with a complete trello card')
  }
}

let wall
let facing = ''
let player
let platforms
let lives = 4
let life = []
let healthBar
let health = 0
let wonGame = false
let isAlive = true
let trigger
let tutor
let check
let upDownPlatform
let leftRightPlatform
let bridge

const worldWidth = 2000

export default class SkyScene extends Phaser.Scene {
  constructor () {
    super('sky-scene')
  }

  preload () {
    // invis walls/triggers
    this.load.image('triggerBlock', 'assets/blocksTriggers/triggerBlock.png')
    this.load.image('base', '/assets/blocksTriggers/base.png')
    this.load.image('wallBlock', '/assets/blocksTriggers/wallBlock.png')

    // assets
    this.load.image('check', '/assets/check.png')
    this.load.image('platform', '/assets/Sky/platform.png')
    this.load.image('medPlatform', '/assets/Sky/platformMed2.png')
    this.load.image('smallPlatform', '/assets/Sky/platformSml1.png')
    this.load.image('block', '/assets/man/base.png')
    this.load.image('sky', '/assets/Jungle/sky.png')
    this.load.image('bgClouds', '/assets/Sky/bgClouds.png')
    this.load.image('mgClouds', '/assets/Sky/mgClouds.png')
    this.load.image('fgClouds', '/assets/Sky/fgClouds.png')
    this.load.image('lives', '/assets/Game/lives-icon.png')
    this.load.spritesheet('jumpRight', '/assets/man/jumpRight.png', {
      frameWidth: 60,
      frameHeight: 105
    })
    this.load.spritesheet('jumpLeft', '/assets/man/jumpLeft.png', {
      frameWidth: 60,
      frameHeight: 105
    })
    this.load.spritesheet('runLeft', '/assets/man/runLeft.png', {
      frameWidth: 63,
      frameHeight: 99
    })
    this.load.spritesheet('runRight', '/assets/man/runRight.png', {
      frameWidth: 63,
      frameHeight: 99
    })
    this.load.spritesheet('idleRight', '/assets/man/idleRight.png', {
      frameWidth: 57,
      frameHeight: 102
    })
    this.load.spritesheet('idleLeft', '/assets/man/idleLeft.png', {
      frameWidth: 57,
      frameHeight: 102
    })

    this.load.spritesheet('heart', '/assets/Game/Hearts/PNG/animated/border/heart_animated_2.png', {
      frameHeight: 17,
      frameWidth: 17
    })

    this.cursors = this.input.keyboard.createCursorKeys()
  }

  create (prevScore) {
    currentSceneScore = prevScore
    this.input.keyboard.on('keydown-' + 'LEFT', function (event) {
      facing = 'left'
    })
    this.input.keyboard.on('keydown-' + 'RIGHT', function (event) {
      facing = 'right'
    })
    const width = this.scale.width
    const height = this.scale.height
    const totalWidth = width * 10

    this.add.image(width * 0.5, height * 0.5, 'sky').setScrollFactor(0)

    createAligned(this, totalWidth, 'bgClouds', 0.15)
    createAligned(this, totalWidth, 'mgClouds', 0.3)
    createAligned(this, totalWidth, 'fgClouds', 0.5)

    // Collider floor & platforms

    wall = this.physics.add.staticGroup()
    wall.create(-10, 0, 'wallBlock')
    wall.create(worldWidth, 0, 'wallBlock')

    platforms = this.physics.add.staticGroup()
    platforms.create(100, 300, 'smallPlatform').setScale(0.4).refreshBody()
    platforms.create(150, 700, 'smallPlatform').setScale(0.4).refreshBody()
    platforms.create(900, 700, 'smallPlatform').setScale(0.4).refreshBody()
    platforms.create(1850, 730, 'smallPlatform').setScale(0.4).refreshBody()
    platforms.create(1000, 300, 'medPlatform').setScale(0.4).refreshBody()
    platforms.create(1850, 300, 'medPlatform').setScale(0.4).refreshBody()

    upDownPlatform = this.physics.add.image(600, 500, 'smallPlatform').setScale(0.4)
    bridge = this.physics.add.image(1600, 380, 'smallPlatform').setScale(0.4)
    bridge.body.allowGravity = false
    bridge.body.immovable = true
    bridge.disableBody(true, true)

    upDownPlatform.body.allowGravity = false
    upDownPlatform.body.velocity.y = 100
    upDownPlatform.body.immovable = true

    leftRightPlatform = this.physics.add.image(1050, 600, 'smallPlatform').setScale(0.4)

    leftRightPlatform.body.allowGravity = false
    leftRightPlatform.body.velocity.x = 100
    leftRightPlatform.body.immovable = true

    // Amount of Lives display
    for (let i = 1; i < lives; i++) {
      let x = 400
      x = x + (i * 80)
      life[i] = this.add.image(x, 30, 'lives').setScale(0.5).setScrollFactor(0)
    }

    // Tuto
    tutor = this.physics.add.sprite(1920, 100, 'idleLeft')

    // Tutor trigger

    const spot = tutor.body.position

    trigger = this.physics.add.sprite(spot.x, spot.y, 'triggerBlock')

    // player sprite

    player = this.physics.add.sprite(100, 160, 'idleRight')
    player.body.setGravityY(0)
    player.setCollideWorldBounds(false)
    player.body.checkCollision.up = false

    this.anims.create({
      key: 'left',
      frames: this.anims.generateFrameNumbers('runLeft', {
        start: 7,
        end: 0
      }),
      frameRate: 10,
      repeat: -1
    })

    this.anims.create({
      key: 'right',
      frames: this.anims.generateFrameNumbers('runRight', {
        start: 0,
        end: 7
      }),
      frameRate: 10,
      repeat: -1
    })

    this.anims.create({
      key: 'idleRight',
      frames: this.anims.generateFrameNumbers('idleRight', {
        start: 0,
        end: 11
      }),
      frameRate: 10,
      repeat: -1
    })

    this.anims.create({
      key: 'idleLeft',
      frames: this.anims.generateFrameNumbers('idleLeft', {
        start: 0,
        end: 11
      }),
      frameRate: 10,
      repeat: -1
    })

    this.anims.create({
      key: 'jumpLeft',
      frames: this.anims.generateFrameNumbers('jumpLeft', { start: 0, end: 2 }),
      frameRate: 5,
      repeat: -1
    })

    this.anims.create({
      key: 'jumpRight',
      frames: this.anims.generateFrameNumbers('jumpRight', {
        start: 0,
        end: 2
      }),
      frameRate: 5,
      repeat: -1
    })

    // HEALTH BAR
    healthBar = this.physics.add.sprite(player.body.position.x + 15, player.body.position.y - 40, 'heart')
    healthBar.setScale(2)

    this.anims.create({
      key: 'health1',
      frames: this.anims.generateFrameNumbers('heart', {
        start: 0,
        end: 1
      }),
      frameRate: 10

    })

    this.anims.create({
      key: 'health2',
      frames: this.anims.generateFrameNumbers('heart', {
        start: 1,
        end: 2
      }),
      frameRate: 10

    })
    this.anims.create({
      key: 'health3',
      frames: this.anims.generateFrameNumbers('heart', {
        start: 2,
        end: 3
      }),
      frameRate: 10

    })
    this.anims.create({
      key: 'health4',
      frames: this.anims.generateFrameNumbers('heart', {
        start: 3,
        end: 4
      }),
      frameRate: 10

    })
    this.anims.create({
      key: 'health5',
      frames: this.anims.generateFrameNumbers('heart', {
        start: 4,
        end: 5
      }),
      frameRate: 10

    })

    // TRELLO CHECK MECHANICS

    check = this.physics.add.staticGroup()
    check.create(1850, 670, 'check').setScale(0.08).refreshBody()
    check.create(150, 630, 'check').setScale(0.08).refreshBody()
    check.create(1400, 530, 'check').setScale(0.08).refreshBody()
    check.create(400, 120, 'check').setScale(0.08).refreshBody()

    this.physics.add.overlap(player, check, collectScore, null, this)
    this.physics.add.overlap(player, trigger, askQuestion, null, this)
    this.physics.add.collider(player, [upDownPlatform, leftRightPlatform])
    this.physics.add.collider(trigger, [platforms, upDownPlatform, leftRightPlatform])

    // text
    this.cameras.main.setBounds(0, 0, worldWidth, 0)
    this.cameras.main.startFollow(player)

    scoreText = this.add
      .text(16, 16, 'Score: ' + currentSceneScore, {
        fontFamily: "'Press Start 2P', cursive",
        fontSize: '20px',
        fill: '#000'
      })
      .setScrollFactor(0)

    checkText = this.add
      .text(width - 300, 16, 'Trello: 0 / ' + checksToPass, {
        fontFamily: "'Press Start 2P', cursive",
        fontSize: '20px',
        fill: '#000'
      })
      .setScrollFactor(0)
    noQuestion = this.add.text(spot.x - 250, spot.y - 10, '', {
      fontFamily: "'Press Start 2P', cursive",
      fontSize: '12px',
      fill: '#000'
    })

    // colliders
    this.physics.add.collider(player, [platforms, wall, bridge])
    this.physics.add.collider(tutor, platforms)
  }

  update () {
    const cam = this.cameras.main
    const speed = 15

    if (upDownPlatform.body.position.y >= 650) {
      upDownPlatform.body.velocity.y = -100
    } else if (upDownPlatform.body.position.y <= 300) {
      upDownPlatform.body.velocity.y = 100
    }

    if (leftRightPlatform.body.position.x >= 1550) {
      leftRightPlatform.body.velocity.x = -100
    } else if (leftRightPlatform.body.position.x <= 1050) {
      leftRightPlatform.body.velocity.x = 100
    }

    if (this.cursors.left.isDown) {
      // facing = 'left'
      player.setVelocityX(-300)
      cam.scrollX -= speed
      if (!player.body.touching.down) {
        player.anims.play('jumpLeft', true)
      } else {
        player.anims.play('left', true)
      }
    } else if (this.cursors.right.isDown) {
      // facing = 'right'
      player.setVelocityX(300)
      cam.scrollX += speed
      if (!player.body.touching.down) {
        player.anims.play('jumpRight', true)
      } else {
        player.anims.play('right', true)
      }
    } else if (!player.body.touching.down && facing === 'left') {
      player.anims.play('jumpLeft', true)
    } else if (!player.body.touching.down && facing === 'right') {
      player.anims.play('jumpRight', true)
    } else if (facing === 'left') {
      player.setVelocityX(0)
      player.anims.play('idleLeft', true)
    } else {
      player.setVelocityX(0)
      player.anims.play('idleRight', true)
    }
    if (this.cursors.up.isDown && player.body.touching.down) {
      player.setVelocityY(-350)
      if (facing === 'left') {
        player.anims.play('jumpLeft', true)
      } else player.anims.play('jumpRight', true)
    }

    // HEALTHBAR ABOVE PLAYER

    healthBar.body.position.x = player.body.position.x + 15
    healthBar.body.position.y = player.body.position.y - 40

    // KILL PLAYER WHEN THEY FALL OFF THE MAP

    if (player.body.position.y >= 800) {
      this.loseHp()
    }
    // console.log(checkAmount === 4)
    if (checkAmount === 4) {
      bridge.enableBody(false, bridge.body.position.x, bridge.body.position.x, true, true)
    }

    // LEVEL COMPLETION

    if (paraLevelComplete) {
      this.scene.start('jump-scene', currentSceneScore)
    }
  }

  loseHp = () => {
    health = health + 4
    if (health === 4) {
      this.death()
    }
  }

  death = () => {
    lives = lives - 1
    isAlive = false
    checkAmount = 0
    setTimeout(() => {
      player.disableBody(true, true)
      healthBar.disableBody(true, true)
    }, 100)
    setTimeout(() => {
      if (lives > 0) {
        health = 0
        life[lives].destroy()
        this.scene.restart()
      } else if (lives === 0) {
        gameOver({ isAlive, wonGame, currentSceneScore })
      }
    }, 2000)
  }

  victory = () => {
    wonGame = true
    setTimeout(() => { gameOver({ isAlive, wonGame }) }, 2000)
  }
}