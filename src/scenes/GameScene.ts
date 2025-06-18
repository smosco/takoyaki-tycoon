import Phaser from 'phaser';
import { gridState, toolState } from '../state/gameState';
import { ButtonPanel } from '../ui/ButtonPanel';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    const startX = 100;
    const startY = 100;
    const cellSize = 64;

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const cell = this.add
          .rectangle(
            startX + col * cellSize,
            startY + row * cellSize,
            cellSize - 4,
            cellSize - 4,
            0x666666
          )
          .setOrigin(0);

        cell.setInteractive();
        cell.on('pointerdown', () => {
          if (toolState.current === 'batter' && !gridState[row][col].hasBatter) {
            gridState[row][col].hasBatter = true;
            cell.setFillStyle(0xffd700); // 반죽 색상
            console.log(`Batter added to cell (${row}, ${col})`);
          }
        });
      }
    }

    // 버튼 패널 추가
    new ButtonPanel(this, 350, 100);
  }
}
