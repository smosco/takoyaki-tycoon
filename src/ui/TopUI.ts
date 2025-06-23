import Phaser from 'phaser';
import { gameScore, getFormattedTime } from '../state/gameState';

export class TopUI {
  private scene: Phaser.Scene;
  private scoreText: Phaser.GameObjects.Text | null = null;
  private timerText: Phaser.GameObjects.Text | null = null;
  private progressBarFill: Phaser.GameObjects.Graphics | null = null;
  private progressBg: Phaser.GameObjects.Graphics | null = null;

  private readonly progressBarWidth = 250;
  private readonly progressBarHeight = 20;
  private readonly progressBarX = 300;
  private readonly progressBarY = 25;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.create();
  }

  private create() {
    this.createBackground();
    this.createLevelDisplay();
    this.createTimerDisplay();
    this.createScoreDisplay();
    this.createProgressBar();
  }

  private createBackground() {
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x1e1b18, 0.5);
    bg.fillRoundedRect(10, 10, 780, 50, 48);
    bg.setDepth(10);

    const border = this.scene.add.graphics();
    border.lineStyle(3, 0xfac36e);
    border.strokeRoundedRect(10, 10, 780, 50, 48);
    border.setDepth(11);
  }

  private createLevelDisplay() {
    this.scene.add
      .text(40, 27, '레벨', {
        fontSize: '18px',
        color: '#FFD700',
      })
      .setDepth(12);

    this.scene.add
      .text(90, 23, '1', {
        fontSize: '24px',
        color: '#fff',
      })
      .setDepth(12);
  }

  private createTimerDisplay() {
    this.timerText = this.scene.add
      .text(200, 23, '03:00', {
        fontSize: '24px',
        color: '#fff',
      })
      .setDepth(12);
  }

  private createScoreDisplay() {
    this.scene.add
      .text(620, 27, '점수', {
        fontSize: '18px',
        color: '#FFD700',
      })
      .setDepth(12);

    this.scoreText = this.scene.add
      .text(670, 23, '0', {
        fontSize: '24px',
        color: '#fff',
      })
      .setDepth(12);
  }

  private createProgressBar() {
    this.progressBg = this.scene.add.graphics();
    this.progressBg.fillStyle(0x333333, 1);
    this.progressBg.fillRoundedRect(
      this.progressBarX,
      this.progressBarY,
      this.progressBarWidth,
      this.progressBarHeight,
      10
    );
    this.progressBg.setDepth(11);

    this.progressBarFill = this.scene.add.graphics();
    this.progressBarFill.setDepth(12);
  }

  updateTimer() {
    if (!this.timerText || !this.progressBarFill) return;

    const timeString = getFormattedTime();
    this.timerText.setText(timeString);

    const [minutes, seconds] = timeString.split(':').map(Number);
    const totalSeconds = minutes * 60 + seconds;
    const maxTime = 180;
    const ratio = Phaser.Math.Clamp(totalSeconds / maxTime, 0, 1);

    // 진행바 업데이트
    this.progressBarFill.clear();
    this.progressBarFill.fillGradientStyle(0xffd700, 0xff4444, 0xffd700, 0xff4444, 1);
    this.progressBarFill.fillRoundedRect(
      this.progressBarX,
      this.progressBarY,
      this.progressBarWidth * ratio,
      this.progressBarHeight,
      10
    );

    // 시간 부족 시 효과
    this.applyTimerEffects(totalSeconds);
  }

  private applyTimerEffects(totalSeconds: number) {
    if (!this.timerText) return;

    if (totalSeconds <= 30) {
      this.timerText.setColor('#ff4444');
      if (!this.timerText.getData('blinking')) {
        this.timerText.setData('blinking', true);
        this.scene.tweens.add({
          targets: this.timerText,
          alpha: 0.3,
          duration: 500,
          yoyo: true,
          repeat: -1,
        });
      }
    } else {
      this.timerText.setColor('#ffffff');
    }

    if (totalSeconds <= 15 && !this.timerText.getData('pumping')) {
      this.timerText.setData('pumping', true);
      this.scene.tweens.add({
        targets: this.timerText,
        scale: 1.2,
        duration: 300,
        yoyo: true,
        repeat: -1,
      });
    } else if (totalSeconds > 15 && this.timerText.getData('pumping')) {
      this.timerText.setData('pumping', false);
      this.timerText.setScale(1);
    }
  }

  updateScore() {
    if (this.scoreText) {
      this.scoreText.setText(gameScore.value.toString());
    }
  }
}
