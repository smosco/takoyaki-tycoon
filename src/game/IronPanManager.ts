import Phaser from 'phaser';
import {
  ironPanCells,
  currentSelectedTool,
  platesWithTakoyaki,
  gameFlow,
} from '../state/gameState';
import type { IronPanCellState } from '../domain/types';
import { TextureHelper } from '../utils/TextureHelper';
import { calculateCurrentCookingLevel } from '../domain/cooking';

// 각 셀의 레이어들을 관리하는 인터페이스
interface CellLayers {
  background: Phaser.GameObjects.Image; // 접시 (고정)
  content: Phaser.GameObjects.Image; // 반죽/타코야키 (변경됨)
  octopus?: Phaser.GameObjects.Image; // 문어 (선택적)
  container: Phaser.GameObjects.Container; // 전체를 담는 컨테이너
}

export class IronPanManager {
  private scene: Phaser.Scene;
  private cellLayers: CellLayers[][] = []; // 3x3 레이어 배열
  private platesManager: any;

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
    // 3x3 레이어 배열 초기화
    for (let row = 0; row < 3; row++) {
      this.cellLayers[row] = [];
      for (let col = 0; col < 3; col++) {
        const cellX = this.ironPanStartX + 10 + col * this.cellSize;
        const cellY = this.ironPanStartY + 10 + row * this.cellSize;

        // 컨테이너 생성 (모든 레이어를 담음)
        const container = this.scene.add.container(cellX, cellY);
        container.setDepth(5);
        container.setInteractive(
          new Phaser.Geom.Rectangle(-40, -40, 80, 80), // 클릭 영역
          Phaser.Geom.Rectangle.Contains
        );

        // 1. 배경 레이어 (접시 - 항상 고정)
        const background = this.scene.add.image(0, 0, 'plate-cell').setScale(0.08);

        // 2. 내용물 레이어 (반죽/타코야키 - 처음엔 투명)
        const content = this.scene.add.image(0, 0, 'plate-cell').setScale(0.08).setAlpha(0); // 처음엔 보이지 않음

        // 컨테이너에 레이어들 추가
        container.add([background, content]);

        container.on('pointerover', () => {
          this.scene.game.canvas.style.cursor = 'pointer';
        });
        container.on('pointerout', () => {
          this.scene.game.canvas.style.cursor = 'default';
        });
        // 클릭 이벤트
        container.on('pointerdown', () => this.handleCellClick(row, col));

        // 레이어 정보 저장
        this.cellLayers[row][col] = {
          background,
          content,
          container,
        };
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
      this.scene.sound.play('batter-sound');

      cellState.hasBatter = true;
      cellState.cookingStartTime = currentTime;
      cellState.cookingLevel = 'raw';

      const layers = this.cellLayers[row][col];
      const contentLayer = layers.content;

      // 반죽 텍스처 설정
      const texture = TextureHelper.getBatterTexture(cellState.cookingLevel);
      contentLayer.setTexture(texture);

      // 애니메이션 시퀀스
      this.animateBatterPour(contentLayer, row, col);
    }
  }

  private animateBatterPour(contentLayer: Phaser.GameObjects.Image, row: number, col: number) {
    // 1. 초기 상태: 투명하고 작게
    contentLayer.setAlpha(0);
    contentLayer.setScale(0);

    // 2. 페이드인과 동시에 크기 증가 (부어지는 효과)
    this.scene.tweens.add({
      targets: contentLayer,
      alpha: 1,
      scaleX: 0.08,
      scaleY: 0.08,
      duration: 600,
      ease: 'Back.easeOut',
      onComplete: () => {
        console.log(`[${row},${col}] 반죽 추가 완료`);
      },
    });

    // 3. 살짝 회전하는 효과 (부어지는 느낌)
    this.scene.tweens.add({
      targets: contentLayer,
      rotation: Phaser.Math.DegToRad(5),
      duration: 300,
      ease: 'Power2.easeOut',
      yoyo: true,
      repeat: 1,
    });

    // 4. 위에서 아래로 떨어지는 효과
    const originalY = contentLayer.y;
    contentLayer.y = originalY - 10;
    this.scene.tweens.add({
      targets: contentLayer,
      y: originalY,
      duration: 400,
      ease: 'Bounce.easeOut',
    });
  }

  private addOctopus(cellState: IronPanCellState, row: number, col: number) {
    if (cellState.hasBatter && !cellState.hasOctopus) {
      this.scene.sound.play('octopus-sound');

      cellState.hasOctopus = true;

      const layers = this.cellLayers[row][col];

      // 문어 추가 애니메이션 (반죽 텍스처 변경과 함께)
      this.animateOctopusAdd(layers.content, row, col);

      console.log(`[${row},${col}] 문어 추가`);
    }
  }

