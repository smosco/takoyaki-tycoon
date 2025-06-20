import Phaser from 'phaser';
import {
  ironPanCells,
  currentSelectedTool,
  platesWithTakoyaki,
  calculateCurrentCookingLevel,
  currentCustomer,
  spawnNewCustomer,
  serveToCustomer,
  gameScore,
  gameStats,
  startGame,
  updateGameTimer,
  getFormattedTime,
  gameFlow,
  type IronPanCellState,
  type CookingLevel,
} from '../state/gameState';
import { ButtonPanel } from '../ui/ButtonPanel';

export class GameScene extends Phaser.Scene {
  private plateVisualElements: Phaser.GameObjects.Image[] = [];
  private plateTextElements: Phaser.GameObjects.Text[] = [];
  private ironPanVisualCells: Phaser.GameObjects.Image[] = [];

  // 손님 UI 요소들
  private customerContainer: Phaser.GameObjects.Container | null = null;
  private scoreText: Phaser.GameObjects.Text | null = null;
  private statsText: Phaser.GameObjects.Text | null = null;
  private timerText: Phaser.GameObjects.Text | null = null;

  constructor() {
    super('GameScene');
  }

  preload() {
    this.load.image('button', 'assets/button.png');
    this.load.image('tent', 'assets/tent.png');
    this.load.image('plate', 'assets/plate.png');
    this.load.image('plate-cell', 'assets/plate-cell.png');
    this.load.image('table', 'assets/table.png');
    this.load.image('dish', 'assets/dish.png');

    // 철판 이미지들
    this.load.image('plate-cell-batter-raw', 'assets/plate-cell-batter-raw.png');
    this.load.image('plate-cell-batter-perfect', 'assets/plate-cell-batter-perfect.png');
    this.load.image('plate-cell-batter-burnt', 'assets/plate-cell-batter-burnt.png');

    this.load.image('plate-cell-batter-raw-octopus', 'assets/plate-cell-batter-raw-octopus.png');
    this.load.image(
      'plate-cell-batter-perfect-octopus',
      'assets/plate-cell-batter-perfect-octopus.png'
    );
    this.load.image(
      'plate-cell-batter-burnt-octopus',
      'assets/plate-cell-batter-burnt-octopus.png'
    );

    this.load.image('plate-cell-batter-raw-flipped', 'assets/plate-cell-batter-raw-flipped.png');
    this.load.image(
      'plate-cell-batter-perfect-flipped',
      'assets/plate-cell-batter-perfect-flipped.png'
    );
    this.load.image(
      'plate-cell-batter-burnt-flipped',
      'assets/plate-cell-batter-burnt-flipped.png'
    );

    // 접시 이미지들
    this.load.image('tako-position', 'assets/tako-position.png');
    this.load.image('tako-perfect', 'assets/tako-perfect.png');
    this.load.image('tako-perfect-sauce', 'assets/tako-perfect-sauce.png');
    this.load.image('tako-perfect-sauce-negi', 'assets/tako-perfect-sauce-negi.png');
    this.load.image('tako-perfect-sauce-katsuobushi', 'assets/tako-perfect-sauce-katsuobushi.png');
    this.load.image('tako-perfect-sauce-nori', 'assets/tako-perfect-sauce-nori.png');
  }

  create() {
    this.add.image(400, 100, 'tent').setScale(0.3).setDepth(1);
    this.add.image(250, 405, 'table').setScale(0.25);

    this.createIronPanGrid();
    this.createPlatesArea();
    this.createCustomerArea();
    this.createUI();

    new ButtonPanel(this, 80, 540, () => this.handleServing());

    startGame();
    this.startRealtimeCookingUpdates();
    this.startCustomerSystem();
    this.startGameTimer();
  }

  // =====================================
  // 텍스처 관리 (재사용 가능한 공통 함수들)
  // =====================================

