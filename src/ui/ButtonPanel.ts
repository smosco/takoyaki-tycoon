import Phaser from 'phaser';
import { toolState } from '../state/gameState';
import type { ToolMode } from '../types';

export class ButtonPanel extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    const modes: ToolMode[] = ['batter', 'octopus', 'stick', 'sauce', 'topping', 'serve'];

    modes.forEach((mode, index) => {
      const btn = scene.add
        .text(0, index * 40, mode.toUpperCase(), {
          fontSize: '18px',
          backgroundColor: '#333',
          color: '#fff',
          padding: { x: 10, y: 5 },
        })
        .setInteractive()
        .on('pointerdown', () => {
          toolState.current = mode;
          console.log('Tool selected:', mode);
        });

      this.add(btn);
    });

    scene.add.existing(this);
  }
}
