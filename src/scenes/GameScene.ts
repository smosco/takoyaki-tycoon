import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
  private batterMode: boolean = false;
  private octopusMode: boolean = false;
  private gridCells: Phaser.GameObjects.Rectangle[] = [];

  constructor() {
    super('GameScene');
  }

  preload() {
    // 나중에 이미지 preload
  }

  create() {
    const GRID_ROWS = 3;
    const GRID_COLS = 3;
    const CELL_SIZE = 100;

    // 타코야끼 틀
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const x = 150 + col * CELL_SIZE;
        const y = 100 + row * CELL_SIZE;

        const cell = this.add.rectangle(x, y, 80, 80, 0x555555).setStrokeStyle(2, 0xaaaaaa);
        cell.setInteractive();
        cell.setData('hasBatter', false);
        cell.setData('hasOctopus', false);

        cell.on('pointerdown', () => {
          // 반죽 모드
          if (this.batterMode && !cell.getData('hasBatter')) {
            cell.setFillStyle(0xffcc99);
            cell.setData('hasBatter', true);
            return;
          }

          // 문어 모드
          if (this.octopusMode && cell.getData('hasBatter') && !cell.getData('hasOctopus')) {
            cell.setFillStyle(0xff9988);
            cell.setData('hasOctopus', true);
            return;
          }
        });

        this.gridCells.push(cell);
      }
    }

    // 반죽 버튼
    const batterButton = this.add
      .rectangle(650, 120, 120, 50, 0x0088ff)
      .setInteractive()
      .setStrokeStyle(2, 0xffffff);
    const batterText = this.add.text(0, 0, '반죽', { fontSize: '20px', color: '#ffffff' });
    Phaser.Display.Align.In.Center(batterText, batterButton);

    batterButton.on('pointerdown', () => {
      this.batterMode = true;
      this.octopusMode = false;
      console.log('반죽 모드 ON!');
    });

    // 문어 버튼
    const octopusButton = this.add
      .rectangle(650, 190, 120, 50, 0xff5588)
      .setInteractive()
      .setStrokeStyle(2, 0xffffff);
    const octopusText = this.add.text(0, 0, '문어', { fontSize: '20px', color: '#ffffff' });
    Phaser.Display.Align.In.Center(octopusText, octopusButton);

    octopusButton.on('pointerdown', () => {
      this.octopusMode = true;
      this.batterMode = false;
      console.log('문어 모드 ON!');
    });
  }
}
