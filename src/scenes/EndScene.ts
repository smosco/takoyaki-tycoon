import Phaser from 'phaser';
import { gameScore, gameStats, resetGameState } from '../state/gameState';
// import { AssetLoader } from '../utils/AssetLoader';

/**
 * 게임 종료 화면을 관리하는 씬
 * 최종 점수, 통계, 재시작/메인 메뉴 버튼을 표시합니다.
 */
export class EndScene extends Phaser.Scene {
  constructor() {
    super('EndScene');
  }

  // preload() {
  //   AssetLoader.loadAllAssets(this);
  // }

  /**
   * 게임 종료 화면 UI를 생성합니다.
   * 최종 점수, 상세 통계, 평가, 버튼들을 배치합니다.
   */
  create() {
    // 배경
    this.add.image(400, 300, 'start-background').setScale(0.9);
    this.sound.play('game-over', { volume: 0.5 });

    const receipt = this.add.image(400, 300, 'receipt').setScale(1.2);
    let fx;

    if (receipt.preFX) {
      fx = receipt.preFX.addReveal(0.1, 0, 1);
      this.tweens.add({
        targets: fx,
        progress: 1,
        duration: 1000,
      });
    }

    // UI 요소들 생성 (초기 상태는 alpha: 0)
    const gameOverText = this.add
      .text(400, 120, 'GAME OVER', {
        fontSize: '42px',
        color: '#5A2101',
        fontStyle: 'bold',
        fontFamily: 'Arial Black',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    const scoreText = this.add
      .text(400, 200, `최종 점수: ${gameScore.value}점`, {
        fontSize: '32px',
        color: '#7c5200',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    const bonusText = this.add
      .text(400, 260, `보너스: ${gameStats.happyBonus}점 😊`, {
        fontSize: '24px',
        color: '#7c5200',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    const rating = this.calculateRating();
    const ratingText = this.add
      .text(400, 350, rating.text, {
        fontSize: '24px',
        color: '#5A2101',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    const restartButton = this.add
      .image(320, 470, 'retry-button')
      .setScale(0.35)
      .setInteractive()
      .setAlpha(0);

    const menuButton = this.add
      .image(480, 470, 'menu-button')
      .setScale(0.35)
      .setInteractive()
      .setAlpha(0);

    // Timeline을 사용한 순차 페이드인
    const timeline = this.add.timeline([
      {
        at: 0,
        tween: {
          targets: gameOverText,
          alpha: 1,
          duration: 300,
        },
      },
      {
        at: 400,
        tween: {
          targets: scoreText,
          alpha: 1,
          duration: 300,
        },
      },
      {
        at: 800,
        tween: {
          targets: bonusText,
          alpha: 1,
          duration: 300,
        },
      },
      {
        at: 1200,
        tween: {
          targets: ratingText,
          alpha: 1,
          duration: 300,
        },
      },
      {
        at: 1600,
        tween: {
          targets: [restartButton, menuButton],
          alpha: 1,
          duration: 300,
        },
      },
    ]);

    timeline.play();

    // 버튼 호버 효과와 이벤트 설정
    this.setupButtonEvents(restartButton, menuButton);

    // 점수 1000 이상이면 축하 효과는 마지막에 정적으로 한번만
    if (gameScore.value >= 1000) {
      this.time.delayedCall(2000, () => {
        this.createCelebrationEffect();
      });
    }
  }

  /**
   * 재시작 및 메인 메뉴 버튼을 생성합니다.
   */
  private setupButtonEvents(
    restartButton: Phaser.GameObjects.Image,
    menuButton: Phaser.GameObjects.Image
  ) {
    const scaleIn = (btn: Phaser.GameObjects.Image) =>
      this.tweens.add({ targets: btn, scale: 0.38, duration: 200, ease: 'Sine.easeOut' });

    const scaleOut = (btn: Phaser.GameObjects.Image) =>
      this.tweens.add({ targets: btn, scale: 0.35, duration: 200, ease: 'Sine.easeOut' });

    restartButton.on('pointerover', () => {
      this.game.canvas.style.cursor = 'pointer';
      scaleIn(restartButton);
    });
    restartButton.on('pointerout', () => {
      this.game.canvas.style.cursor = 'default';
      scaleOut(restartButton);
    });
    restartButton.on('pointerdown', () => {
      resetGameState();
      this.scene.start('GameScene');
    });

    menuButton.on('pointerover', () => {
      this.game.canvas.style.cursor = 'pointer';
      scaleIn(menuButton);
    });
    menuButton.on('pointerout', () => {
      this.game.canvas.style.cursor = 'default';
      scaleOut(menuButton);
    });
    menuButton.on('pointerdown', () => {
      resetGameState();
      this.scene.start('StartScene');
    });
  }

  /**
   * 점수에 따른 평가를 계산합니다.
   *
   * @returns 평가 텍스트와 색상
   */
  private calculateRating(): { text: string; color: string; description: string } {
    const score = gameScore.value;

    if (score >= 9000) {
      return {
        text: '🏆 타코야끼 마스터! 🏆',
        color: '#ffd700',
        description: '완벽한 실력입니다!',
      };
    } else if (score >= 8000) {
      return {
        text: '⭐ 훌륭한 요리사! ⭐',
        color: '#4caf50',
        description: '매우 잘했어요!',
      };
    } else if (score >= 7000) {
      return {
        text: '👍 괜찮은 요리사! 👍',
        color: '#2196f3',
        description: '더 연습하면 완벽해질 거예요!',
      };
    } else if (score >= 6000) {
      return {
        text: '📈 성장하는 요리사!',
        color: '#ff9800',
        description: '조금 더 노력해보세요!',
      };
    } else {
      return {
        text: '💪 초보 요리사!',
        color: '#f44336',
        description: '포기하지 마세요!',
      };
    }
  }

  /**
   * 높은 점수일 때 축하 효과를 생성합니다.
   */
  private createCelebrationEffect() {
    // 간단한 반짝이는 효과
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
        delay: i * 200,
        ease: 'Power2',
        onComplete: () => star.destroy(),
      });
    }
  }
}
