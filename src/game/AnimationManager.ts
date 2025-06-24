import Phaser from 'phaser';

export class AnimationManager {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * 손님 애니메이션들을 생성합니다
   */
  createCustomerAnimations() {
    // 말하기 애니메이션
    this.scene.anims.create({
      key: 'customer_talk',
      frames: this.scene.anims.generateFrameNumbers('customer_talk', { start: 0, end: 7 }),
      frameRate: 6,
      repeat: 3,
    });
  }

  /**
   * 요리 효과 애니메이션들 (향후 확장)
   */
  createCookingEffects() {
    // 김이 나는 효과, 도구별 효과 등을 여기에 구현할 수 있습니다
    /*
    this.scene.anims.create({
      key: 'steam_effect',
      frames: this.scene.anims.generateFrameNumbers('steam', { start: 0, end: 7 }),
      frameRate: 10,
      repeat: -1
    });

    this.scene.anims.create({
      key: 'flip_effect',
      frames: this.scene.anims.generateFrameNumbers('flip', { start: 0, end: 5 }),
      frameRate: 8,
      repeat: -1
    });
    */
  }

  /**
   * 모든 애니메이션을 한번에 초기화합니다
   */
  initializeAllAnimations() {
    this.createCustomerAnimations();
    this.createCookingEffects();
  }
}
