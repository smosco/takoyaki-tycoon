import Phaser from 'phaser';
import { resetGameState } from '../state/gameState';
import { AssetLoader } from '../utiils/AssetLoader';

/**
 * 게임 시작 화면을 관리하는 씬
 * 게임 제목, 시작 버튼, 방법 버튼을 표시합니다.
 */
export class StartScene extends Phaser.Scene {
  private howToPlayModal: Phaser.GameObjects.Container | null = null;

  constructor() {
    super('StartScene');
  }

  preload() {
    AssetLoader.loadAllAssets(this);
  }

  /**
   * 시작 화면 UI를 생성합니다.
   * 게임 제목, 시작 버튼, 방법 버튼을 배치합니다.
   */
  create() {
    this.createBackground();
    this.createTitle();
    this.createButtons();
  }

  private createBackground() {
    this.add.image(400, 300, 'start-background').setScale(0.6);
    // 배경 장식 - 떨어지는 벚꽃
    this.add.particles(0, 0, 'sakura', {
      x: { min: 0, max: this.scale.width },
      y: 0,
      lifespan: 8000,
      speedY: { min: 20, max: 50 },
      speedX: { min: -20, max: 20 },
      scale: { start: 0.08, end: 0.15 },
      alpha: { start: 0.8, end: 0 },
      angle: { min: -30, max: 30 },
      rotate: { min: -90, max: 90 },
      gravityY: 3,
      frequency: 500,
      quantity: 1,
      blendMode: 'NORMAL',
    });
  }

  private createTitle() {
    // 메인 타이틀
    const title = this.add
      .text(400, 150, '타코야끼를 달라냥', {
        fontSize: '56px',
        fontStyle: 'bold',
        color: '#fff',
        fontFamily: 'Arial Black',
        stroke: '#ff6b35',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setName('title');

    // 타이틀 애니메이션
    this.tweens.add({
      targets: title,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private createButtons() {
    // 시작 버튼
    const startButton = this.add
      .image(150, 380, 'game-start-button')
      .setScale(0.45)
      .setInteractive(); // Interactive 설정 추가

    startButton.on('pointerdown', () => {
      console.log('게임 시작 버튼 클릭');
      this.startGame();
    });

    // 호버 효과 추가
    startButton.on('pointerover', () => {
      this.game.canvas.style.cursor = 'pointer';
      this.tweens.add({
        targets: startButton,
        scale: 0.5,
        duration: 100,
        ease: 'Sine.easeOut',
      });
    });

    startButton.on('pointerout', () => {
      this.game.canvas.style.cursor = 'default';
      this.tweens.add({
        targets: startButton,
        scale: 0.45,
        duration: 100,
        ease: 'Sine.easeOut',
      });
    });

    // 방법 버튼
    const howToButton = this.add
      .image(150, 490, 'game-manual-button')
      .setScale(0.45)
      .setInteractive(); // Interactive 설정 추가

    // 올바른 이벤트 연결 (startButton이 아니라 howToButton)
    howToButton.on('pointerdown', () => {
      console.log('게임 방법 버튼 클릭');
      this.showHowToPlay();
    });

    // 호버 효과 추가
    howToButton.on('pointerover', () => {
      this.game.canvas.style.cursor = 'pointer';
      this.tweens.add({
        targets: howToButton,
        scale: 0.5,
        duration: 100,
        ease: 'Sine.easeOut',
      });
    });

    howToButton.on('pointerout', () => {
      this.game.canvas.style.cursor = 'default';
      this.tweens.add({
        targets: howToButton,
        scale: 0.45,
        duration: 100,
        ease: 'Sine.easeOut',
      });
    });

    // 버튼 등장 애니메이션
    [startButton, howToButton].forEach((button, index) => {
      button.setAlpha(0);
      button.setY(button.y + 50);

      this.tweens.add({
        targets: button,
        alpha: 1,
        y: button.y - 50,
        duration: 600,
        delay: index * 200,
        ease: 'Back.easeOut',
      });
    });
  }

  private startGame() {
    // 시작 효과음
    // this.sound.play('start');

    resetGameState(); // 게임 상태 초기화

    // 페이드 아웃 효과와 함께 게임 시작
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameScene');
    });
  }

  private showHowToPlay() {
    if (this.howToPlayModal) return; // 이미 열려있으면 무시

    this.howToPlayModal = this.add.container(400, 300);

    // 모달 배경 (반투명)
    const overlay = this.add.rectangle(0, 0, 800, 600, 0x000000, 0.7);
    overlay.setInteractive(); // 뒤쪽 클릭 방지

    // 모달 박스
    const modalBg = this.add.rectangle(0, 0, 600, 500, 0x2d2d2d).setStrokeStyle(3, 0xffd700);

    // 제목
    const modalTitle = this.add
      .text(0, -200, '게임 방법', {
        fontSize: '28px',
        color: '#ffd700',
        fontFamily: 'Arial Bold',
      })
      .setOrigin(0.5);

    // 내용
    const content = [
      '1. 🥣 반죽을 철판에 넣고 🐙 문어를 추가하세요',
      '2. ⏰ 적절한 타이밍에 🥢 꼬챙이로 뒤집으세요',
      '3. 🍽️ 완성된 타코야끼를 접시에 담으세요',
      '4. 🥫 소스와 토핑(파, 가츠오부시, 김)을 추가하세요',
      '5. 👥 손님 주문에 맞게 서빙하세요',
      '',
      '⭐ 점수 시스템:',
      '• 정확한 타코야끼 1개당 100점',
      '• 😊 손님이 행복하면 보너스 +50점/개',
      '• 완벽한 익힘도와 정확한 토핑이 중요해요!',
      '',
      '⏱️ 제한시간: 3분',
    ];

    const contentText = this.add
      .text(0, 0, content.join('\n'), {
        fontSize: '16px',
        color: '#ffffff',
        align: 'left',
        lineSpacing: 8,
      })
      .setOrigin(0.5);

    // 닫기 버튼
    const closeButton = this.add
      .rectangle(0, 180, 120, 40, 0xff5722)
      .setStrokeStyle(2, 0xd84315)
      .setInteractive();

    const closeText = this.add
      .text(0, 180, '닫기', {
        fontSize: '18px',
        color: '#fff',
        fontFamily: 'Arial Bold',
      })
      .setOrigin(0.5);

    // 닫기 버튼 효과
    closeButton.on('pointerover', () => {
      closeButton.setFillStyle(0xff7043);
      this.game.canvas.style.cursor = 'pointer';
    });

    closeButton.on('pointerout', () => {
      closeButton.setFillStyle(0xff5722);
      this.game.canvas.style.cursor = 'default';
    });

    closeButton.on('pointerdown', () => {
      this.closeHowToPlay();
    });

    // 모달에 모든 요소 추가
    this.howToPlayModal.add([overlay, modalBg, modalTitle, contentText, closeButton, closeText]);

    // 모달 등장 애니메이션
    this.howToPlayModal.setScale(0);
    this.howToPlayModal.setAlpha(0);

    this.tweens.add({
      targets: this.howToPlayModal,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 400,
      ease: 'Back.easeOut',
    });

    // ESC 키로 닫기
    this.input.keyboard?.once('keydown-ESC', () => {
      this.closeHowToPlay();
    });
  }

  private closeHowToPlay() {
    if (!this.howToPlayModal) return;

    // 모달 사라짐 애니메이션
    this.tweens.add({
      targets: this.howToPlayModal,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      duration: 300,
      ease: 'Back.easeIn',
      onComplete: () => {
        this.howToPlayModal?.destroy();
        this.howToPlayModal = null;
      },
    });
  }
}
