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
    this.add.image(400, 300, 'receipt').setScale(1.2);

    // 게임 오버 제목
    this.add
      .text(400, 120, 'GAME OVER', {
        fontSize: '42px',
        color: '#5A2101',
        fontStyle: 'bold',
        fontFamily: 'Arial Black',
      })
      .setOrigin(0.5);

    // 점수
    this.add
      .text(400, 200, `최종 점수: ${gameScore.value}점`, {
        fontSize: '32px',
        color: '#7c5200',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // 기분 좋은 손님 보너스
    this.add
      .text(400, 260, `보너스: ${gameStats.happyBonus}점 😊`, {
        fontSize: '24px',
        color: '#7c5200',
      })
      .setOrigin(0.5);

    // 평가
    const rating = this.calculateRating();
    this.add
      .text(400, 350, rating.text, {
        fontSize: '24px',
        color: '#5A2101',
      })
      .setOrigin(0.5);

    // 버튼들
    this.createButtons();

    // 폭죽 애니메이션 (높은 점수일 때)
    if (gameScore.value >= 1000) {
      this.createCelebrationEffect();
    }
  }

  /**
   * 재시작 및 메인 메뉴 버튼을 생성합니다.
   */
  private createButtons() {
    // 다시 하기 버튼
    const restartButton = this.add.image(320, 470, 'retry-button').setScale(0.35).setInteractive();

    // 메인 메뉴 버튼
    const menuButton = this.add.image(480, 470, 'menu-button').setScale(0.35).setInteractive();

    // 버튼 호버 효과
    restartButton.on('pointerover', () => {
      this.game.canvas.style.cursor = 'pointer';
      this.tweens.add({
        targets: restartButton,
        scale: 0.38,
        duration: 200,
        ease: 'Sine.easeOut',
      });
    });

    restartButton.on('pointerout', () => {
      this.game.canvas.style.cursor = 'default';
      this.tweens.add({
        targets: restartButton,
        scale: 0.35,
        duration: 200,
        ease: 'Sine.easeOut',
      });
    });

    menuButton.on('pointerover', () => {
      this.game.canvas.style.cursor = 'pointer';
      this.tweens.add({
        targets: menuButton,
        scale: 0.38,
        duration: 200,
        ease: 'Sine.easeOut',
      });
    });

    menuButton.on('pointerout', () => {
      this.game.canvas.style.cursor = 'default';
      this.tweens.add({
        targets: menuButton,
        scale: 0.35,
        duration: 200,
        ease: 'Sine.easeOut',
      });
    });

    // 버튼 클릭 이벤트
    restartButton.on('pointerdown', () => {
      resetGameState();
      this.scene.start('GameScene');
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
