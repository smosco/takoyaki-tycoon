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
  type CustomerOrder,
} from '../state/gameState';
import { ButtonPanel } from '../ui/ButtonPanel';

export class GameScene extends Phaser.Scene {
  private plateVisualElements: Phaser.GameObjects.Image[] = [];
  private plateTextElements: Phaser.GameObjects.Text[] = [];
  private ironPanVisualCells: Phaser.GameObjects.Image[] = [];

  // UI 요소들
  private customerContainer: Phaser.GameObjects.Container | null = null;
  private scoreText: Phaser.GameObjects.Text | null = null;
  private timerText: Phaser.GameObjects.Text | null = null;
  private progressBarWidth = 250;
  private progressBarHeight = 20;
  private progressBarX = 300;
  private progressBarY = 25;
  private progressBarFill: Phaser.GameObjects.Graphics | null = null;
  private progressBg: Phaser.GameObjects.Graphics | null = null;

  // 손님 애니메이션 관련
  private customerSprite: Phaser.GameObjects.Sprite | null = null;

  // 패널 관리 (메모리 누수 방지)
  private currentOrderBubble: {
    graphics: Phaser.GameObjects.Graphics;
    text: Phaser.GameObjects.Text;
  } | null = null;
  private currentProductionPanel: {
    panel: Phaser.GameObjects.Graphics;
    text: Phaser.GameObjects.Text;
  } | null = null;

  constructor() {
    super('GameScene');
  }

  preload() {
    // 기존 에셋들
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

    // ========================================
    // 손님 에셋
    // ========================================

    // 임시 이미지 (에셋 준비 전까지)
    this.load.image('customer_temp', 'assets/cat.png'); // 임시 손님 이미지

    // 실제 에셋 로딩 (준비되면 주석 해제)
    /*
    this.load.spritesheet('customer_idle', 'assets/customer_idle.png', {
      frameWidth: 64,   // 실제 프레임 크기에 맞게 조정
      frameHeight: 96
    });

    this.load.spritesheet('customer_walk', 'assets/customer_walk.png', {
      frameWidth: 64,
      frameHeight: 96
    });

    this.load.spritesheet('customer_talk', 'assets/customer_talk.png', {
      frameWidth: 64,
      frameHeight: 96
    });

    this.load.spritesheet('customer_happy', 'assets/customer_happy.png', {
      frameWidth: 64,
      frameHeight: 96
    });

    this.load.spritesheet('customer_angry', 'assets/customer_angry.png', {
      frameWidth: 64,
      frameHeight: 96
    });
    */
  }

  create() {
    this.add.image(400, 130, 'tent').setScale(0.3);
    this.add.image(240, 435, 'table').setScale(0.25);

    this.createTopUI();

    this.createIronPanGrid();
    this.createPlatesArea();
    this.createCustomerArea();

    new ButtonPanel(this, 70, 560, () => this.handleServing());

    // 손님 애니메이션 설정 (에셋 준비되면 주석 해제)
    // this.createCustomerAnimations();

    startGame();
    this.startRealtimeCookingUpdates();
    this.startCustomerSystem();
    this.startGameTimer();
  }

  // ========================================
  // 상단 레벨, 타이머, 점수 UI
  // ========================================

  private createTopUI() {
    const bg = this.add.graphics();
    bg.fillStyle(0x1e1b18, 0.5);
    bg.fillRoundedRect(10, 10, 780, 50, 48);
    bg.setDepth(10);

    const border = this.add.graphics();
    border.lineStyle(3, 0xfac36e);
    border.strokeRoundedRect(10, 10, 780, 50, 48);
    border.setDepth(11);

    // 레벨
    this.add
      .text(40, 27, '레벨', {
        fontSize: '18px',
        color: '#FFD700',
      })
      .setDepth(12);

    this.add
      .text(90, 23, '1', {
        fontSize: '24px',
        color: '#fff',
      })
      .setDepth(12);

    // 타이머
    this.timerText = this.add
      .text(200, 23, '03:00', {
        fontSize: '24px',
        color: '#fff',
      })
      .setDepth(12);

    // 점수
    this.add
      .text(620, 27, '점수', {
        fontSize: '18px',
        color: '#FFD700',
      })
      .setDepth(12);

    this.scoreText = this.add
      .text(670, 23, '0', {
        fontSize: '24px',
        color: '#fff',
      })
      .setDepth(12);

    // 진행 바 배경
    this.progressBg = this.add.graphics();
    this.progressBg.fillStyle(0x333333, 1);
    this.progressBg.fillRoundedRect(
      this.progressBarX,
      this.progressBarY,
      this.progressBarWidth,
      this.progressBarHeight,
      10
    );
    this.progressBg.setDepth(11);

    // fill용 Graphics
    this.progressBarFill = this.add.graphics();
    this.progressBarFill.setDepth(12);
  }

