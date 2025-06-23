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
  }

  private initializeManagers() {
    this.topUI = new TopUI(this);
    this.platesManager = new PlatesManager(this);

    // 중요: PlatesManager를 IronPanManager에 넘겨야 접시에 타코야끼가 보임
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

    const result = serveToCustomer();

    if (result.success && result.result) {
      console.log(result.message);
      this.customerManager.showFeedback(result.result.mood);
      this.platesManager.updateDisplay();
      this.topUI.updateScore();

      if (result.orderCompleted) {
        this.customerManager.clearAllUI();
        this.time.delayedCall(2000, () => {
          if (gameFlow.isGameActive) {
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
