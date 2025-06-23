import Phaser from 'phaser';
import { platesWithTakoyaki, currentSelectedTool, gameFlow } from '../state/gameState';
import { TextureHelper } from '../utiils/TextureHelper';

export class PlatesManager {
  private scene: Phaser.Scene;
  private plateVisualElements: Phaser.GameObjects.Image[] = [];
  private plateTextElements: Phaser.GameObjects.Text[] = [];

  private readonly platesStartX = 320;
  private readonly platesStartY = 290;
  private readonly plateSize = 50;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.create();
  }

  private create() {
    this.createBackground();
    this.createPlates();
    this.updateDisplay();
  }

  private createBackground() {
    this.scene.add
      .image(this.platesStartX + 75, this.platesStartY + 75, 'dish')
      .setScale(0.25)
      .setDepth(5);
  }

  private createPlates() {
    for (let plateIndex = 0; plateIndex < 10; plateIndex++) {
      const plateX = this.platesStartX + 50 + (plateIndex % 2) * this.plateSize;
      const plateY = this.platesStartY - 25 + Math.floor(plateIndex / 2) * this.plateSize;

      const plateVisualElement = this.scene.add
        .image(plateX, plateY, 'tako-position')
        .setScale(0.07)
        .setInteractive()
        .setDepth(7);

      const plateTextElement = this.scene.add
        .text(plateX, plateY, '', {
          fontSize: '20px',
          color: '#000',
        })
        .setOrigin(0.5);

      this.plateVisualElements.push(plateVisualElement);
      this.plateTextElements.push(plateTextElement);

      plateVisualElement.on('pointerdown', () => this.handlePlateClick(plateIndex));
    }
  }

  private handlePlateClick(plateIndex: number) {
    if (!gameFlow.isGameActive) return;
    if (plateIndex >= platesWithTakoyaki.length) return;

    const clickedTakoyaki = platesWithTakoyaki[plateIndex];
    const currentTool = currentSelectedTool.current;

    switch (currentTool) {
      case 'sauce':
        this.addSauce(clickedTakoyaki, plateIndex);
        break;
      case 'negi':
      case 'katsuobushi':
      case 'nori':
        this.addTopping(clickedTakoyaki, currentTool, plateIndex);
        break;
    }
  }

  private addSauce(takoyaki: any, plateIndex: number) {
    if (!takoyaki.sauce) {
      takoyaki.sauce = 'okonomiyaki';
      this.updateDisplay();
      console.log(`접시[${plateIndex}] 소스 추가`);
    }
  }

  private addTopping(takoyaki: any, topping: string, plateIndex: number) {
    if (!takoyaki.topping) {
      takoyaki.topping = topping;
      this.updateDisplay();
      console.log(`접시[${plateIndex}] 토핑 추가: ${topping}`);
    }
  }

  updateDisplay() {
    for (let plateIndex = 0; plateIndex < this.plateVisualElements.length; plateIndex++) {
      if (plateIndex < platesWithTakoyaki.length) {
        const takoyaki = platesWithTakoyaki[plateIndex];
        const plateImage = TextureHelper.getPlateTexture(takoyaki);
        this.plateVisualElements[plateIndex].setTexture(plateImage);
      } else {
        this.plateVisualElements[plateIndex].setTexture('tako-position');
      }
    }
  }
}
