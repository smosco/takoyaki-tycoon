import Phaser from 'phaser';
import {
  ironPanCells,
  currentSelectedTool,
  platesWithTakoyaki,
  calculateCurrentCookingLevel,
  gameFlow,
  type IronPanCellState,
} from '../state/gameState';
import { TextureHelper } from '../utiils/TextureHelper';

export class IronPanManager {
  private scene: Phaser.Scene;
  private ironPanVisualCells: Phaser.GameObjects.Image[] = [];

  // PlatesManager 참조 추가
  private platesManager: any; // TODO: PlatesManager 타입 추가

  private readonly ironPanStartX = 70;
  private readonly ironPanStartY = 270;
  private readonly cellSize = 80;

  constructor(scene: Phaser.Scene, platesManager?: any) {
    this.scene = scene;
    this.platesManager = platesManager;
    this.create();
  }

  private create() {
    this.createBackground();
    this.createCells();
  }

  private createBackground() {
    this.scene.add
      .image(this.ironPanStartX + 90, this.ironPanStartY + 90, 'plate')
      .setScale(0.3)
      .setDepth(4);
  }

  private createCells() {
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const cellX = this.ironPanStartX + 10 + col * this.cellSize;
        const cellY = this.ironPanStartY + 10 + row * this.cellSize;

        const cellVisualElement = this.scene.add
          .image(cellX, cellY, 'plate-cell')
          .setScale(0.08)
          .setDepth(5)
          .setInteractive();

        cellVisualElement.on('pointerdown', () => this.handleCellClick(row, col));
        this.ironPanVisualCells[row * 3 + col] = cellVisualElement;
      }
    }
  }

  private handleCellClick(row: number, col: number) {
    if (!gameFlow.isGameActive) return;

    const cellState = ironPanCells[row][col];
    const currentTime = Date.now();

    switch (currentSelectedTool.current) {
      case 'batter':
        this.addBatter(cellState, currentTime, row, col);
        break;
      case 'octopus':
        this.addOctopus(cellState, row, col);
        break;
      case 'stick':
        this.handleStick(cellState, currentTime, row, col);
        break;
    }
  }

  private addBatter(cellState: IronPanCellState, currentTime: number, row: number, col: number) {
    if (!cellState.hasBatter) {
      cellState.hasBatter = true;
      cellState.cookingStartTime = currentTime;
      cellState.cookingLevel = 'raw';
      this.updateCellVisual(row, col);
      console.log(`[${row},${col}] 반죽 추가`);
    }
  }

  private addOctopus(cellState: IronPanCellState, row: number, col: number) {
    if (cellState.hasBatter && !cellState.hasOctopus) {
      cellState.hasOctopus = true;
      this.updateCellVisual(row, col);
      console.log(`[${row},${col}] 문어 추가`);
    }
  }

  private handleStick(cellState: IronPanCellState, currentTime: number, row: number, col: number) {
    if (!cellState.hasBatter) return;

    const currentCookingLevel = calculateCurrentCookingLevel(cellState, currentTime);

    if (cellState.hasOctopus && currentCookingLevel === 'raw') {
      this.flipTakoyaki(cellState, row, col);
    } else if (cellState.hasOctopus && currentCookingLevel === 'perfect') {
      this.moveToPlate(cellState, row, col);
    } else if (currentCookingLevel === 'burnt') {
      this.discardTakoyaki(cellState, row, col);
    }
  }

  private flipTakoyaki(cellState: IronPanCellState, row: number, col: number) {
    if (!cellState.isFlipped) {
      cellState.isFlipped = true;
      this.updateCellVisual(row, col);
      console.log(`[${row},${col}] 뒤집기 완료`);
    }
  }

  private moveToPlate(cellState: IronPanCellState, row: number, col: number) {
    if (platesWithTakoyaki.length < 10) {
      platesWithTakoyaki.push({
        sauce: null,
        topping: null,
        cookingLevel: 'perfect',
      });

      this.resetCell(cellState);
      this.updateCellVisual(row, col);

      // 중요: PlatesManager의 updateDisplay() 호출
      if (this.platesManager) {
        this.platesManager.updateDisplay();
      }

      console.log(`[${row},${col}] 접시로 이동! 총 ${platesWithTakoyaki.length}개`);
      console.log('현재 접시 상태:', platesWithTakoyaki); // 디버깅용
    } else {
      console.log('접시가 가득 찼습니다! (최대 10개)');
    }
  }

  private discardTakoyaki(cellState: IronPanCellState, row: number, col: number) {
    this.resetCell(cellState);
    this.updateCellVisual(row, col);
    console.log(`[${row},${col}] 타서 버림`);
  }

  private resetCell(cellState: IronPanCellState) {
    Object.assign(cellState, {
      hasBatter: false,
      hasOctopus: false,
      isFlipped: false,
      cookingStartTime: null,
      cookingLevel: 'raw',
      isMovedToPlate: false,
    });
  }

  private updateCellVisual(row: number, col: number) {
    const cellState = ironPanCells[row][col];
    const cellVisualIndex = row * 3 + col;
    const cellVisualElement = this.ironPanVisualCells[cellVisualIndex];

    const texture = TextureHelper.getCellTexture(cellState, cellState.cookingLevel);
    cellVisualElement.setTexture(texture);
  }

  updateAllCells() {
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

  startRealtimeUpdates() {
    this.scene.time.addEvent({
      delay: 100,
      callback: this.updateAllCells,
      callbackScope: this,
      loop: true,
    });
  }
}