  // ========================================
  // 손님 에셋 애니메이션 구조
  // ========================================

  private createCustomerAnimations() {
    // 실제 에셋이 준비되면 이 부분 활성화
    /*
    // 대기 애니메이션
    this.anims.create({
      key: 'customer_idle',
      frames: this.anims.generateFrameNumbers('customer_idle', { start: 0, end: 3 }),
      frameRate: 2,
      repeat: -1
    });

    // 걷기 애니메이션
    this.anims.create({
      key: 'customer_walk',
      frames: this.anims.generateFrameNumbers('customer_walk', { start: 0, end: 5 }),
      frameRate: 8,
      repeat: -1
    });

    // 말하기 애니메이션
    this.anims.create({
      key: 'customer_talk',
      frames: this.anims.generateFrameNumbers('customer_talk', { start: 0, end: 7 }),
      frameRate: 6,
      repeat: 3 // 3번 반복 후 idle로 복귀
    });

    // 기쁜 애니메이션
    this.anims.create({
      key: 'customer_happy',
      frames: this.anims.generateFrameNumbers('customer_happy', { start: 0, end: 4 }),
      frameRate: 8,
      repeat: 2
    });

    // 화난 애니메이션
    this.anims.create({
      key: 'customer_angry',
      frames: this.anims.generateFrameNumbers('customer_angry', { start: 0, end: 4 }),
      frameRate: 6,
      repeat: 2
    });
    */
  }

  private createCustomerArea() {
    // 손님 영역 배경
    this.add.rectangle(600, 200, 180, 200, 0x333333, 0.3);
    this.add.text(600, 120, '손님', { fontSize: '16px', color: '#fff' }).setOrigin(0.5).setDepth(3);

    // 손님 컨테이너
    this.customerContainer = this.add.container(600, 200).setDepth(5);

    // 임시 손님 생성 (에셋 준비 전까지)
    this.createTemporaryCustomer();
  }

  private createTemporaryCustomer() {
    // 임시 손님 이미지 (에셋 준비 전까지)
    this.customerSprite = this.add.sprite(600, 300, 'customer_temp').setScale(0.6).setDepth(5);

    // 에셋 준비되면 이 부분으로 교체
    /*
    this.customerSprite = this.add.sprite(600, 300, 'customer_idle')
      .setScale(1.5)
      .setDepth(5);

    this.customerSprite.play('customer_idle');
    */
  }

  // ========================================
  // 패널 관리 함수들 (메모리 누수 방지)
  // ========================================

  /**
   * 기존 주문 말풍선을 제거합니다.
   */
  private clearOrderBubble() {
    if (this.currentOrderBubble) {
      this.currentOrderBubble.graphics.destroy();
      this.currentOrderBubble.text.destroy();
      this.currentOrderBubble = null;
    }
  }

  /**
   * 기존 남은 주문 내역 확인 패널을 제거합니다.
   */
  private clearProductionPanel() {
    if (this.currentProductionPanel) {
      this.currentProductionPanel.panel.destroy();
      this.currentProductionPanel.text.destroy();
      this.currentProductionPanel = null;
    }
  }

  /**
   * 모든 고객 관련 UI를 정리합니다.
   */
  private clearAllCustomerUI() {
    this.clearOrderBubble();
    this.clearProductionPanel();
    if (this.customerContainer) {
      this.customerContainer.removeAll(true);
    }
  }

  // 손님 등장 애니메이션
  private spawnCustomerWithAnimation() {
    // 기존 UI 정리
    this.clearAllCustomerUI();

    if (this.customerSprite) {
      this.customerSprite.destroy();
    }

    // 화면 오른쪽에서 등장
    this.customerSprite = this.add
      .sprite(900, 360, 'customer_temp') // 에셋 준비되면 'customer_walk'로 변경
      .setScale(0.6)
      .setDepth(5);

    // 에셋 준비되면 활성화
    // this.customerSprite.play('customer_walk');

    // 걸어나오는 애니메이션
    this.tweens.add({
      targets: this.customerSprite,
      x: 650,
      duration: 1000,
      ease: 'Power2.easeOut',
      onComplete: () => {
        this.startCustomerIdleAnimation();
        this.showCustomerOrder();
      },
    });

    spawnNewCustomer();
  }

