class Win extends Phaser.Scene {
  constructor() {
    super("Win");
  }
  preload() {
    this.load.image("back", "assets/back.png");
    this.load.image("backhover", "assets/backhover.png");
    this.load.image("win", "assets/win.png");
    this.load.audio("winmusic", "assets/sounds/winmenu.ogg");
  }
  create() {
    // Create win menu screen and add the background image and buttons in
    let back = this.add.sprite(480, 280, "back").setInteractive().setDepth(2);
    let bg = this.add.image(0, 0, "win");
    this.sound.add("winmusic");
    this.sound.play("winmusic", { loop: true });
    bg.setOrigin(0, 0);
    back.on("pointerover", function (event) {
      this.setTexture("backhover");
    });
    back.on("pointerout", function (event) {
      this.setTexture("back");
    });
    back.on(
      "pointerdown",
      function (event) {
        this.backToMenu();
      },
      this
    );
  }

  backToMenu() {
    this.sound.stopAll();
    this.scene.start("Menu");
  }
}
