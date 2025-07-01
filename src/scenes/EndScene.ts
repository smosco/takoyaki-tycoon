import Phaser from 'phaser';
import { gameScore, gameStats, resetGameState } from '../state/gameState';
// import { AssetLoader } from '../utils/AssetLoader';
import { setCursorPointer } from '../utils/CursorUtils';

export class EndScene extends Phaser.Scene {
  constructor() {
    super('EndScene');
  }

  // preload() {
  //   AssetLoader.loadAllAssets(this);
  // }

  create() {
    this.add.image(400, 300, 'start-background').setScale(0.9);
    this.sound.play('game-over', { volume: 0.5 });

    // 어두운 오버레이
    this.add.rectangle(400, 300, 800, 600, 0x000000, 0.4);

    // 종이 질감 영수증 배경
    const receipt = this.add.image(400, 300, 'receipt');
    receipt.setOrigin(0.5).setScale(0.9);

    // 기준 위치
    const baseY = 180;
    const spacing = 38;
    const leftX = 270;

    // 공통 스타일
    const textStyle = {
      fontFamily: 'Gowun Dodum',
      color: '#3b2f2f',
      fontSize: '22px',
    };

    // 타이틀
    const title = this.add
      .text(400, 130, 'GAME OVER', {
        fontSize: '42px',
        color: '#5A2101',
        fontStyle: 'bold',
        fontFamily: 'Arial Black',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    // 점수 정보
    const scoreLine = this.add
      .text(leftX, baseY, `최종 점수     : ${gameScore.value}점`, textStyle)
      .setAlpha(0);
    const bonusLine = this.add
      .text(leftX, baseY + spacing, `보너스         : ${gameStats.happyBonus}점`, textStyle)
      .setAlpha(0);

    // 점선 구분자
    const separator = this.add
      .text(leftX, baseY + spacing * 2, '-----------------------------', {
        ...textStyle,
        fontSize: '20px',
      })
      .setAlpha(0);

    // 평가 메시지
    const rating = this.calculateRating();
    const ratingLine = this.add
      .text(leftX, baseY + spacing * 3, `등급            : ${rating.text}`, {
        ...textStyle,
        color: rating.color,
      })
      .setAlpha(0);

    // 평가 부연 설명
    const description = this.add
      .text(leftX, baseY + spacing * 4, rating.description, {
        fontSize: '18px',
        fontFamily: 'Gowun Dodum',
        color: '#555',
      })
      .setAlpha(0);

    // 하단 점선
    const bottomLine = this.add
      .text(leftX, baseY + spacing * 5.2, '=========================', {
        ...textStyle,
        fontSize: '20px',
      })
      .setAlpha(0);

    // 버튼들
    const restartButton = this.add
      .image(330, 460, 'retry-button')
      .setInteractive()
      .setScale(0.35)
      .setAlpha(0);
    const menuButton = this.add
      .image(480, 460, 'menu-button')
      .setInteractive()
      .setScale(0.35)
      .setAlpha(0);

    // 애니메이션 순서대로 등장
    const timeline = this.add.timeline([
      { at: 0, tween: { targets: title, alpha: 1, duration: 300 } },
      { at: 300, tween: { targets: scoreLine, alpha: 1, duration: 200 } },
      { at: 500, tween: { targets: bonusLine, alpha: 1, duration: 200 } },
      { at: 700, tween: { targets: separator, alpha: 1, duration: 150 } },
      { at: 850, tween: { targets: ratingLine, alpha: 1, duration: 200 } },
      { at: 1050, tween: { targets: description, alpha: 1, duration: 200 } },
      { at: 1250, tween: { targets: bottomLine, alpha: 1, duration: 200 } },
      { at: 1450, tween: { targets: [restartButton, menuButton], alpha: 1, duration: 300 } },
    ]);
    timeline.play();

    // 버튼 효과 및 이벤트
    this.setupButtonEvents(restartButton, menuButton);

    if (gameScore.value >= 1000) {
      this.time.delayedCall(1600, () => {
        this.createCelebrationEffect();
      });
    }
  }

  private setupButtonEvents(
    restartButton: Phaser.GameObjects.Image,
    menuButton: Phaser.GameObjects.Image
  ) {
    const scaleIn = (btn: Phaser.GameObjects.Image) =>
      this.tweens.add({ targets: btn, scale: 0.4, duration: 200, ease: 'Back.Out' });

    const scaleOut = (btn: Phaser.GameObjects.Image) =>
      this.tweens.add({ targets: btn, scale: 0.35, duration: 200, ease: 'Sine.easeOut' });

    setCursorPointer(restartButton, this);
    setCursorPointer(menuButton, this);

    restartButton.on('pointerover', () => scaleIn(restartButton));
    restartButton.on('pointerout', () => scaleOut(restartButton));
    restartButton.on('pointerdown', () => {
      resetGameState();
      this.scene.start('GameScene');
    });

    menuButton.on('pointerover', () => scaleIn(menuButton));
    menuButton.on('pointerout', () => scaleOut(menuButton));
    menuButton.on('pointerdown', () => {
      resetGameState();
      this.scene.start('StartScene');
    });
  }

  private calculateRating(): { text: string; color: string; description: string } {
    const score = gameScore.value;
    if (score >= 9000)
      return { text: '🏆 마스터 셰프', color: '#ffd700', description: '환상적인 솜씨입니다!' };
    if (score >= 8000)
      return {
        text: '⭐ 훌륭한 요리사',
        color: '#4caf50',
        description: '완벽에 가까운 실력이에요.',
      };
    if (score >= 7000)
      return { text: '👍 숙련된 조리사', color: '#2196f3', description: '경험이 느껴집니다.' };
    if (score >= 6000)
      return {
        text: '📈 성장 중인 요리사',
        color: '#ff9800',
        description: '조금만 더 연습해봐요.',
      };
    return {
      text: '💪 초보 요리사',
      color: '#f44336',
      description: '처음은 다 그래요. 포기하지 마세요!',
    };
  }

  private createCelebrationEffect() {
    for (let i = 0; i < 10; i++) {
      const star = this.add.text(
        Phaser.Math.Between(100, 700),
        Phaser.Math.Between(100, 500),
        '✨',
        { fontSize: '24px' }
      );
      this.tweens.add({
        targets: star,
        alpha: 0,
        scaleX: 2,
        scaleY: 2,
        duration: 2000,
        delay: i * 150,
        ease: 'Power2',
        onComplete: () => star.destroy(),
      });
    }
  }
}