  private startCustomerIdleAnimation() {
    if (!this.customerSprite) return;

    // 에셋 준비되면 활성화
    // this.customerSprite.play('customer_idle');

    // 미세한 흔들림 효과
    this.tweens.add({
      targets: this.customerSprite,
      x: this.customerSprite.x + 5,
      y: this.customerSprite.y + 5,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private showCustomerOrder() {
    if (!this.customerSprite || !currentCustomer.customer) return;

    // 말하기 애니메이션 (에셋 준비되면 활성화)
    // this.customerSprite.play('customer_talk');

    // 2초 후 idle로 복귀 (에셋 준비되면 활성화)
    /*
    this.time.delayedCall(2000, () => {
      if (this.customerSprite) {
        this.customerSprite.play('customer_idle');
      }
    });
    */

    // 주문 말풍선 표시 (2초간만)
    this.showOrderBubble(
      this.customerSprite.x - 200,
      this.customerSprite.y - 200,
      currentCustomer.customer.order
    );

    // 생산 패널 표시 (계속 유지)
    this.showProductionPanel(570, 390, currentCustomer.customer.order);
  }

  /**
   * 주문 말풍선을 표시합니다. (2초간만 표시)
   */
  private showOrderBubble(x: number, y: number, order: CustomerOrder) {
    // 기존 말풍선 제거
    this.clearOrderBubble();

    const width = 180;
    const height = 80;

    const bubble = this.add.graphics();
    bubble.setDepth(20);

    // 본체 + 꼬리
    bubble.fillStyle(0xfff3d1, 0.95);
    bubble.lineStyle(3, 0x996633);
    bubble.fillRoundedRect(x, y, width, height, 16);
    bubble.strokeRoundedRect(x, y, width, height, 16);
    bubble.beginPath();
    bubble.moveTo(x + 80, y + height);
    bubble.lineTo(x + 95, y + height + 15);
    bubble.lineTo(x + 90, y + height);
    bubble.closePath();
    bubble.fillPath();
    bubble.strokePath();

    // 주문 내용
    let orderLines: string[] = [];
    const totalOrdered = order.totalQuantity;

    orderLines.push(`타코야끼 ${totalOrdered}개 주세요`);

    const orderText = this.add
      .text(x + width / 2, y + 40, orderLines.join('\n'), {
        fontSize: '16px',
        color: '#cc2200',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(21);

    // 현재 말풍선 저장
    this.currentOrderBubble = { graphics: bubble, text: orderText };

    // 2초 후 제거
    this.time.delayedCall(2000, () => {
      this.clearOrderBubble();
    });
  }

  /**
   * 생산 패널을 표시합니다. (계속 유지, 업데이트 가능)
   */
  private showProductionPanel(x: number, y: number, order: CustomerOrder) {
    // 기존 패널 제거
    this.clearProductionPanel();

    const width = 140;
    const height = 120;

    const panel = this.add.graphics();
    panel.fillStyle(0x2b2b2b, 0.8);
    panel.fillRoundedRect(x, y, width, height, 10);
    panel.lineStyle(2, 0xf5deb3);
    panel.strokeRoundedRect(x, y, width, height, 10);
    panel.setDepth(10);

    // 주문 내용 (남은 수량 표시)
    let orderLines: string[] = [];

    orderLines.push('남은 주문');
    if (order.remainingToppingBreakdown.negi > 0)
      orderLines.push(`파 : ${order.remainingToppingBreakdown.negi}개`);
    if (order.remainingToppingBreakdown.katsuobushi > 0)
      orderLines.push(`가츠오 : ${order.remainingToppingBreakdown.katsuobushi}개`);
    if (order.remainingToppingBreakdown.nori > 0)
      orderLines.push(`김 : ${order.remainingToppingBreakdown.nori}개`);
    if (order.remainingToppingBreakdown.none > 0)
      orderLines.push(`토핑없이 : ${order.remainingToppingBreakdown.none}개`);

    const orderText = this.add
      .text(x + 15, y + 15, orderLines.join('\n'), {
        fontSize: '14px',
        color: '#fff8e1',
        lineSpacing: 4,
      })
      .setDepth(11);

    // 현재 패널 저장
    this.currentProductionPanel = { panel, text: orderText };
  }

  /**
   * 생산 패널의 내용만 업데이트합니다.
   */
  private updateProductionPanel(order: CustomerOrder) {
    if (!this.currentProductionPanel) {
      // 패널이 없으면 새로 생성
      this.showProductionPanel(570, 390, order);
      return;
    }

    // 기존 텍스트만 업데이트
    let orderLines: string[] = [];

    orderLines.push('남은 주문:');
    if (order.remainingToppingBreakdown.negi > 0)
      orderLines.push(`파 : ${order.remainingToppingBreakdown.negi}개`);
    if (order.remainingToppingBreakdown.katsuobushi > 0)
      orderLines.push(`가츠오 : ${order.remainingToppingBreakdown.katsuobushi}개`);
    if (order.remainingToppingBreakdown.nori > 0)
      orderLines.push(`김 : ${order.remainingToppingBreakdown.nori}개`);
    if (order.remainingToppingBreakdown.none > 0)
      orderLines.push(`토핑없이 : ${order.remainingToppingBreakdown.none}개`);

    this.currentProductionPanel.text.setText(orderLines.join('\n'));
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
    const ironPanStartX = 70;
    const ironPanStartY = 270;
    const cellSize = 80;

    this.add.image(ironPanStartX + 90, ironPanStartY + 90, 'plate').setScale(0.3);

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const cellX = ironPanStartX + 10 + col * cellSize;
        const cellY = ironPanStartY + 10 + row * cellSize;

        const cellVisualElement = this.add
          .image(cellX, cellY, 'plate-cell')
          .setScale(0.08)
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
            // 접시로 이동 (2x5 = 10개까지만 보관 가능)
            if (platesWithTakoyaki.length < 10) {
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
            } else {
              console.log('접시가 가득 찼습니다! (최대 10개)');
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
  // 접시 관련 (2x5 배치, 최대 10개 보관)
  // =====================================

  private createPlatesArea() {
    const platesStartX = 320;
    const platesStartY = 290;
    const plateSize = 50;

    this.add.image(platesStartX + 75, platesStartY + 75, 'dish').setScale(0.25);

    // 2x5 배치로 총 10개 접시
    for (let plateIndex = 0; plateIndex < 10; plateIndex++) {
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

  // ========================================
  // UI 업데이트 함수들
  // ========================================

  private updateTimerDisplay() {
    if (!this.timerText || !this.progressBarFill) return;

    const timeString = getFormattedTime();
    this.timerText.setText(timeString);

    const [minutes, seconds] = timeString.split(':').map(Number);
    const totalSeconds = minutes * 60 + seconds;
    const maxTime = 180;
    const ratio = Phaser.Math.Clamp(totalSeconds / maxTime, 0, 1);

    // 진행바 그리기 (오른쪽 노랑 → 왼쪽 빨강 그라데이션)
    this.progressBarFill.clear();
    this.progressBarFill.fillGradientStyle(
      0xffd700, // gold (right)
      0xff4444, // red (left)
      0xffd700,
      0xff4444,
      1
    );
    this.progressBarFill.fillRoundedRect(
      this.progressBarX,
      this.progressBarY,
      this.progressBarWidth * ratio,
      this.progressBarHeight,
      10
    );

    // 텍스트 색상/애니메이션
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
    } else {
      this.timerText.setColor('#ffffff');
    }

    // 펌핑 효과
    if (totalSeconds <= 15 && !this.timerText.getData('pumping')) {
      this.timerText.setData('pumping', true);
      this.tweens.add({
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

  private updateScoreDisplay() {
    if (this.scoreText) {
      const formatted = gameScore.value.toString();
      this.scoreText.setText(formatted);
    }
  }

  // =====================================
  // 서빙 관련 (부분 서빙 지원)
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

      if (result.orderCompleted) {
        // 주문 완료 시 모든 UI 정리 후 새 손님 등장
        this.clearAllCustomerUI();
        this.time.delayedCall(2000, () => {
          if (gameFlow.isGameActive) {
            this.spawnCustomerWithAnimation();
          }
        });
      } else {
        // 부분 서빙 시 생산 패널만 업데이트
        if (currentCustomer.customer) {
          this.updateProductionPanel(currentCustomer.customer.order);
        }
      }
    } else {
      console.log(result.message);
    }
  }

  private showCustomerFeedback(mood: 'happy' | 'neutral' | 'angry', score: number) {
    if (!this.customerSprite) return;

    // 에셋 준비되면 해당 애니메이션 재생
    /*
    if (mood === 'happy') {
      this.customerSprite.play('customer_happy');
    } else if (mood === 'angry') {
      this.customerSprite.play('customer_angry');
    }
    */

    // 임시 효과 (에셋 준비 전까지)
    if (mood === 'happy') {
      this.tweens.add({
        targets: this.customerSprite,
        y: this.customerSprite.y - 20,
        duration: 200,
        yoyo: true,
        ease: 'Quad.easeOut',
      });
      this.customerSprite.setTint(0xffff99);
    } else if (mood === 'angry') {
      this.tweens.add({
        targets: this.customerSprite,
        x: this.customerSprite.x + 10,
        duration: 100,
        yoyo: true,
        repeat: 5,
        ease: 'Power2.easeInOut',
      });
      this.customerSprite.setTint(0xff6666);
    }

    // 1초 후 원상복귀
    this.time.delayedCall(1000, () => {
      if (this.customerSprite) {
        this.customerSprite.clearTint();
        // this.customerSprite.play('customer_idle'); // 에셋 준비되면 활성화
      }
    });

    // 기존 피드백 표시 로직...
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
    this.spawnCustomerWithAnimation();

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

        // 모든 UI 정리
        this.clearAllCustomerUI();

        if (gameFlow.isGameActive) {
          this.time.delayedCall(1000, () => {
            this.spawnCustomerWithAnimation();
          });
        }

        this.updateScoreDisplay();
      }
    }
  }
}