  /**
   * 셀 상태에 따른 텍스처를 결정합니다.
   */
  private getCellTexture(cellState: IronPanCellState, cookingLevel: CookingLevel): string {
    // 반죽이 없으면 빈 셀
    if (!cellState.hasBatter) {
      return 'plate-cell';
    }

    // 반죽만 있는 경우
    if (!cellState.hasOctopus) {
      return `plate-cell-batter-${cookingLevel}`;
    }

    // 문어가 있고 뒤집힌 경우
    if (cellState.isFlipped) {
      return `plate-cell-batter-${cookingLevel}-flipped`;
    }

    // 문어가 있지만 뒤집지 않은 경우
    return `plate-cell-batter-${cookingLevel}-octopus`;
  }

  /**
   * 셀의 시각적 표시를 업데이트합니다.
   */
  private updateCellVisual(row: number, col: number) {
    const cellState = ironPanCells[row][col];
    const cellVisualIndex = row * 3 + col;
    const cellVisualElement = this.ironPanVisualCells[cellVisualIndex];

    const texture = this.getCellTexture(cellState, cellState.cookingLevel);
    cellVisualElement.setTexture(texture);
  }

  /**
   * 접시 타코야끼 텍스처를 결정합니다.
   */
  private getPlateTexture(takoyaki: any): string {
    let plateImage = 'tako-position';

    if (takoyaki.sauce && takoyaki.topping) {
      // 소스 + 토핑 완성품
      plateImage = `tako-${takoyaki.cookingLevel}-sauce-${takoyaki.topping}`;
    } else if (takoyaki.sauce) {
      // 소스만 있음
      plateImage = `tako-${takoyaki.cookingLevel}-sauce`;
    } else {
      // 기본 상태
      plateImage = `tako-${takoyaki.cookingLevel}`;
    }

    return plateImage;
  }

  // =====================================
  // 철판 관련
  // =====================================

