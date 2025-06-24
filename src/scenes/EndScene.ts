import Phaser from 'phaser';
import { gameScore, gameStats, resetGameState } from '../state/gameState';

/**
 * 게임 종료 화면을 관리하는 씬
 * 최종 점수, 통계, 재시작/메인 메뉴 버튼을 표시합니다.
 */
export class EndScene extends Phaser.Scene {
  constructor() {
    super('EndScene');
  }

  /**
   * 게임 종료 화면 UI를 생성합니다.
   * 최종 점수, 상세 통계, 평가, 버튼들을 배치합니다.
   */
  create() {
    // 배경
    this.add.rectangle(400, 300, 800, 600, 0x2d2d2d);

    // 게임 오버 제목
    this.add
      .text(400, 80, 'Game Over!', {
        fontSize: '42px',
        color: '#ff6b6b',
        fontFamily: 'Arial Black',
      })
      .setOrigin(0.5);

    // 최종 점수 (큰 글씨로 강조)
    this.add
      .text(400, 150, `최종 점수: ${gameScore.value}점`, {
        fontSize: '32px',
        color: '#ffd700',
        fontFamily: 'Arial Bold',
      })
      .setOrigin(0.5);

    // 게임 통계
    const stats = [
      `총 서빙한 손님: ${gameStats.servedCustomers}명`,
      `만족한 손님: ${gameStats.happyCustomers}명 😊`,
      `불만족한 손님: ${gameStats.angryCustomers}명 😠`,
      `중립 손님: ${
        gameStats.servedCustomers - gameStats.happyCustomers - gameStats.angryCustomers
      }명 😐`,
    ];

    this.add
      .text(400, 220, stats.join('\n'), {
        fontSize: '18px',
        color: '#fff',
        align: 'center',
        lineSpacing: 8,
      })
      .setOrigin(0.5);

    // 성과 평가
    const rating = this.calculateRating();
    this.add
      .text(400, 320, rating.text, {
        fontSize: '20px',
        color: rating.color,
        fontFamily: 'Arial Bold',
      })
      .setOrigin(0.5);

    // 평가 설명
    this.add
      .text(400, 350, rating.description, {
        fontSize: '14px',
        color: '#cccccc',
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
    const restartButton = this.add
      .rectangle(300, 450, 160, 45, 0x4caf50)
      .setInteractive()
      .setStrokeStyle(2, 0x2e7d32);

    this.add
      .text(300, 450, '다시 하기', {
        fontSize: '18px',
        color: '#fff',
        fontFamily: 'Arial Bold',
      })
      .setOrigin(0.5);

    // 메인 메뉴 버튼
    const menuButton = this.add
      .rectangle(500, 450, 160, 45, 0x2196f3)
      .setInteractive()
      .setStrokeStyle(2, 0x1565c0);

    this.add
      .text(500, 450, '메인 메뉴', {
        fontSize: '18px',
        color: '#fff',
        fontFamily: 'Arial Bold',
      })
      .setOrigin(0.5);

    // 버튼 호버 효과
    restartButton.on('pointerover', () => {
      restartButton.setFillStyle(0x66bb6a);
      this.game.canvas.style.cursor = 'pointer';
    });

    restartButton.on('pointerout', () => {
      restartButton.setFillStyle(0x4caf50);
      this.game.canvas.style.cursor = 'default';
    });

    menuButton.on('pointerover', () => {
      menuButton.setFillStyle(0x42a5f5);
      this.game.canvas.style.cursor = 'pointer';
    });

    menuButton.on('pointerout', () => {
      menuButton.setFillStyle(0x2196f3);
      this.game.canvas.style.cursor = 'default';
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

    if (score >= 2000) {
      return {
        text: '🏆 타코야끼 마스터! 🏆',
        color: '#ffd700',
        description: '완벽한 실력입니다!',
      };
    } else if (score >= 1500) {
      return {
        text: '⭐ 훌륭한 요리사! ⭐',
        color: '#4caf50',
        description: '매우 잘했어요!',
      };
    } else if (score >= 1000) {
      return {
        text: '👍 괜찮은 실력! 👍',
        color: '#2196f3',
        description: '더 연습하면 완벽해질 거예요!',
      };
    } else if (score >= 500) {
      return {
        text: '📈 발전하고 있어요!',
        color: '#ff9800',
        description: '조금 더 노력해보세요!',
      };
    } else {
      return {
        text: '💪 다음엔 더 잘할 수 있어요!',
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
