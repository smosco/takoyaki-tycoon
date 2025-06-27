import Phaser from 'phaser';
import {
  currentCustomer,
  gameFlow,
  startGame,
  updateGameTimer,
  platesWithTakoyaki,
} from '../state/gameState';
import { serveToCustomer } from '../services/customerService';
import { ButtonPanel } from '../ui/ButtonPanel';
import { TopUI } from '../ui/TopUI';
import { IronPanManager } from '../game/IronPanManager';
import { PlatesManager } from '../game/PlatesManager';
import { CustomerManager } from '../game/CustomerManager';

export class GameScene extends Phaser.Scene {
  private topUI!: TopUI;
  private ironPanManager!: IronPanManager;
  private platesManager!: PlatesManager;
  private customerManager!: CustomerManager;

  constructor() {
    super('GameScene');
  }

  create() {
    this.setupBackground();
    this.initializeManagers();
    this.startGameSystems();
  }

  private setupBackground() {
    this.add.image(400, 300, 'background').setScale(0.8).setDepth(0);
    this.add.image(400, 130, 'tent').setScale(0.3);
    this.add.image(650, 430, 'waiting-table').setScale(0.29).setDepth(2);
    this.add.image(240, 435, 'table').setScale(0.25).setDepth(3);

    this.add.particles(0, 0, 'sakura', {
      x: { min: 0, max: this.scale.width },
      y: 0,
      lifespan: 8000,
      speedY: { min: 30, max: 80 },
      speedX: { min: -30, max: 30 },
      scale: { start: 0.1, end: 0.2 },
      alpha: { start: 1, end: 0 },
      angle: { min: -30, max: 30 },
      rotate: { min: -90, max: 90 },
      gravityY: 5,
      frequency: 300,
      quantity: 1,
      blendMode: 'NORMAL',
    });

    this.sound.play('japan-background', { volume: 0.5, loop: true });
  }

  private initializeManagers() {
    this.topUI = new TopUI(this);
    this.platesManager = new PlatesManager(this);
    this.ironPanManager = new IronPanManager(this, this.platesManager);
    this.customerManager = new CustomerManager(this, this.platesManager);

    new ButtonPanel(this, 70, 560, () => this.handleServing());
  }

  private startGameSystems() {
    startGame();
    this.ironPanManager.startRealtimeUpdates();
    this.customerManager.startCustomerSystem();
    this.startGameTimer();
  }

  private async handleServing() {
    if (!gameFlow.isGameActive) {
      console.log('게임이 종료되어 서빙할 수 없습니다.');
      return;
    }

    if (platesWithTakoyaki.length === 0) {
      console.log('서빙할 타코야끼가 없습니다.');
      return;
    }

    const currentMood = this.customerManager.getCurrentMood();
    const result = serveToCustomer(currentMood);

    if (result.success && result.result) {
      console.log(result.message);

      // 타코야끼 상자 날리기 애니메이션
      await this.customerManager.animateBoxServing();

      // 성공적인 서빙 축하 효과
      if (result.result.correctCount > 0) {
        this.customerManager.celebrateSuccessfulServing();
        this.sound.play('serve-sound', { volume: 0.3 });
      }

      // UI 업데이트
      this.platesManager.updateDisplay();
      this.topUI.updateScore();

      if (result.orderCompleted) {
        this.showOrderCompletedEffect();

        // 보너스 조건: 주문 완료 + 손님 기분 happy일 때
        if (result.result.mood === 'happy') {
          this.showBonusEffect(result.result.bonusScore);
        }

        this.time.delayedCall(2000, () => {
          this.customerManager.clearAllUI();

          if (gameFlow.isGameActive) {
            this.topUI.updateLevel();
            this.customerManager.spawnNewCustomer();
          }
        });
      } else {
        // 부분 서빙 - 주문 패널만 업데이트
        if (currentCustomer.customer) {
          this.customerManager.updateProductionPanel(currentCustomer.customer.order);
        }
      }
    } else {
      console.log(result.message);
      // 실패 시 효과음
      // this.sound.play('serving-fail-sound', { volume: 0.2 });
    }
  }

  // 주문 완료 축하 효과
  private showOrderCompletedEffect() {
    const completeText = this.add
      .text(400, 250, '주문 완료!', {
        fontSize: '36px',
        color: '#ff6b35',
        fontStyle: 'bold',
        stroke: '#ffffff',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(50)
      .setAlpha(0);

    // 텍스트 애니메이션
    this.tweens.add({
      targets: completeText,
      alpha: 1,
      scaleX: 1.2,
      scaleY: 1.2,
      y: 200,
      duration: 600,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(1000, () => {
          this.tweens.add({
            targets: completeText,
            alpha: 0,
            y: 150,
            duration: 400,
            onComplete: () => completeText.destroy(),
          });
        });
      },
    });

    // 완료 사운드
    this.sound.play('serve-sound', { volume: 0.4 });
  }

  private showBonusEffect(bonusScore: number) {
    const centerX = 400;
    const centerY = 300;

    const bundle = this.add.image(centerX, centerY, 'money-bundle');
    bundle.setScale(0.4).setDepth(100).setAlpha(0).setAngle(-10);

    const bonusText = this.add.text(centerX, centerY + 60, `+${bonusScore}`, {
      fontSize: '36px',
      color: '#ffd700',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    });
    bonusText.setOrigin(0.5);
    bonusText.setDepth(100);
    bonusText.setAlpha(0);

    this.sound.play('bonus-sound', { volume: 0.5 });

    // 동시에 페이드 인
    this.tweens.add({
      targets: [bundle, bonusText],
      alpha: 1,
      duration: 200,
      ease: 'Power1',
    });

    // 회전 + y값 이동 + 텍스트 올라가기
    this.tweens.add({
      targets: bundle,
      angle: 720,
      duration: 1800,
      ease: 'Cubic.easeInOut',
      onComplete: () => {
        this.tweens.add({
          targets: bundle,
          alpha: 0,
          y: bundle.y + 30,
          duration: 400,
          ease: 'Power1',
          onComplete: () => {
            bundle.destroy();
          },
        });
      },
    });

    this.tweens.add({
      targets: bonusText,
      y: bonusText.y - 40,
      duration: 1200,
      ease: 'Sine.easeOut',
    });

    this.tweens.add({
      targets: bonusText,
      alpha: 0,
      delay: 1000,
      duration: 400,
      onComplete: () => {
        bonusText.destroy();
      },
    });
  }

  private startGameTimer() {
    this.time.addEvent({
      delay: 100,
      callback: () => {
        const gameEnded = updateGameTimer(Date.now());
        this.topUI.updateTimer();

        if (gameEnded) {
          this.scene.start('EndScene');
        }
      },
      callbackScope: this,
      loop: true,
    });
  }
}
