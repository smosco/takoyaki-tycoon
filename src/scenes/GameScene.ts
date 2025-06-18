// src/scenes/GameScene.ts
import Phaser from 'phaser';
import { gridState, toolState, plateState } from '../state/gameState';
import { ButtonPanel } from '../ui/ButtonPanel';

export class GameScene extends Phaser.Scene {
  private plateRects: Phaser.GameObjects.Rectangle[] = [];
  private plateTexts: Phaser.GameObjects.Text[] = [];

  constructor() {
    super('GameScene');
  }

  create() {
    // 배경
    this.add.rectangle(400, 300, 800, 600, 0x2d2d2d);
    this.add
      .text(400, 30, 'Takoyaki Tycoon', {
        fontSize: '24px',
        color: '#fff',
      })
      .setOrigin(0.5);

    this.createGrid();
    this.createPlates();
    new ButtonPanel(this, 150, 350); // 철판 아래로 이동
  }

  private createGrid() {
    const startX = 100;
    const startY = 100;
    const cellSize = 60;

    // 철판 배경
    this.add.rectangle(startX + 90, startY + 90, 200, 200, 0x444444, 0.8);

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const x = startX + 30 + col * cellSize;
        const y = startY + 30 + row * cellSize;

        const cell = this.add
          .rectangle(x, y, cellSize - 5, cellSize - 5, 0x666666)
          .setInteractive();

        cell.on('pointerdown', () => this.handleGridClick(row, col, cell));
      }
    }
  }

  private handleGridClick(row: number, col: number, cell: Phaser.GameObjects.Rectangle) {
    const state = gridState[row][col];
    const now = Date.now();

    console.log(`[${row},${col}] 모드: ${toolState.current}, 상태:`, state);

    switch (toolState.current) {
      case 'batter':
        if (!state.hasBatter) {
          state.hasBatter = true;
          state.startedAt = now;
          cell.setFillStyle(0xffd700); // 노란색 반죽
          console.log(`[${row},${col}] 반죽 추가`);
        }
        break;

      case 'octopus':
        if (state.hasBatter && !state.hasOctopus) {
          state.hasOctopus = true;
          cell.setFillStyle(0xff8c00); // 주황색 (반죽+문어)
          console.log(`[${row},${col}] 문어 추가`);
        }
        break;

      case 'stick':
        if (state.hasBatter && state.hasOctopus) {
          if (!state.flipped) {
            // 첫 번째 클릭: 뒤집기
            state.flipped = true;
            state.flippedAt = now;
            state.cookedLevel = 'flipped';
            cell.setFillStyle(0x8b4513); // 갈색 (뒤집힌 상태)
            console.log(`[${row},${col}] 뒤집기 완료`);
          } else {
            // 두 번째 클릭: 접시로 이동
            if (plateState.length < 9) {
              plateState.push({
                sauce: null,
                topping: null,
                cookedLevel: state.cookedLevel,
              });

              // 셀 완전 초기화
              Object.assign(state, {
                hasBatter: false,
                hasOctopus: false,
                flipped: false,
                startedAt: null,
                flippedAt: null,
                cookedLevel: 'raw',
                movedToPlate: false,
              });

              cell.setFillStyle(0x666666); // 원래 색으로
              console.log(`[${row},${col}] 접시로 이동! 총 ${plateState.length}개`);
              this.updatePlates();
            }
          }
        }
        break;
    }
  }

  private createPlates() {
    const startX = 350; // 철판 옆으로 이동
    const startY = 100;
    const plateSize = 50;

    // 접시 영역 배경
    this.add.rectangle(startX + 75, startY + 75, 180, 180, 0x444444, 0.8);

    for (let i = 0; i < 9; i++) {
      const x = startX + 25 + (i % 3) * plateSize;
      const y = startY + 25 + Math.floor(i / 3) * plateSize;

      const plate = this.add
        .rectangle(x, y, plateSize - 5, plateSize - 5, 0x999999)
        .setStrokeStyle(2, 0x333333)
        .setInteractive();

      const text = this.add
        .text(x, y, '', {
          fontSize: '20px',
          color: '#000',
        })
        .setOrigin(0.5);

      this.plateRects.push(plate);
      this.plateTexts.push(text);

      // 접시 클릭 이벤트 (소스/토핑용)
      plate.on('pointerdown', () => this.handlePlateClick(i));
    }

    this.updatePlates();
  }

  private handlePlateClick(plateIndex: number) {
    if (plateIndex >= plateState.length) return; // 빈 접시면 무시

    const takoyaki = plateState[plateIndex];

    switch (toolState.current) {
      case 'sauce':
        if (!takoyaki.sauce) {
          takoyaki.sauce = 'okonomiyaki'; // 기본 소스
          console.log(`접시[${plateIndex}] 소스 추가`);
          this.updatePlates();
        }
        break;

      case 'topping1':
        if (!takoyaki.topping) {
          takoyaki.topping = 'mayo'; // 마요네즈
          console.log(`접시[${plateIndex}] 마요 추가`);
          this.updatePlates();
        }
        break;

      case 'topping2':
        if (!takoyaki.topping) {
          takoyaki.topping = 'katsuobushi'; // 가츠오부시
          console.log(`접시[${plateIndex}] 가츠오부시 추가`);
          this.updatePlates();
        }
        break;

      case 'topping3':
        if (!takoyaki.topping) {
          takoyaki.topping = 'nori'; // 김
          console.log(`접시[${plateIndex}] 김 추가`);
          this.updatePlates();
        }
        break;

      case 'serve':
        console.log('서빙 모드에서는 개별 접시 클릭이 아닌 서빙 버튼을 사용하세요');
        break;
    }
  }

  private updatePlates() {
    for (let i = 0; i < this.plateRects.length; i++) {
      if (i < plateState.length) {
        const takoyaki = plateState[i];

        // 색상 결정 (소스/토핑 여부에 따라)
        let color = 0xffcc66; // 기본 타코야끼 색
        if (takoyaki.sauce && takoyaki.topping) {
          color = 0xff6b6b; // 완성품 (빨간색)
        } else if (takoyaki.sauce) {
          color = 0xffa500; // 소스만 (주황색)
        }

        this.plateRects[i].setFillStyle(color);
        this.plateTexts[i].setText('🍥');
      } else {
        this.plateRects[i].setFillStyle(0x999999);
        this.plateTexts[i].setText('');
      }
    }
  }
}