  private createIronPanGrid() {
    const ironPanStartX = 90;
    const ironPanStartY = 240;
    const cellSize = 80;

    this.add.image(ironPanStartX + 90, ironPanStartY + 90, 'plate').setScale(0.3);

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const cellX = ironPanStartX + 10 + col * cellSize;
        const cellY = ironPanStartY + 10 + row * cellSize;

        const cellVisualElement = this.add
          .image(cellX, cellY, 'plate-cell')
          .setScale(0.07)
          .setInteractive();

        cellVisualElement.on('pointerdown', () => this.handleIronPanCellClick(row, col));

        this.ironPanVisualCells[row * 3 + col] = cellVisualElement;
      }
    }
  }

  private handleIronPanCellClick(row: number, col: number) {
    if (!gameFlow.isGameActive) return;

    const cellState = ironPanCells[row][col];
    const currentTime = Date.now();

    switch (currentSelectedTool.current) {
      case 'batter':
        if (!cellState.hasBatter) {
          cellState.hasBatter = true;
          cellState.cookingStartTime = currentTime;
          cellState.cookingLevel = 'raw';
          this.updateCellVisual(row, col);
          console.log(`[${row},${col}] 반죽 추가`);
        }
        break;

      case 'octopus':
        if (cellState.hasBatter && !cellState.hasOctopus) {
          cellState.hasOctopus = true;
          this.updateCellVisual(row, col);
          console.log(`[${row},${col}] 문어 추가`);
        }
        break;

      case 'stick':
        if (cellState.hasBatter) {
          const currentCookingLevel = calculateCurrentCookingLevel(cellState, currentTime);

          if (cellState.hasOctopus && currentCookingLevel === 'raw') {
            // 뒤집기 (한 번만)
            if (!cellState.isFlipped) {
              cellState.isFlipped = true;
              this.updateCellVisual(row, col);
              console.log(`[${row},${col}] 뒤집기 완료`);
            }
          } else if (cellState.hasOctopus && currentCookingLevel === 'perfect') {
            // 접시로 이동
            if (platesWithTakoyaki.length < 9) {
              platesWithTakoyaki.push({
                sauce: null,
                topping: null,
                cookingLevel: 'perfect',
              });

              // 셀 초기화
              Object.assign(cellState, {
                hasBatter: false,
                hasOctopus: false,
                isFlipped: false,
                cookingStartTime: null,
                cookingLevel: 'raw',
                isMovedToPlate: false,
              });

              this.updateCellVisual(row, col);
              this.updatePlatesDisplay();
              console.log(`[${row},${col}] 접시로 이동! 총 ${platesWithTakoyaki.length}개`);
            }
          } else if (currentCookingLevel === 'burnt') {
            // 버리기 (반죽만 있어도 탔으면 버림)
            Object.assign(cellState, {
              hasBatter: false,
              hasOctopus: false,
              isFlipped: false,
              cookingStartTime: null,
              cookingLevel: 'raw',
              isMovedToPlate: false,
            });

            this.updateCellVisual(row, col);
            console.log(`[${row},${col}] 타서 버림`);
          }
        }
        break;
    }
  }

  private updateAllCellsCookingStates() {
    if (!gameFlow.isGameActive) return;

    const currentTime = Date.now();

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const cellState = ironPanCells[row][col];

        if (cellState.hasBatter && !cellState.isMovedToPlate) {
          const newCookingLevel = calculateCurrentCookingLevel(cellState, currentTime);

          if (cellState.cookingLevel !== newCookingLevel) {
            cellState.cookingLevel = newCookingLevel;
            this.updateCellVisual(row, col);
            console.log(`[${row},${col}] ${newCookingLevel}로 변경`);
          }
        }
      }
    }
  }

  // =====================================
  // 접시 관련
  // =====================================

  private createPlatesArea() {
    const platesStartX = 340;
    const platesStartY = 260;
    const plateSize = 50;

    this.add.image(platesStartX + 75, platesStartY + 75, 'dish').setScale(0.25);

    for (let plateIndex = 0; plateIndex < 9; plateIndex++) {
      const plateX = platesStartX + 50 + (plateIndex % 2) * plateSize;
      const plateY = platesStartY - 25 + Math.floor(plateIndex / 2) * plateSize;

      const plateVisualElement = this.add
        .image(plateX, plateY, 'tako-position')
        .setScale(0.07)
        .setInteractive();

      const plateTextElement = this.add
        .text(plateX, plateY, '', {
          fontSize: '20px',
          color: '#000',
        })
        .setOrigin(0.5);

      this.plateVisualElements.push(plateVisualElement);
      this.plateTextElements.push(plateTextElement);

      plateVisualElement.on('pointerdown', () => this.handlePlateClick(plateIndex));
    }

    this.updatePlatesDisplay();
  }

  private handlePlateClick(plateIndex: number) {
    if (!gameFlow.isGameActive) return;
    if (plateIndex >= platesWithTakoyaki.length) return;

    const clickedTakoyaki = platesWithTakoyaki[plateIndex];
    const currentTool = currentSelectedTool.current;

    switch (currentTool) {
      case 'sauce':
        if (!clickedTakoyaki.sauce) {
          clickedTakoyaki.sauce = 'okonomiyaki';
          this.updatePlatesDisplay();
          console.log(`접시[${plateIndex}] 소스 추가`);
        }
        break;

      case 'negi':
      case 'katsuobushi':
      case 'nori':
        if (!clickedTakoyaki.topping) {
          clickedTakoyaki.topping = currentTool;
          this.updatePlatesDisplay();
          console.log(`접시[${plateIndex}] 토핑 추가: ${currentTool}`);
        }
        break;
    }
  }

  private updatePlatesDisplay() {
    for (let plateIndex = 0; plateIndex < this.plateVisualElements.length; plateIndex++) {
      if (plateIndex < platesWithTakoyaki.length) {
        const takoyaki = platesWithTakoyaki[plateIndex];
        const plateImage = this.getPlateTexture(takoyaki);
        this.plateVisualElements[plateIndex].setTexture(plateImage);
      } else {
        // 빈 접시
        this.plateVisualElements[plateIndex].setTexture('tako-position');
      }
    }
  }

  // =====================================
  // 손님 관련
  // =====================================

  private createCustomerArea() {
    this.add.rectangle(600, 150, 180, 120, 0x333333, 0.8);
    this.add.text(600, 80, '손님', { fontSize: '16px', color: '#fff' }).setOrigin(0.5);
    this.customerContainer = this.add.container(600, 150);
  }

  private updateCustomerDisplay() {
    if (!this.customerContainer) return;

    this.customerContainer.removeAll(true);

    if (!currentCustomer.customer) {
      const waitingText = this.add
        .text(0, 0, '대기 중...', { fontSize: '14px', color: '#888' })
        .setOrigin(0.5);
      this.customerContainer.add(waitingText);
      return;
    }

    const customer = currentCustomer.customer;
    const order = customer.order;

    // 손님 아바타
    const customerAvatar = this.add.text(0, -30, '🧑‍🍳', { fontSize: '24px' }).setOrigin(0.5);

    // 말풍선
    const bubbleWidth = 200;
    const bubbleHeight = 100;
    const speechBubble = this.add.graphics();
    speechBubble.fillStyle(0xffffff, 0.9);
    speechBubble.fillRoundedRect(-bubbleWidth / 2, 0, bubbleWidth, bubbleHeight, 10);
    speechBubble.strokeRoundedRect(-bubbleWidth / 2, 0, bubbleWidth, bubbleHeight, 10);
    speechBubble.fillTriangle(-10, bubbleHeight, 0, bubbleHeight + 10, 10, bubbleHeight);
    speechBubble.strokeTriangle(-10, bubbleHeight, 0, bubbleHeight + 10, 10, bubbleHeight);

    // 주문 내용
    let orderLines: string[] = [`총 ${order.totalQuantity}개 (소스 필수)`];
    if (order.toppingBreakdown.negi > 0) orderLines.push(`마요 ${order.toppingBreakdown.negi}개`);
    if (order.toppingBreakdown.katsuobushi > 0)
      orderLines.push(`가츠오 ${order.toppingBreakdown.katsuobushi}개`);
    if (order.toppingBreakdown.nori > 0) orderLines.push(`김 ${order.toppingBreakdown.nori}개`);
    if (order.toppingBreakdown.none > 0)
      orderLines.push(`토핑없이 ${order.toppingBreakdown.none}개`);

    const orderText = this.add
      .text(0, 15, orderLines.join('\n'), {
        fontSize: '12px',
        color: '#000',
        align: 'center',
        lineSpacing: 1,
      })
      .setOrigin(0.5, 0);

    this.customerContainer.add([customerAvatar, speechBubble, orderText]);
  }

  // =====================================
  // UI 관련
  // =====================================

  private createUI() {
    this.timerText = this.add
      .text(400, 60, '03:00', {
        fontSize: '28px',
        color: '#fff',
        fontFamily: 'Arial Bold',
        backgroundColor: '#333333',
        padding: { x: 15, y: 8 },
      })
      .setOrigin(0.5);

    this.scoreText = this.add.text(50, 50, 'Score: 0', {
      fontSize: '18px',
      color: '#fff',
    });

    this.statsText = this.add.text(50, 80, 'Served: 0 | Happy: 0 | Angry: 0', {
      fontSize: '14px',
      color: '#fff',
    });

    this.updateCustomerDisplay();
    this.updateScoreDisplay();
    this.updateTimerDisplay();
  }

  private updateScoreDisplay() {
    if (this.scoreText) {
      this.scoreText.setText(`Score: ${gameScore.value}`);
    }

    if (this.statsText) {
      this.statsText.setText(
        `Served: ${gameStats.servedCustomers} | Happy: ${gameStats.happyCustomers} | Angry: ${gameStats.angryCustomers}`
      );
    }
  }

  private updateTimerDisplay() {
    if (!this.timerText) return;

    const timeString = getFormattedTime();
    this.timerText.setText(timeString);

    const [minutes, seconds] = timeString.split(':').map(Number);
    const totalSeconds = minutes * 60 + seconds;

    if (totalSeconds <= 30) {
      this.timerText.setColor('#ff4444');
      if (!this.timerText.getData('blinking')) {
        this.timerText.setData('blinking', true);
        this.tweens.add({
          targets: this.timerText,
          alpha: 0.3,
          duration: 500,
          yoyo: true,
          repeat: -1,
        });
      }
    } else if (totalSeconds <= 60) {
      this.timerText.setColor('#ff8800');
    } else {
      this.timerText.setColor('#ffffff');
    }
  }

  // =====================================
  // 서빙 관련
  // =====================================

  private handleServing() {
    if (!gameFlow.isGameActive) {
      console.log('게임이 종료되어 서빙할 수 없습니다.');
      return;
    }

    const result = serveToCustomer();

    if (result.success && result.result) {
      console.log(result.message);
      this.showCustomerFeedback(result.result.mood, result.result.score);
      this.updatePlatesDisplay();
      this.updateScoreDisplay();

      // 새 손님 등장
      this.time.delayedCall(2000, () => {
        if (gameFlow.isGameActive) {
          spawnNewCustomer();
          this.updateCustomerDisplay();
        }
      });
    } else {
      console.log(result.message);
    }
  }

  private showCustomerFeedback(mood: 'happy' | 'neutral' | 'angry', score: number) {
    if (!this.customerContainer) return;

    this.customerContainer.removeAll(true);

    const moodData = {
      happy: { emoji: '😊', text: `+${score}점!` },
      neutral: { emoji: '😐', text: `+${score}점` },
      angry: { emoji: '😠', text: `+${score}점...` },
    };

    const data = moodData[mood];

    const moodSprite = this.add.text(0, -20, data.emoji, { fontSize: '32px' }).setOrigin(0.5);

    const scoreDisplay = this.add.text(0, 20, data.text, { fontSize: '14px' }).setOrigin(0.5);

    this.customerContainer.add([moodSprite, scoreDisplay]);

    this.tweens.add({
      targets: this.customerContainer,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 300,
      yoyo: true,
      ease: 'Back.easeInOut',
    });
  }

  // =====================================
  // 시스템 시작
  // =====================================

  private startRealtimeCookingUpdates() {
    this.time.addEvent({
      delay: 100,
      callback: this.updateAllCellsCookingStates,
      callbackScope: this,
      loop: true,
    });
  }

  private startCustomerSystem() {
    spawnNewCustomer();
    this.updateCustomerDisplay();

    this.time.addEvent({
      delay: 1000,
      callback: this.updateCustomerPatience,
      callbackScope: this,
      loop: true,
    });
  }

  private startGameTimer() {
    this.time.addEvent({
      delay: 100,
      callback: () => {
        const gameEnded = updateGameTimer(Date.now());
        this.updateTimerDisplay();

        if (gameEnded) {
          this.scene.start('EndScene');
        }
      },
      callbackScope: this,
      loop: true,
    });
  }

  private updateCustomerPatience() {
    if (!gameFlow.isGameActive) return;

    if (currentCustomer.customer) {
      currentCustomer.customer.patience -= 1;

      if (currentCustomer.customer.patience <= 0) {
        console.log('손님이 화나서 떠났습니다!');
        gameStats.angryCustomers++;
        currentCustomer.customer = null;

        if (gameFlow.isGameActive) {
          this.time.delayedCall(1000, () => {
            spawnNewCustomer();
            this.updateCustomerDisplay();
          });
        }

        this.updateCustomerDisplay();
        this.updateScoreDisplay();
      }
    }
  }
}
