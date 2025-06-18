import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  preload() {
    // 나중에 이미지 preload
  }

  create() {
    const title = this.add.text(400, 300, 'Hello, Takoyaki!', {
      fontSize: '32px',
      color: '#ffffff',
    });
    title.setOrigin(0.5);
  }
}
