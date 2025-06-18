import Phaser from 'phaser';
import { grid, mode, toggleMode, handleCellClick, type ToolMode } from '../game/gameState';

export default class GameScene extends Phaser.Scene {
  private cellRects: Phaser.GameObjects.Rectangle[] = [];
  private cellTexts: Phaser.GameObjects.Text[] = [];
  private modeButtons: {
    mode: ToolMode;
    rect: Phaser.GameObjects.Rectangle;
    text: Phaser.GameObjects.Text;
  }[] = [];

  constructor() {
    super('GameScene');
  }

  create() {
    const startX = 100;
    const startY = 100;
    const cellSize = 64;
    const gap = 10;

    // 철판 셀 3x3 생성
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const index = row * 3 + col;
        const x = startX + col * (cellSize + gap);
        const y = startY + row * (cellSize + gap);

        const rect = this.add.rectangle(x, y, cellSize, cellSize, 0x888888).setOrigin(0);
        rect.setInteractive();
        rect.on('pointerdown', () => {
          handleCellClick(index, Date.now());
          this.updateGridVisual();
        });

        const text = this.add.text(x + 5, y + 5, '', { fontSize: '12px', color: '#fff' });

        this.cellRects.push(rect);
        this.cellTexts.push(text);
      }
    }

    // 버튼 생성 (batter, octopus, skewer)
    const buttonModes: ToolMode[] = ['batter', 'octopus', 'skewer'];
    buttonModes.forEach((mode, i) => {
      const x = startX + i * (100 + 10);
      const y = startY + 3 * (cellSize + gap) + 20;

      const rect = this.add.rectangle(x, y, 100, 40, 0x444444).setOrigin(0);
      rect.setInteractive();
      rect.on('pointerdown', () => {
        toggleMode(mode);
        this.updateButtonVisual();
      });

      const text = this.add.text(x + 10, y + 10, mode!, {
        fontSize: '14px',
        color: '#fff',
      });

      this.modeButtons.push({ mode, rect, text });
    });

    this.updateGridVisual();
    this.updateButtonVisual();
  }

  updateGridVisual() {
    grid.forEach((cell, i) => {
      const rect = this.cellRects[i];
      const text = this.cellTexts[i];

      let color = 0x888888;
      let status = '';
      if (cell.hasBatter) {
        color = 0xffd700;
        status = 'B';
      }
      if (cell.hasOctopus) {
        color = 0xffa500;
        status += 'O';
      }
      if (cell.flipped) {
        color = 0x8b4513;
        status = 'F';
      }
      if (cell.movedToPlate) {
        color = 0x222222;
        status = 'X';
      }

      rect.setFillStyle(color);
      text.setText(status);
    });
  }

  updateButtonVisual() {
    this.modeButtons.forEach(({ mode: m, rect }) => {
      if (mode === m) {
        rect.setFillStyle(0x00cc66);
      } else {
        rect.setFillStyle(0x444444);
      }
    });
  }
}
