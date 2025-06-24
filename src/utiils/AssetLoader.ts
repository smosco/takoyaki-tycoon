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
    scene.load.image('background', 'assets/background.png');
    scene.load.image('button', 'assets/button.png');
    scene.load.image('tent', 'assets/tent.png');
    scene.load.image('plate', 'assets/plate.png');
    scene.load.image('plate-cell', 'assets/plate-cell.png');
    scene.load.image('table', 'assets/table.png');
    scene.load.image('dish', 'assets/dish.png');
    scene.load.image('waiting-table', 'assets/waiting-table.png');
    scene.load.image('sakura', 'assets/sakura.png');
  }

  private static loadIronPanAssets(scene: Phaser.Scene) {
    scene.load.image('plate-cell-batter-raw', 'assets/plate-cell-batter-raw.png');
    scene.load.image('plate-cell-batter-perfect', 'assets/plate-cell-batter-perfect.png');
    scene.load.image('plate-cell-batter-burnt', 'assets/plate-cell-batter-burnt.png');
    scene.load.image('plate-cell-batter-raw-octopus', 'assets/plate-cell-batter-raw-octopus.png');
    scene.load.image(
      'plate-cell-batter-perfect-octopus',
      'assets/plate-cell-batter-perfect-octopus.png'
    );
    scene.load.image(
      'plate-cell-batter-burnt-octopus',
      'assets/plate-cell-batter-burnt-octopus.png'
    );
    scene.load.image('plate-cell-batter-raw-flipped', 'assets/plate-cell-batter-raw-flipped.png');
    scene.load.image(
      'plate-cell-batter-perfect-flipped',
      'assets/plate-cell-batter-perfect-flipped.png'
    );
    scene.load.image(
      'plate-cell-batter-burnt-flipped',
      'assets/plate-cell-batter-burnt-flipped.png'
    );
  }

  private static loadPlateAssets(scene: Phaser.Scene) {
    scene.load.image('tako-position', 'assets/tako-position.png');
    scene.load.image('tako-perfect', 'assets/tako-perfect.png');
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
    // 임시 이미지
    scene.load.image('customer_neutral', 'assets/customer-neutral.png');
    scene.load.image('customer_happy', 'assets/customer-happy.png');
    scene.load.image('customer_angry', 'assets/customer-angry.png');

    // 실제 에셋 (준비되면 주석 해제)
    /*
    scene.load.spritesheet('customer_idle', 'assets/customer_idle.png', {
      frameWidth: 64,
      frameHeight: 96
    });

    scene.load.spritesheet('customer_walk', 'assets/customer_walk.png', {
      frameWidth: 64,
      frameHeight: 96
    });

    scene.load.spritesheet('customer_talk', 'assets/customer_talk.png', {
      frameWidth: 64,
      frameHeight: 96
    });

    scene.load.spritesheet('customer_happy', 'assets/customer_happy.png', {
      frameWidth: 64,
      frameHeight: 96
    });

    scene.load.spritesheet('customer_angry', 'assets/customer_angry.png', {
      frameWidth: 64,
      frameHeight: 96
    });
    */
  }

  private static loadAudioAssets(scene: Phaser.Scene) {
    scene.load.audio('japan-background', 'assets/audio/japan-background.mp3');
  }
}
