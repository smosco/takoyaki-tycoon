import Phaser from 'phaser';
import { currentSelectedTool, type Tool } from '../state/gameState';

export class ButtonPanel {
  private scene: Phaser.Scene;
  private toolButtonElements: Phaser.GameObjects.Rectangle[] = [];
  private toolButtonTexts: Phaser.GameObjects.Text[] = [];

  constructor(scene: Phaser.Scene, startX: number, startY: number) {
    this.scene = scene;
    this.createAllToolButtons(startX, startY);
  }

  private createAllToolButtons(startX: number, startY: number) {
    const mainToolsData: { tool: Tool; label: string; color: number }[] = [
      { tool: 'batter', label: '반죽', color: 0xffd700 },
      { tool: 'octopus', label: '문어', color: 0xff8c00 },
      { tool: 'stick', label: '꼬챙이', color: 0x8b4513 },
      { tool: 'sauce', label: '소스', color: 0xdc143c },
      { tool: 'serve', label: '서빙', color: 0x4169e1 },
    ];

    // 메인 도구들
    mainToolsData.forEach((toolData, buttonIndex) => {
      const toolButton = this.scene.add
        .rectangle(startX + buttonIndex * 90, startY, 80, 40, toolData.color)
        .setInteractive();

      const toolButtonText = this.scene.add
        .text(startX + buttonIndex * 90, startY, toolData.label, {
          fontSize: '14px',
          color: '#000',
        })
        .setOrigin(0.5);

      this.toolButtonElements.push(toolButton);
      this.toolButtonTexts.push(toolButtonText);

      toolButton.on('pointerdown', () => {
        currentSelectedTool.current = toolData.tool;
        this.updateAllButtonStyles();
        console.log('선택된 도구:', toolData.tool);
      });
    });

    // 토핑들
    const toppingsData: { tool: Tool; label: string; color: number }[] = [
      { tool: 'mayo', label: '마요', color: 0xfffacd },
      { tool: 'katsuobushi', label: '가츠오', color: 0xdeb887 },
      { tool: 'nori', label: '김', color: 0x2f4f2f },
    ];

    toppingsData.forEach((toppingData, toppingIndex) => {
      const toppingButton = this.scene.add
        .rectangle(startX + toppingIndex * 90, startY + 60, 80, 35, toppingData.color)
        .setInteractive();

      const toppingButtonText = this.scene.add
        .text(startX + toppingIndex * 90, startY + 60, toppingData.label, {
          fontSize: '12px',
          color: '#000',
        })
        .setOrigin(0.5);

      this.toolButtonElements.push(toppingButton);
      this.toolButtonTexts.push(toppingButtonText);

      toppingButton.on('pointerdown', () => {
        currentSelectedTool.current = toppingData.tool;
        this.updateAllButtonStyles();
        console.log('선택된 토핑:', toppingData.tool);
      });
    });

    this.updateAllButtonStyles();
  }

  private updateAllButtonStyles() {
    const allAvailableTools: Tool[] = [
      'batter',
      'octopus',
      'stick',
      'sauce',
      'serve',
      'mayo',
      'katsuobushi',
      'nori',
    ];

    this.toolButtonElements.forEach((buttonElement, buttonIndex) => {
      if (allAvailableTools[buttonIndex] === currentSelectedTool.current) {
        buttonElement.setStrokeStyle(3, 0x000000); // 선택된 버튼 강조
      } else {
        buttonElement.setStrokeStyle(1, 0x666666); // 선택되지 않은 버튼
      }
    });
  }
}
