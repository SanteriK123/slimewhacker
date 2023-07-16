import { createWalker, increaseArraySize } from "./components/generator.js";
let gameCanvas = document.getElementById("game");

let game;

//Global variables for player and enemy stats and some other things

let playerStats = {
  health: 3,
  maxHealth: 3,
  speed: 150,
  diagSpeed: 110,
  damage: 10,
  attackSpeed: 70,
  immune: false,
  melee: false,
};

const bossStats = {
  speedX: [-40, 0, 40],
  speedY: [-27, 0, 27],
  projectileSpeedX: [0, 40, 60, 40, 0, -40, -60, -40, 0],
  projectileSpeedY: [-60, -40, 0, 40, 60, 40, 0, -40, 0],
};
const blueSlime = {
  name: "blueslime",
  health: 10,
  speedX: [-50, 0, 50],
  speedY: [-50, 0, 50],
};

const brownSlime = {
  name: "brownslime",
  health: 20,
  speedX: [-40, 0, 40],
  speedY: [-40, 0, 40],
};

const frogSlime = {
  name: "frogslime",
  health: 25,
  speedX: [-30, 0, 30],
  speedY: [-30, 0, 30],
};

const enemies = [blueSlime, brownSlime, frogSlime];

const boostStats = {
  names: ["attackboost", "movementboost", "speedboost"],
};

let immunityTimer = 0;
let meleeTimer = 0;
let projectileTimer = 0;
let lastDirection = "down";
let bossSongStart = false;

window.onload = function () {
  let gameConfig = {
    type: Phaser.AUTO,
    backgroundColor: "#3e3b65",
    scale: {
      parent: gameCanvas,
      mode: Phaser.Scale.FIT,
      width: 960,
      height: 480,
    },
    pixelArt: true,
    antialias: false,
    autoRound: true,
    roundPixels: true,
    physics: {
      default: "arcade",
      arcade: {
        tileBias: 32,
        gravity: {
          y: 0,
        },
      },
    },
    scene: [Menu, PlayGame, Win],
  };
  game = new Phaser.Game(gameConfig);
  window.focus();
};

class PlayGame extends Phaser.Scene {
  constructor() {
    super("PlayGame");
    this.level = 0;
  }

  init(data) {
    this.isMobile = data.value;
  }

