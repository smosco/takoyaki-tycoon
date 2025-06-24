import Phaser from 'phaser';
import {
  currentCustomer,
  gameFlow,
  startGame,
  updateGameTimer,
  serveToCustomer,
} from '../state/gameState';
import { ButtonPanel } from '../ui/ButtonPanel';
import { TopUI } from '../ui/TopUI';
import { IronPanManager } from '../game/IronPanManager';
import { PlatesManager } from '../game/PlatesManager';
import { CustomerManager } from '../game/CustomerManager';
import { AssetLoader } from '../utiils/AssetLoader';

export class GameScene extends Phaser.Scene {
  private topUI!: TopUI;
  private ironPanManager!: IronPanManager;
  private platesManager!: PlatesManager;
  private customerManager!: CustomerManager;

  constructor() {
    super('GameScene');
  }

  preload() {
    AssetLoader.loadAllAssets(this);
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

    // TODO: 사운드 끄기 버튼 추가(백그라운드 소리 너무 큼)
    this.sound.play('japan-background');
    this.sound.setVolume(0.2);
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

  private handleServing() {
    if (!gameFlow.isGameActive) {
      console.log('게임이 종료되어 서빙할 수 없습니다.');
      return;
    }

    // 현재 손님의 기분을 가져와서 serveToCustomer에 전달
    const currentMood = this.customerManager.getCurrentMood();
    const result = serveToCustomer(currentMood);

    if (result.success && result.result) {
      console.log(result.message);

      this.platesManager.updateDisplay();
      this.topUI.updateScore();

      if (result.orderCompleted) {
        this.customerManager.clearAllUI();
        this.time.delayedCall(2000, () => {
          if (gameFlow.isGameActive) {
            // 새로운 손님이 등장할때 레벨 업데이트
            this.topUI.updateLevel();
            this.customerManager.spawnNewCustomer();
          }
        });
      } else {
        if (currentCustomer.customer) {
          this.customerManager.updateProductionPanel(currentCustomer.customer.order);
        }
      }
    } else {
      console.log(result.message);
    }
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
