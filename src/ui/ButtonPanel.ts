// src/ui/ButtonPanel.ts
import Phaser from 'phaser';
import { toolState, type Tool } from '../state/gameState';

export class ButtonPanel {
  private scene: Phaser.Scene;
  private buttons: Phaser.GameObjects.Rectangle[] = [];
  private texts: Phaser.GameObjects.Text[] = [];

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.createButtons(x, y);
  }

  private createButtons(startX: number, startY: number) {
    const mainTools: { tool: Tool; label: string; color: number }[] = [
      { tool: 'batter', label: '반죽', color: 0xffd700 },
      { tool: 'octopus', label: '문어', color: 0xff8c00 },
      { tool: 'stick', label: '꼬챙이', color: 0x8b4513 },
      { tool: 'sauce', label: '소스', color: 0xdc143c },
      { tool: 'serve', label: '서빙', color: 0x4169e1 },
    ];

    // 메인 도구들 (가로로 배치)
    mainTools.forEach((toolData, index) => {
      const button = this.scene.add
        .rectangle(startX + index * 90, startY, 80, 40, toolData.color)
        .setInteractive();

      const text = this.scene.add
        .text(startX + index * 90, startY, toolData.label, {
          fontSize: '14px',
          color: '#000',
        })
        .setOrigin(0.5);

      this.buttons.push(button);
      this.texts.push(text);

      button.on('pointerdown', () => {
        toolState.current = toolData.tool;
        this.updateButtonStyles();
        console.log('도구 변경:', toolData.tool);
      });
    });

    // 토핑들 (아래쪽에 가로로 배치)
    const toppings = [
      { tool: 'topping1' as Tool, label: '마요', color: 0xfffacd },
      { tool: 'topping2' as Tool, label: '가츠오', color: 0xdeb887 },
      { tool: 'topping3' as Tool, label: '김', color: 0x2f4f2f },
    ];

    toppings.forEach((toppingData, index) => {
      const button = this.scene.add
        .rectangle(startX + index * 90, startY + 60, 80, 35, toppingData.color)
        .setInteractive();

      const text = this.scene.add
        .text(startX + index * 90, startY + 60, toppingData.label, {
          fontSize: '12px',
          color: '#000',
        })
        .setOrigin(0.5);

      this.buttons.push(button);
      this.texts.push(text);

      button.on('pointerdown', () => {
        toolState.current = toppingData.tool;
        this.updateButtonStyles();
        console.log('토핑 선택:', toppingData.tool);
      });
    });

    this.updateButtonStyles();
  }

  private updateButtonStyles() {
    const allTools: Tool[] = [
      'batter',
      'octopus',
      'stick',
      'sauce',
      'serve',
      'topping1',
      'topping2',
      'topping3',
    ];

    this.buttons.forEach((button, index) => {
      if (allTools[index] === toolState.current) {
        button.setStrokeStyle(3, 0x000000);
      } else {
        button.setStrokeStyle(1, 0x666666);
      }
    });
  }
}
