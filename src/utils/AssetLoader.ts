import Phaser from 'phaser';

export class AssetLoader {
  static loadAllAssets(scene: Phaser.Scene) {
    // 기본 에셋
    this.loadBasicAssets(scene);

    // 철판 이미지들
    this.loadIronPanAssets(scene);

    // 접시 이미지들
    this.loadPlateAssets(scene);

    // 툴 버튼 이미지들
    this.loadToolAssets(scene);

    // 손님 에셋
    this.loadCustomerAssets(scene);

    // 오디오
    this.loadAudioAssets(scene);
  }

  private static loadBasicAssets(scene: Phaser.Scene) {
    scene.load.image('start-background', 'assets/start-background.png');
    scene.load.image('muteBtn', 'assets/muteBtn.png');
    scene.load.image('unmuteBtn', 'assets/unmuteBtn.png');
    scene.load.image('game-title', 'assets/game-title.png');
    scene.load.image('game-start-button', 'assets/game-start-button.png');
    scene.load.image('game-manual-button', 'assets/game-manual-button.png');
    scene.load.image('manual-modal', 'assets/manual-modal.png');
    scene.load.image('modal-close-button', 'assets/modal-close-button.png');
    scene.load.image('background', 'assets/background.png');
    scene.load.image('button', 'assets/button.png');
    scene.load.image('button-disabled', 'assets/button-disabled.png');
    scene.load.image('tent', 'assets/tent.png');
    scene.load.image('plate', 'assets/plate.png');
    scene.load.image('plate-cell', 'assets/plate-cell.png');
    scene.load.image('table', 'assets/table.png');
    scene.load.image('dish', 'assets/dish.png');
    scene.load.image('waiting-table', 'assets/waiting-table.png');
    scene.load.image('sakura', 'assets/sakura.png');
    scene.load.image('receipt', 'assets/receipt.png');
    scene.load.image('retry-button', 'assets/retry-button.png');
    scene.load.image('menu-button', 'assets/menu-button.png');
  }

  private static loadIronPanAssets(scene: Phaser.Scene) {
    scene.load.image('batter-raw', 'assets/batter-raw.png');
    scene.load.image('batter-perfect', 'assets/batter-perfect.png');
    scene.load.image('batter-burnt', 'assets/batter-burnt.png');

    scene.load.image('octopus-piece', 'assets/octopus-piece.png');
    scene.load.image('takoyaki-raw-with-octopus', 'assets/takoyaki-raw-with-octopus.png');
    scene.load.image('takoyaki-perfect-with-octopus', 'assets/takoyaki-perfect-with-octopus.png');
    scene.load.image('takoyaki-burnt-with-octopus', 'assets/takoyaki-burnt-with-octopus.png');
  }

  private static loadPlateAssets(scene: Phaser.Scene) {
    scene.load.image('tako-position', 'assets/tako-position.png');
    scene.load.image('tako-raw', 'assets/tako-raw.png');
    scene.load.image('tako-perfect', 'assets/tako-perfect.png');
    scene.load.image('tako-burnt', 'assets/tako-burnt.png');

    scene.load.image('takoyaki-raw-flipped', 'assets/takoyaki-raw-flipped.png');
    scene.load.image('takoyaki-perfect-flipped', 'assets/takoyaki-perfect-flipped.png');
    scene.load.image('takoyaki-burnt-flipped', 'assets/takoyaki-burnt-flipped.png');
    scene.load.image('tako-perfect-sauce', 'assets/tako-perfect-sauce.png');
    scene.load.image('tako-perfect-sauce-negi', 'assets/tako-perfect-sauce-negi.png');
    scene.load.image('tako-perfect-sauce-katsuobushi', 'assets/tako-perfect-sauce-katsuobushi.png');
    scene.load.image('tako-perfect-sauce-nori', 'assets/tako-perfect-sauce-nori.png');
  }

  private static loadToolAssets(scene: Phaser.Scene) {
    scene.load.image('tool-kattle', 'assets/tool-kattle.png');
    scene.load.image('tool-octopus', 'assets/tool-octopus.png');
    scene.load.image('tool-stick', 'assets/tool-stick.png');
    scene.load.image('tool-sauce', 'assets/tool-sauce.png');
    scene.load.image('topping-negi', 'assets/topping-negi.png');
    scene.load.image('topping-katsuo', 'assets/topping-katsuo.png');
    scene.load.image('topping-nori', 'assets/topping-nori.png');
    scene.load.image('tool-serve', 'assets/tool-serve.png');
  }

  private static loadCustomerAssets(scene: Phaser.Scene) {
    scene.load.image('speech-bubble', 'assets/speech-bubble.png');

    scene.load.image('customer-neutral', 'assets/customer-neutral.png');
    scene.load.image('customer-happy', 'assets/customer-happy.png');
    scene.load.image('customer-angry', 'assets/customer-angry.png');

    scene.load.image('takoyaki-box', 'assets/takoyaki-box.png');

    scene.load.image('money-bundle', 'assets/money-bundle.png');
  }

  private static loadAudioAssets(scene: Phaser.Scene) {
    scene.load.audio('japan-background', 'assets/audio/japan-background.mp3');
    scene.load.audio('batter-sound', 'assets/audio/batter-sound.mp3');
    scene.load.audio('octopus-sound', 'assets/audio/octopus-sound.mp3');
    scene.load.audio('sauce-sound', 'assets/audio/sauce-sound.mp3');
    scene.load.audio('topping-sound', 'assets/audio/topping-sound.mp3');
    scene.load.audio('serve-sound', 'assets/audio/serve-sound.mp3');
    scene.load.audio('stick-sound', 'assets/audio/stick-sound.mp3');
    scene.load.audio('bonus-sound', 'assets/audio/bonus-sound.mp3');
    scene.load.audio('game-over', 'assets/audio/game-over5.mp3');
  }
}
