import Phaser from 'phaser';
import { resetGameState } from '../state/gameState';

/**
 * 게임 시작 화면을 관리하는 씬
 * 게임 제목, 설명, 시작 버튼을 표시합니다.
 */
export class StartScene extends Phaser.Scene {
  constructor() {
    super('StartScene');
  }

  /**
   * 시작 화면 UI를 생성합니다.
   * 게임 제목, 설명, 조작법, 시작 버튼을 배치합니다.
   */
  create() {
    // 배경
    this.add.rectangle(400, 300, 800, 600, 0x2d2d2d);

    // 게임 제목
    this.add
      .text(400, 80, 'Takoyaki Tycoon', {
        fontSize: '48px',
        color: '#fff',
        fontFamily: 'Arial Black',
      })
      .setOrigin(0.5)
      .setName('title');

    // 게임 설명
    const gameDescription = [
      '제한 시간 3분 안에 가장 많은 점수를 획득하세요!',
      '',
      '📋 게임 방법:',
      '1. 반죽을 넣고 문어를 추가하세요',
      '2. 꼬챙이로 뒤집고 접시에 담으세요',
      '3. 소스와 토핑을 추가하세요',
      '4. 손님 주문에 맞게 서빙하세요',
      '',
      '⭐ 점수: 정확한 타코야끼 1개당 100점',
      '😊 손님이 만족하면 더 좋은 평가를 받습니다!',
    ];

    this.add
      .text(400, 250, gameDescription.join('\n'), {
        fontSize: '16px',
        color: '#fff',
        align: 'center',
        lineSpacing: 5,
      })
      .setOrigin(0.5);

    // 조작법
    const controls = [
      '🎮 조작법:',
      '• 버튼을 클릭하여 도구 선택',
      '• 철판을 클릭하여 타코야끼 제작',
      '• 접시를 클릭하여 소스/토핑 추가',
      '• 서빙 버튼으로 손님에게 제공',
    ];

    this.add
      .text(400, 440, controls.join('\n'), {
        fontSize: '16px',
        color: '#fff',
        align: 'center',
        lineSpacing: 5,
      })
      .setOrigin(0.5);

    // 시작 버튼
    const startButton = this.add
      .rectangle(400, 530, 200, 50, 0x4caf50)
      .setInteractive()
      .setStrokeStyle(3, 0x2e7d32);

    this.add
      .text(400, 530, '게임 시작', {
        fontSize: '20px',
        color: '#fff',
        fontFamily: 'Arial Bold',
      })
      .setOrigin(0.5);

    // 버튼 호버 효과
    startButton.on('pointerover', () => {
      startButton.setFillStyle(0x66bb6a);
      this.game.canvas.style.cursor = 'pointer';
    });

    startButton.on('pointerout', () => {
      startButton.setFillStyle(0x4caf50);
      this.game.canvas.style.cursor = 'default';
    });

    // 게임 시작
    startButton.on('pointerdown', () => {
      resetGameState(); // 게임 상태 초기화
      this.scene.start('GameScene'); // 게임 씬으로 전환
    });

    // 타이틀 애니메이션
    this.tweens.add({
      targets: this.children.getByName('title'),
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
}
