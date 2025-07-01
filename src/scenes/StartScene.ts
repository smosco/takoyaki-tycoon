import Phaser from 'phaser';
import { resetGameState } from '../state/gameState';
import { AssetLoader } from '../utils/AssetLoader';
import { howToPlayContent } from '../constants/howTolayContent';
import { setCursorPointer } from '../utils/CursorUtils';

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
    this.add.image(400, 300, 'start-background').setScale(0.9);
    this.add.image(630, 430, 'customer-happy').setScale(0.7);
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
    const title = this.add.image(400, 150, 'game-title').setScale(0.9);

    // 타이틀 애니메이션
    this.tweens.add({
      targets: title,
      scale: 0.93,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private createButtons() {
    // 시작 버튼
    const startButton = this.add
      .image(150, 400, 'game-start-button')
      .setScale(0.8)
      .setInteractive();

    startButton.on('pointerdown', () => {
      this.startGame();
    });

    // 커서 포인터 효과 적용
    setCursorPointer(startButton, this);

    // 호버 효과
    startButton.on('pointerover', () => {
      this.tweens.add({
        targets: startButton,
        scale: 0.85,
        duration: 200,
        ease: 'Sine.easeOut',
      });
    });

    startButton.on('pointerout', () => {
      this.tweens.add({
        targets: startButton,
        scale: 0.8,
        duration: 200,
        ease: 'Sine.easeOut',
      });
    });

    // 방법 버튼
    const howToButton = this.add
      .image(150, 490, 'game-manual-button')
      .setScale(0.8)
      .setInteractive();

    howToButton.on('pointerdown', () => {
      this.showHowToPlay();
    });

    // 커서 포인터 효과 적용
    setCursorPointer(howToButton, this);

    // 호버 효과
    howToButton.on('pointerover', () => {
      this.tweens.add({
        targets: howToButton,
        scale: 0.85,
        duration: 200,
        ease: 'Sine.easeOut',
      });
    });

    howToButton.on('pointerout', () => {
      this.tweens.add({
        targets: howToButton,
        scale: 0.8,
        duration: 200,
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
    resetGameState();

    // 페이드 아웃 효과와 함께 게임 시작
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameScene');
    });
  }

  private showHowToPlay() {
    if (this.howToPlayModal) return;

    // 오버레이
    const overlay = this.add
      .rectangle(400, 300, 800, 600, 0x000000)
      .setInteractive()
      .setDepth(10)
      .setAlpha(0); // 투명하게 시작

    this.tweens.add({
      targets: overlay,
      alpha: 0.5,
      duration: 200,
      ease: 'Power2',
    });

    // ESC나 클릭 시 닫기
    overlay.on('pointerdown', () => {
      this.closeHowToPlay();
    });

    // 방법 모달
    this.howToPlayModal = this.add.container(400, 300).setDepth(1001);

    // 모달 크기 설정
    const modalWidth = 480;
    const modalHeight = 480;
    const padding = 30;

    // 9-slice 모달 배경
    const modalBg = this.add
      .nineslice(
        0,
        0, // x, y
        'manual-modal', // texture key
        undefined,
        modalWidth, // width
        modalHeight, // height
        64,
        64,
        64,
        64
      )
      .setOrigin(0.5);

    // 모달 제목
    const modalTitle = this.add
      .text(0, -modalHeight / 2 + 55, '게임 방법', {
        fontSize: '32px',
        fontStyle: 'bold',
        color: '#5A2101',
        fontFamily: 'Arial',
      })
      .setOrigin(0.5);

    // 콘텐츠 영역
    const contentY = -modalHeight / 2 + 100;

    const contentText = this.add
      .text(0, contentY, howToPlayContent.join('\n'), {
        fontSize: '20px',
        fontStyle: 'normal',
        color: '#ffffff',
        align: 'left',
        lineSpacing: 8,
        wordWrap: {
          width: modalWidth - padding * 2,
          useAdvancedWrap: true,
        },
      })
      .setOrigin(0.5, 0);

    // 닫기 버튼 (하단 중앙)
    const closeButton = this.add
      .image(modalWidth / 2 - 90, modalHeight / 2 - 55, 'modal-close-button')
      .setScale(0.6)
      .setInteractive()
      .setOrigin(0.5);

    setCursorPointer(closeButton, this);

    closeButton.on('pointerdown', () => {
      this.closeHowToPlay();
    });

    closeButton.on('pointerover', () => {
      this.tweens.add({
        targets: closeButton,
        scale: 0.65,
        duration: 200,
        ease: 'Power2.easeOut',
      });
    });

    closeButton.on('pointerout', () => {
      this.tweens.add({
        targets: closeButton,
        scale: 0.6,
        duration: 200,
        ease: 'Power2.easeOut',
      });
    });

    // 컨테이너에 추가
    this.howToPlayModal.add([modalBg, modalTitle, contentText, closeButton]);

    // 세련된 등장 애니메이션
    this.howToPlayModal.setScale(0.8);
    this.howToPlayModal.setAlpha(0);

    this.tweens.add({
      targets: this.howToPlayModal,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 350,
      ease: 'Power3.easeOut',
    });

    // 닫을 때 오버레이도 같이 제거하도록 기억
    this.howToPlayModal.setData('overlay', overlay); // 모달에 연결

    // ESC 키로 닫기
    this.input.keyboard?.once('keydown-ESC', () => {
      this.closeHowToPlay();
    });

    // 오버레이 클릭으로 닫기
    overlay.on('pointerdown', () => {
      this.closeHowToPlay();
    });
  }

  private closeHowToPlay() {
    if (!this.howToPlayModal) return;

    const overlay = this.howToPlayModal.getData('overlay') as
      | Phaser.GameObjects.Rectangle
      | undefined;

    this.tweens.add({
      targets: this.howToPlayModal,
      scaleX: 0.8,
      scaleY: 0.8,
      alpha: 0,
      duration: 250,
      ease: 'Power2.easeIn',
      onComplete: () => {
        this.howToPlayModal?.destroy();
        this.howToPlayModal = null;
      },
    });

    if (overlay) {
      this.tweens.add({
        targets: overlay,
        alpha: 0,
        duration: 200,
        ease: 'Power1',
        onComplete: () => overlay.destroy(),
      });
    }
  }
}