  preload() {
    this.load.plugin(
      "rexvirtualjoystickplugin",
      "https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexvirtualjoystickplugin.min.js",
      true
    );

    this.load.image("tileset", "assets/tiles/tiles.png");
    this.load.image("exit", "assets/tiles/exit.png");
    this.load.image("healthpack", "assets/tiles/healthpack.png");
    this.load.image("attackboost", "assets/tiles/attack.png");
    this.load.image("movementboost", "assets/tiles/mspeed.png");
    this.load.image("speedboost", "assets/tiles/aspeed.png");
    this.load.image("trophy", "assets/tiles/trophy.png");
    this.load.image("fullscreen", "assets/cursor.png");
    this.load.image("base", "assets/baseCircle.png");
    this.load.image("thumb", "assets/thumbCircle.png");
    this.load.image("interactActive", "assets/interact.png");
    this.load.image("interactInactive", "assets/interactGray.png");

    this.load.spritesheet("melee", "assets/bat.png", {
      frameWidth: 48,
      frameHeight: 32,
    });
    this.load.spritesheet("heart", "assets/heart.png", {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet("frog", "assets/frogprojectile.png", {
      frameWidth: 16,
      frameHeight: 16,
    });
    this.load.spritesheet("trumpet", "assets/trumpetprojectile.png", {
      frameWidth: 16,
      frameHeight: 16,
    });

    this.load.aseprite("player", "assets/player.png", "assets/player.json");
    this.load.aseprite(
      "blueslime",
      "assets/enemies/blueslime.png",
      "assets/enemies/blueslime.json"
    );
    this.load.aseprite(
      "brownslime",
      "assets/enemies/brownslime.png",
      "assets/enemies/brownslime.json"
    );
    this.load.aseprite(
      "frogslime",
      "assets/enemies/frogslime.png",
      "assets/enemies/frogslime.json"
    );
    this.load.aseprite(
      "boss",
      "assets/enemies/boss.png",
      "assets/enemies/boss.json"
    );

    this.load.audio("enemyhurt", "assets/sounds/enemyHurt.wav");
    this.load.audio("playerhurt", "assets/sounds/playerHurt.wav");
    this.load.audio("heal", "assets/sounds/heal.wav");
    this.load.audio("statboost", "assets/sounds/powerUp.wav");
    this.load.audio("swing", "assets/sounds/swing.wav");
    this.load.audio("trumpet", "assets/sounds/trumpet.wav");
    this.load.audio("frog", "assets/sounds/frog.wav");
    this.load.audio("break", "assets/sounds/break.wav");
    this.load.audio("music", "assets/sounds/slimewhacker.ogg");
    this.load.audio("bossmusic", "assets/sounds/slimeboss.ogg");
  }

  create() {
    // Sounds and music
    this.sound.add("playerhurt");
    this.sound.add("enemyhurt");
    this.sound.add("swing");
    this.sound.add("heal");
    this.sound.add("statboost");
    this.sound.add("trumpet");
    this.sound.add("frog");
    this.sound.add("break");
    this.gameMusic = this.sound.add("music");
    this.bossMusic = this.sound.add("bossmusic");

    // Level related initialization
    this.frameTime = 0;
    this.bossLevel = false;
    if (this.level == 0) {
      playerStats.health = 3;
      playerStats.speed = 150;
      playerStats.diagSpeed = 110;
      playerStats.damage = 10;
      playerStats.attackSpeed = 70;
      this.gameMusic.play({ loop: true });
      bossSongStart = false;
    } else if (this.level >= 7) {
      this.bossLevel = true;
    }
    this.input.setDefaultCursor("url(assets/cursor.png), pointer");

    // Generate dungeon array, add a bunch of walls around the array to prevent player from escaping
    let arraySize;
    let walkerSteps;
    if (this.bossLevel) {
      arraySize = 15;
      walkerSteps = 3000;
    } else {
      arraySize = Math.floor(10 + this.level ** 1.4);
      walkerSteps = Math.floor(200 + (this.level * 20) ** 1.4);
    }
    const walkerArray = createWalker(arraySize, arraySize);
    walkerArray.walk(walkerSteps);
    const generatedArray = increaseArraySize(
      walkerArray.array,
      walkerArray.array.length + 20
    );

    // Create the tileset and tilemap layer to place the tiles into
    const map = this.make.tilemap({
      data: generatedArray,
      tileWidth: 32,
      tileHeight: 32,
    });
    const tileset = map.addTilesetImage("tileset", "tileset", 32, 32);
    this.layer = map.createLayer(0, tileset, 0, 0);
    this.layer.setCollision([0, 1, 2], true);

    // Initialize all the other objects such as player, enemy etc
    this.enemyGroup = this.physics.add.group({
      immovable: false,
      allowGravity: false,
    });

    this.boss = this.physics.add
      .sprite(0, 0, "boss")
      .setDepth(6)
      .setSize(80, 80);
    this.boss.health = 100;
    this.boss.immune = false;
    this.boss.name = "boss";
    this.projectiles = this.physics.add.group({
      immovable: false,
      allowGravity: false,
    });

    this.meleeHit = this.physics.add.sprite(0, 0, "melee").setDepth(4);
    this.meleeHit.setSize(32, 32);

    this.exit = this.physics.add.image(0, 0, "exit").setDepth(2);
    this.trophy = this.physics.add.image(0, 0, "trophy").setDepth(2);

    this.healthPack = this.physics.add.image(0, 0, "healthpack").setDepth(2);
    this.statBoosts = this.physics.add.group({}).setDepth(2);

    this.player = this.physics.add.sprite(0, 0, "player").setDepth(2);
    this.player.setSize(18, 18);
    this.player.body.setOffset(7, 10);

    // UI elements
    let uiX = game.config.width / 4;
    let uiY = game.config.height / 4;
    this.healthGroup = this.add.group({ classType: Phaser.GameObjects.Image });
    this.healthGroup.createMultiple({
      key: "heart",
      setScrollFactor: {
        x: 0,
        y: 0,
      },
      setXY: {
        x: 26 + uiX,
        y: 26 + uiY,
        stepX: 34,
      },
      setDepth: {
        value: 10,
      },
      quantity: playerStats.maxHealth,
    });
    this.updateHP();

    this.add
      .text(-90 + uiX * 3, uiY + 10, "Level: " + this.level)
      .setScrollFactor(0)
      .setDepth(10);
    this.uiDamage = this.add
      .text(5 + uiX, -60 + uiY * 3, "\u{1F4AA}" + playerStats.damage, {
        fontFamily: "ConnectionIII",
      })
      .setScrollFactor(0)
      .setDepth(10)
      .setColor("red");
    this.uiMoveSpeed = this.add
      .text(5 + uiX, -40 + uiY * 3, "\u{1F97E} " + playerStats.speed, {
        fontFamily: "ConnectionIII",
      })
      .setScrollFactor(0)
      .setDepth(10)
      .setColor("green");
    this.uiAttackSpeed = this.add
      .text(5 + uiX, -20 + uiY * 3, "\u{1F52A} " + playerStats.attackSpeed, {
        fontFamily: "ConnectionIII",
      })
      .setScrollFactor(0)
      .setDepth(10)
      .setColor("blue");
    this.uiLevelFinished = this.add
      .text(uiX + 130, uiY * 3 - 30, "Level cleared, proceed further", {
        fontFamily: "ConnectionIII",
      })
      .setScrollFactor(0)
      .setDepth(10)
      .setAlpha(0);
    this.uiBossLevelFinished = this.add
      .text(uiX + 130, uiY * 3 - 30, "Boss defeated, get your trophy!", {
        fontFamily: "ConnectionIII",
      })
      .setScrollFactor(0)
      .setDepth(10)
      .setAlpha(0);

    // Physics collisions and overlaps
    this.physics.add.collider(this.player, this.layer);
    this.physics.add.collider(this.enemyGroup, this.layer);
    this.physics.add.collider(this.boss, this.layer);

    this.damageCollider = this.physics.add.overlap(
      this.player,
      this.enemyGroup,
      this.takeDamage,
      null,
      this
    );

    this.bossDamageCollider = this.physics.add.overlap(
      this.player,
      this.boss,
      this.takeDamage,
      null,
      this
    );

    this.projectileDamageCollider = this.physics.add.overlap(
      this.projectiles,
      this.player,
      this.takeDamageFromProjectile,
      null,
      this
    );

    this.physics.add.overlap(
      this.player,
      this.exit,
      this.exitLevel,
      null,
      this
    );

    this.physics.add.overlap(
      this.player,
      this.trophy,
      this.winGame,
      null,
      this
    );

    this.physics.add.overlap(
      this.player,
      this.healthPack,
      this.heal,
      this.checkHP,
      this
    );

    this.physics.add.overlap(
      this.player,
      this.statBoosts,
      this.boostStats,
      null,
      this
    );

    this.physics.add.overlap(
      this.meleeHit,
      this.enemyGroup,
      this.enemyTakeDamage,
      null,
      this
    );

    this.physics.add.overlap(
      this.meleeHit,
      this.boss,
      this.enemyTakeDamage,
      null,
      this
    );

    this.physics.add.overlap(
      this.projectiles,
      this.layer,
      this.destroyProjectile,
      this.checkTileType,
      this
    );

    this.physics.add.overlap(
      this.meleeHit,
      this.projectiles,
      this.destroyProjectileMelee,
      null,
      this
    );

    // Camera and keyboard/mobile controls
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setZoom(2);
    this.cameras.main.setBounds(
      0,
      0,
      generatedArray.length * 32,
      generatedArray.length * 32
    );
    this.keys = this.input.keyboard.addKeys({
      up: "W",
      left: "A",
      down: "S",
      right: "D",
      space: "space",
    });

    this.base = this.add.image(0, 0, "base").setDepth(10);
    this.thumb = this.physics.add.image(0, 0, "thumb").setDepth(10);

    this.joystick = this.plugins.get("rexvirtualjoystickplugin").add(this, {
      x: uiX * 3 - 50,
      y: uiY * 3 - 50,
      radius: 20,
      base: this.base,
      thumb: this.thumb,
      dir: "8dir",
      forceMin: 16,
    });
    this.joystick.setVisible(false);

    this.interactDown = false;

    if (this.isMobile) {
      this.joystick.setVisible(true);
      this.interact = this.add.image(
        uiX * 3 - 50,
        uiY * 3 - 120,
        "interactInactive"
      );
      this.interact.setInteractive().setDepth(10).setScrollFactor(0);
      console.log("hey");
      this.interact.on(
        "pointerdown",
        function (event) {
          this.interactDown = true;
        },
        this
      );
      this.interact.on(
        "pointerup",
        function (event) {
          this.interactDown = false;
        },
        this
      );
    }

    // Animations
    this.anims.create({
      key: "melee",
      frames: this.anims.generateFrameNumbers("melee", { start: 0, end: 10 }),
      frameRate: 45,
      repeat: 0,
    });

    this.anims.create({
      key: "bossIdle",
      frames: this.anims.generateFrameNumbers("boss", { start: 0, end: 1 }),
      frameRate: 4,
      repeat: 0,
    });

    this.anims.create({
      key: "frogSpin",
      frames: this.anims.generateFrameNumbers("frog", { start: 0, end: 9 }),
      frameRate: 20,
      repeat: -1,
    });

    this.anims.create({
      key: "trumpetSpin",
      frames: this.anims.generateFrameNumbers("trumpet", { start: 0, end: 13 }),
      frameRate: 30,
      repeat: -1,
    });

    this.anims.createFromAseprite("player");
    this.anims.createFromAseprite("blueslime");
    this.anims.createFromAseprite("brownslime");
    this.anims.createFromAseprite("frogslime");
    this.anims.createFromAseprite("boss");

    // Add other objects such as enemies and pickups into map
    let enemyAmount = Phaser.Math.Between(3, 5) + Math.floor(this.level * 1.4);
    let enemyVariety = 1;
    let playerPlaced = false;
    let playerPosition;
    let healthPlaced = false;
    let boostPlaced = false;
    let boostName = boostStats.names[Phaser.Math.Between(0, 2)];

    for (let x = 0; x < generatedArray.length; x++) {
      for (let y = 0; y < generatedArray.length; y++) {
        if (
          generatedArray[y][x] == 3 ||
          generatedArray[y][x] == 4 ||
          generatedArray[y][x] == 5
        ) {
          if (!playerPlaced) {
            playerPosition = [x, y];
            this.player.setPosition(16 + x * 32, 16 + y * 32);
            playerPlaced = true;
          }
          if (!this.bossLevel) {
            if (this.level > 5) {
              enemyVariety = 2;
            }
            if (
              Math.random() < 0.1 &&
              this.enemyGroup.getLength() < enemyAmount &&
              generatedArray[y] != playerPosition[0] &&
              generatedArray[y][x] != playerPosition[1]
            ) {
              let randEnemy = enemies[Phaser.Math.Between(0, enemyVariety)];
              let enemy = this.enemyGroup.create(
                16 + x * 32,
                16 + y * 32,
                randEnemy.name
              );
              enemy.name = randEnemy.name;
              enemy.health = randEnemy.health;
              enemy.speedX = randEnemy.speedX;
              enemy.speedY = randEnemy.speedX;
              enemy.immune = false;
              enemy.setDepth(5);
            }
            if (Math.random() < 0.1 && !healthPlaced) {
              this.healthPack.setPosition(16 + x * 32, 16 + y * 32);
              healthPlaced = true;
            }
            if (Math.random() < 0.02 && !boostPlaced) {
              let stat = this.statBoosts.create(
                16 + x * 32,
                16 + y * 32,
                boostName
              );
              stat.name = boostName;
              boostPlaced = true;
            }
          } else {
            if (
              generatedArray[y][x] == 3 ||
              generatedArray[y][x] == 4 ||
              generatedArray[y][x] == 5
            ) {
              this.boss.setPosition(-16 + x * 32, -16 + y * 32);
            }
          }
        }
        if (generatedArray[y][x] == 6) {
          if (this.bossLevel) {
            this.trophy.setPosition(16 + x * 32, 16 + y * 32);
          } else {
            this.exit.setPosition(16 + x * 32, 16 + y * 32);
          }
        }
      }
    }
  }

  exitLevel() {
    if (
      (this.keys.space.isDown || this.interactDown) &&
      this.enemyGroup.getLength() <= 0
    ) {
      this.level += 1;
      this.scene.start("PlayGame");
    }
  }

  takeDamage() {
    this.sound.play("playerhurt");
    playerStats.health -= 1;
    this.updateHP();
    if (playerStats.health <= 0) {
      this.level = 0;
      this.sound.stopAll();
      this.scene.start("Menu");
    }
    playerStats.immune = true;
  }

  takeDamageFromProjectile(player, projectile) {
    this.takeDamage();
    this.destroyProjectile(projectile);
  }

  enemyTakeDamage(meleeHit, enemy) {
    if (!enemy.immune) {
      this.sound.play("enemyhurt");
      enemy.anims.play({ key: enemy.name + "hurt", repeat: 0 }, true);
      enemy.health -= playerStats.damage;
      enemy.immune = true;
      if (enemy.health <= 0) {
        enemy.disableBody(true, true);
        this.enemyGroup.remove(enemy, true);
      }
    }
  }

  destroyProjectile(projectile) {
    this.sound.play("break");
    projectile.disableBody(true, true);
    this.projectiles.remove(projectile, true);
  }

  destroyProjectileMelee(melee, projectile) {
    this.destroyProjectile(projectile);
  }

  heal() {
    this.sound.play("heal");
    playerStats.health += 1;
    this.updateHP();
    this.healthPack.disableBody(true, true);
  }

  checkHP() {
    if (playerStats.health == 3) {
      return false;
    } else {
      return true;
    }
  }

  boostStats(player, stat) {
    this.sound.play("statboost");
    if (stat.name == "attackboost") {
      playerStats.damage += 3;
      this.uiDamage.text = "\u{1F4AA} " + playerStats.damage;
    } else if (stat.name == "movementboost") {
      playerStats.speed += 15;
      playerStats.diagSpeed += 10;
      this.uiMoveSpeed.text = "\u{1F97E} " + playerStats.speed;
    } else {
      playerStats.attackSpeed -= 10;
      this.uiAttackSpeed.text = "\u{1F52A} " + playerStats.attackSpeed;
    }

    stat.disableBody(true, true);
    this.statBoosts.remove(stat, true);
  }

  updateHP() {
    this.healthGroup.getChildren().forEach(function (health, i) {
      if (i > playerStats.health - 1) {
        health.setFrame(1);
      } else {
        health.setFrame(0);
      }
    }, this);
  }
  getAngle(mouseX, mouseY, playerX, playerY) {
    let angle =
      (Math.atan2(playerY - mouseY, playerX - mouseX) * 180) / Math.PI;
    return angle;
  }

  checkTileType(projectile) {
    let tile = this.layer.getTileAtWorldXY(
      projectile.body.x + 8,
      projectile.body.y,
      false,
      this.cameras.main
    );
    if (tile.index == 0 || tile.index == 1 || tile.index == 2) {
      return true;
    }
    return false;
  }

  winGame() {
    if (this.keys.space.isDown && this.boss.health <= 0) {
      this.sound.stopAll();
      this.level = 0;
      this.scene.start("Win");
    }
  }

  update(time, delta) {
    // Weird fix for monitors with different refresh rate than 60hz so game runs at right speed
    this.frameTime += delta;
    if (this.frameTime > 8) {
      this.frameTime = 0;

      // Player Movement
      if (this.keys.left.isDown || this.joystick.left) {
        this.player.body.velocity.x = -playerStats.speed;
        this.player.body.velocity.y = 0;
        this.player.anims.play("left", true);
        lastDirection = "left";
      } else if (this.keys.right.isDown || this.joystick.right) {
        this.player.body.velocity.x = playerStats.speed;
        this.player.body.velocity.y = 0;
        this.player.anims.play("right", true);
        lastDirection = "right";
      } else if (this.keys.up.isDown || this.joystick.up) {
        this.player.body.velocity.y = -playerStats.speed;
        this.player.body.velocity.x = 0;
        this.player.anims.play("up", true);
        lastDirection = "up";
      } else if (this.keys.down.isDown || this.joystick.down) {
        this.player.body.velocity.y = playerStats.speed;
        this.player.body.velocity.x = 0;
        this.player.anims.play("down", true);
        lastDirection = "down";
      } else {
        this.player.body.velocity.x = 0;
        this.player.body.velocity.y = 0;
        if (lastDirection == "left") {
          this.player.anims.play("idleLeft", true);
        } else if (lastDirection == "right") {
          this.player.anims.play("idleRight", true);
        } else if (lastDirection == "up") {
          this.player.anims.play("idleUp", true);
        } else if (lastDirection == "down") {
          this.player.anims.play("idleDown", true);
        }
      }

      if (
        (this.keys.left.isDown && this.keys.up.isDown) ||
        (this.joystick.left && this.joystick.up)
      ) {
        this.player.body.velocity.x = -playerStats.diagSpeed;
        this.player.body.velocity.y = -playerStats.diagSpeed;
      } else if (
        (this.keys.right.isDown && this.keys.up.isDown) ||
        (this.joystick.right && this.joystick.up)
      ) {
        this.player.body.velocity.x = playerStats.diagSpeed;
        this.player.body.velocity.y = -playerStats.diagSpeed;
      } else if (
        (this.keys.right.isDown && this.keys.down.isDown) ||
        (this.joystick.right && this.joystick.down)
      ) {
        this.player.body.velocity.x = playerStats.diagSpeed;
        this.player.body.velocity.y = playerStats.diagSpeed;
      } else if (
        (this.keys.left.isDown && this.keys.down.isDown) ||
        (this.joystick.left && this.joystick.down)
      ) {
        this.player.body.velocity.x = -playerStats.diagSpeed;
        this.player.body.velocity.y = playerStats.diagSpeed;
      }

      // Player immunity
      if (playerStats.immune) {
        this.damageCollider.active = false;
        this.bossDamageCollider.active = false;
        this.projectileDamageCollider.active = false;
        immunityTimer += 1;
      }
      if (immunityTimer > 60) {
        immunityTimer = 0;
        this.damageCollider.active = true;
        this.bossDamageCollider.active = true;
        this.projectileDamageCollider.active = true;
        playerStats.immune = false;
      }

      // Player melee
      this.input.on("pointerdown", (pointer) => {
        if (!playerStats.melee) {
          this.sound.play("swing");
          let angle = this.getAngle(
            this.input.mousePointer.x,
            this.input.mousePointer.y,
            game.config.width / 2,
            game.config.height / 2
          );
          this.meleeHit.enableBody(true, 0, 0, true, true);
          if (angle > 45 && angle < 135) {
            this.meleeHit.angle = 0;
            this.meleeHit.setPosition(
              8 + this.player.body.x,
              this.player.body.y - 8
            );
          } else if (angle < 45 && angle > -45) {
            this.meleeHit.angle = -90;
            this.meleeHit.setPosition(
              this.player.body.x - 8,
              this.player.body.y + 8
            );
          } else if (angle < -45 && angle > -135) {
            this.meleeHit.angle = -180;
            this.meleeHit.setPosition(
              8 + this.player.body.x,
              this.player.body.y + 24
            );
          } else {
            this.meleeHit.angle = 90;
            this.meleeHit.setPosition(
              24 + this.player.body.x,
              this.player.body.y + 6
            );
          }
          playerStats.melee = true;
          this.meleeHit.anims.play("melee");
        }
      });
      if (playerStats.melee) {
        meleeTimer++;
        if (this.meleeHit.angle == 0) {
          this.meleeHit.setPosition(
            8 + this.player.body.x,
            this.player.body.y - 8
          );
        } else if (this.meleeHit.angle == -90) {
          this.meleeHit.setPosition(
            this.player.body.x - 8,
            this.player.body.y + 8
          );
        } else if (this.meleeHit.angle == -180) {
          this.meleeHit.setPosition(
            8 + this.player.body.x,
            this.player.body.y + 24
          );
        } else {
          this.meleeHit.setPosition(
            24 + this.player.body.x,
            this.player.body.y + 6
          );
        }
        if (meleeTimer > 15) {
          this.meleeHit.disableBody(true, true);
          this.enemyGroup.getChildren().forEach(function (enemy) {
            enemy.immune = false;
          }, this);
          this.boss.immune = false;
        }
        if (meleeTimer > playerStats.attackSpeed) {
          meleeTimer = 0;
          playerStats.melee = false;
        }
      }

      // Enemy movement and projectiles
      this.enemyGroup.getChildren().forEach(function (enemy) {
        if (!enemy.immune) {
          enemy.anims.play({ key: enemy.name + "walk", repeat: -1 }, true);
        }
        if (Math.random() > 0.98) {
          enemy.setVelocityX(enemy.speedX[Phaser.Math.Between(0, 2)]);
          enemy.setVelocityY(enemy.speedY[Phaser.Math.Between(0, 2)]);
          if (enemy.name == "frogslime") {
            if (Math.random() > 0.07) {
              let projectile = this.projectiles.create(
                enemy.body.x,
                enemy.body.y,
                "frog"
              );
              projectile.setVelocityX(
                bossStats.projectileSpeedX[Phaser.Math.Between(0, 7)]
              );
              projectile.setVelocityY(
                bossStats.projectileSpeedY[Phaser.Math.Between(0, 7)]
              );
              projectile.anims.play("frogSpin", true);
              this.sound.play("frog");
            }
          }
        }
      }, this);

      // Level finished text
      if (!this.bossLevel && this.enemyGroup.getLength() <= 0) {
        this.uiLevelFinished.setAlpha(1);
      }

      // Update loop for boss level
      if (this.bossLevel) {
        if (!bossSongStart) {
          this.sound.stopAll();
          this.bossMusic.play({ loop: true });
          bossSongStart = true;
        }
        if (this.boss.health > 0) {
          if (!this.boss.immune) {
            this.boss.anims.play({ key: "bossidle", repeat: -1 }, true);
          }
          if (Math.random() > 0.98) {
            this.boss.setVelocityX(bossStats.speedX[Phaser.Math.Between(0, 2)]);
            this.boss.setVelocityY(bossStats.speedX[Phaser.Math.Between(0, 2)]);
          }
          if (projectileTimer > 100) {
            let name;
            let anim;
            if (Math.random() > 0.5) {
              name = "frog";
              anim = "frogSpin";
            } else {
              name = "trumpet";
              anim = "trumpetSpin";
            }
            for (let i = 0; i < 8; i++) {
              let projectile = this.projectiles.create(
                32 + this.boss.body.x,
                this.boss.body.y + 32,
                name
              );
              projectile.setVelocityX(bossStats.projectileSpeedX[i]);
              projectile.setVelocityY(bossStats.projectileSpeedY[i]);
              projectile.anims.play(anim, true);
              this.sound.play(name);
            }
            projectileTimer = 0;
          }
          projectileTimer++;
        } else {
          this.uiBossLevelFinished.setAlpha(1);
        }
      }
    }
  }
}