  private animateOctopusAdd(contentLayer: Phaser.GameObjects.Image, row: number, col: number) {
    // 1. 현재 반죽 텍스처를 임시로 어둡게 만들기 (문어가 들어가는 효과)
    contentLayer.setTint(0x888888);

    // 2. 살짝 흔들리는 효과 (문어가 들어가면서 반죽이 흔들림)
    this.scene.tweens.add({
      targets: contentLayer,
      x: 1,
      duration: 30,
      ease: 'Power2.easeInOut',
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        // 3. 문어가 들어간 새로운 텍스처로 변경
        this.updateContentTexture(row, col);
        contentLayer.clearTint();

        // 4. 살짝 크기가 커지는 효과 (문어가 들어가서 부풀어오름)
        this.scene.tweens.add({
          targets: contentLayer,
          scaleX: 0.09,
          scaleY: 0.09,
          duration: 100,
          ease: 'Back.easeOut',
          onComplete: () => {
            // 5. 원래 크기로 돌아감
            this.scene.tweens.add({
              targets: contentLayer,
              scaleX: 0.08,
              scaleY: 0.08,
              duration: 100,
              ease: 'Power2.easeOut',
            });
          },
        });
      },
    });
  }

  private handleStick(cellState: IronPanCellState, currentTime: number, row: number, col: number) {
    if (!cellState.hasBatter) return;
    this.scene.sound.play('stick-sound');

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
    const layers = this.cellLayers[row][col];

    // 뒤집기 애니메이션 (content 레이어만 사용)
    this.animateFlip(layers.content, () => {
      // 처음 뒤집을 때
      if (!cellState.isFlipped) {
        cellState.isFlipped = true;

        // 애니메이션 완료 후 텍스처 업데이트
        this.updateContentTexture(row, col);
      }

      console.log(`[${row},${col}] 뒤집기 완료`);
    });
  }

  private animateFlip(contentLayer: Phaser.GameObjects.Image, onComplete?: () => void) {
    // 문어 레이어는 더 이상 사용하지 않으므로 contentLayer만 뒤집기
    this.scene.tweens.add({
      targets: contentLayer,
      scaleY: 0,
      duration: 150,
      ease: 'Power2.easeIn',
      onComplete: () => {
        // 중간에 텍스처 변경 (뒤집힌 상태)
        if (onComplete) onComplete();

        // 다시 원래 크기로
        this.scene.tweens.add({
          targets: contentLayer,
          scaleY: 0.08,
          duration: 150,
          ease: 'Power2.easeOut',
        });
      },
    });
  }

  private moveToPlate(cellState: IronPanCellState, row: number, col: number) {
    if (platesWithTakoyaki.length < 10) {
      platesWithTakoyaki.push({
        sauce: false,
        topping: null,
        cookingLevel: 'perfect',
      });

      // 접시로 이동 애니메이션
      const layers = this.cellLayers[row][col];
      this.animateMoveToPlate(layers, () => {
        // 애니메이션 완료 후 셀 리셋
        this.resetCell(cellState);
        this.resetCellVisual(row, col);

        if (this.platesManager) {
          this.platesManager.updateDisplay();
        }
      });

      console.log(`[${row},${col}] 접시로 이동! 총 ${platesWithTakoyaki.length}개`);
    } else {
      console.log('접시가 가득 찼습니다! (최대 10개)');
    }
  }

  private animateMoveToPlate(layers: CellLayers, onComplete: () => void) {
    // content 레이어만 이동 (문어가 포함된 반죽)
    this.scene.tweens.add({
      targets: layers.content,
      x: '+=80',
      y: '-=50',
      alpha: 0,
      scaleX: 0.04,
      scaleY: 0.04,
      duration: 500,
      ease: 'Power2.easeIn',
      onComplete: onComplete,
    });
  }

  private discardTakoyaki(cellState: IronPanCellState, row: number, col: number) {
    const layers = this.cellLayers[row][col];

    // 타서 버리는 애니메이션 (빨갛게 깜빡이고 사라짐)
    this.animateDiscard(layers, () => {
      this.resetCell(cellState);
      this.resetCellVisual(row, col);
    });

    console.log(`[${row},${col}] 타서 버림`);
  }

  private animateDiscard(layers: CellLayers, onComplete: () => void) {
    // content 레이어만 처리 (문어가 포함된 반죽)
    const target = layers.content;

    // 빨간색 틴트로 타는 효과
    target.setTint(0xff0000);

    // 깜빡이는 효과
    this.scene.tweens.add({
      targets: target,
      alpha: 0.3,
      duration: 100,
      ease: 'Power2.easeInOut',
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        // 사라지는 애니메이션
        this.scene.tweens.add({
          targets: target,
          alpha: 0,
          scaleX: 0,
          scaleY: 0,
          duration: 100,
          ease: 'Power2.easeIn',
          onComplete: () => {
            // 틴트 제거
            target.clearTint();
            onComplete();
          },
        });
      },
    });
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

  private resetCellVisual(row: number, col: number) {
    const layers = this.cellLayers[row][col];

    // content 레이어만 초기화 (더 이상 별도의 octopus 레이어 없음)
    layers.content.setAlpha(0);
    layers.content.setScale(0.08);
    layers.content.y = 0;
    layers.content.x = 0; // x도 초기화
    layers.content.clearTint();
  }

  private updateContentTexture(row: number, col: number) {
    const cellState = ironPanCells[row][col];
    const layers = this.cellLayers[row][col];

    if (!cellState.hasBatter) {
      layers.content.setAlpha(0);
      return;
    }

    // 현재 상태에 맞는 텍스처 설정
    const texture = TextureHelper.getBatterTexture(
      cellState.cookingLevel,
      cellState.hasOctopus,
      cellState.isFlipped
    );

    layers.content.setTexture(texture);
    layers.content.setAlpha(1);
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

            // 레이어 시스템으로 업데이트
            this.updateContentTexture(row, col);

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
