class Menu extends Phaser.Scene {
  constructor() {
    super("Menu");
  }
  preload() {
    this.load.image("start", "assets/start.png");
    this.load.image("starthover", "assets/starthover.png");
    this.load.image("bg", "assets/bg.png");
    this.load.image("fullscreen", "assets/cursor.png");
    this.load.audio("mainmenumusic", "assets/sounds/mainmenu.ogg");
  }
  create() {
    // Create start menu screen and add the background image and buttons in
    let start = this.add.sprite(480, 280, "start").setInteractive().setDepth(2);
    this.isMobile = false;
    let bg = this.add.image(0, 0, "bg");
    this.sound.add("mainmenumusic");
    this.sound.play("mainmenumusic");
    bg.setOrigin(0, 0);
    start.on("pointerover", function (event) {
      this.setTexture("starthover");
    });
    start.on("pointerout", function (event) {
      this.setTexture("start");
    });
    start.on(
      "pointerdown",
      function (event) {
        this.startGame();
      },
      this
    );
  }

  startGame() {
    this.sound.stopAll();
    this.scene.start("PlayGame");
  }
}
