import Phaser from 'phaser';
import {
  currentCustomer,
  spawnNewCustomer,
  gameStats,
  gameFlow,
  type CustomerOrder,
} from '../state/gameState';
import { PlatesManager } from './PlatesManager';

export class CustomerManager {
  private scene: Phaser.Scene;
  private platesManager: PlatesManager;
  private customerSprite: Phaser.GameObjects.Sprite | null = null;

  // UI 패널들
  private currentOrderBubble: {
    graphics: Phaser.GameObjects.Graphics;
    text: Phaser.GameObjects.Text;
  } | null = null;

  private currentProductionPanel: {
    panel: Phaser.GameObjects.Graphics;
    text: Phaser.GameObjects.Text;
  } | null = null;

  constructor(scene: Phaser.Scene, platesManager: PlatesManager) {
    this.scene = scene;
    this.platesManager = platesManager;
    this.createCustomerArea();
  }

  private createCustomerArea() {
    this.createTemporaryCustomer();
  }

  private createTemporaryCustomer() {
    this.customerSprite = this.scene.add
      .sprite(600, 300, 'customer_temp')
      .setScale(0.6)
      .setDepth(1);
  }

  spawnNewCustomer() {
    this.clearAllUI();

    if (this.customerSprite) {
      this.customerSprite.destroy();
    }

    this.customerSprite = this.scene.add
      .sprite(900, 360, 'customer_temp')
      .setScale(0.6)
      .setDepth(1);

    this.scene.tweens.add({
      targets: this.customerSprite,
      x: 650,
      duration: 1000,
      ease: 'Power2.easeOut',
      onComplete: () => {
        this.startIdleAnimation();
        this.showCustomerOrder();
      },
    });

    spawnNewCustomer();
  }

  private startIdleAnimation() {
    if (!this.customerSprite) return;

    this.scene.tweens.add({
      targets: this.customerSprite,
      y: this.customerSprite.y + 5,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private showCustomerOrder() {
    if (!this.customerSprite || !currentCustomer.customer) return;

    this.showOrderBubble(
      this.customerSprite.x - 200,
      this.customerSprite.y - 200,
      currentCustomer.customer.order
    );

    this.showProductionPanel(570, 390, currentCustomer.customer.order);
  }

  private showOrderBubble(x: number, y: number, order: CustomerOrder) {
    this.clearOrderBubble();

    const width = 180;
    const height = 80;

    const bubble = this.scene.add.graphics();
    bubble.setDepth(20);

    bubble.fillStyle(0xfff3d1, 0.95);
    bubble.lineStyle(3, 0x996633);
    bubble.fillRoundedRect(x, y, width, height, 16);
    bubble.strokeRoundedRect(x, y, width, height, 16);
    bubble.beginPath();
    bubble.moveTo(x + 80, y + height);
    bubble.lineTo(x + 95, y + height + 15);
    bubble.lineTo(x + 90, y + height);
    bubble.closePath();
    bubble.fillPath();
    bubble.strokePath();

    const orderText = this.scene.add
      .text(x + width / 2, y + 40, `타코야끼 ${order.totalQuantity}개 주세요`, {
        fontSize: '16px',
        color: '#cc2200',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(21);

    this.currentOrderBubble = { graphics: bubble, text: orderText };

    this.scene.time.delayedCall(2000, () => {
      this.clearOrderBubble();
    });
  }

  showProductionPanel(x: number, y: number, order: CustomerOrder) {
    this.clearProductionPanel();

    const width = 140;
    const height = 120;

    const panel = this.scene.add.graphics();
    panel.fillStyle(0x2b2b2b, 0.8);
    panel.fillRoundedRect(x, y, width, height, 10);
    panel.lineStyle(2, 0xf5deb3);
    panel.strokeRoundedRect(x, y, width, height, 10);
    panel.setDepth(10);

    const orderText = this.scene.add
      .text(x + 15, y + 15, this.formatOrderText(order), {
        fontSize: '14px',
        color: '#fff8e1',
        lineSpacing: 4,
      })
      .setDepth(11);

    this.currentProductionPanel = { panel, text: orderText };
  }

  private formatOrderText(order: CustomerOrder): string {
    const lines = ['남은 주문'];

    if (order.remainingToppingBreakdown.negi > 0)
      lines.push(`파 : ${order.remainingToppingBreakdown.negi}개`);
    if (order.remainingToppingBreakdown.katsuobushi > 0)
      lines.push(`가츠오 : ${order.remainingToppingBreakdown.katsuobushi}개`);
    if (order.remainingToppingBreakdown.nori > 0)
      lines.push(`김 : ${order.remainingToppingBreakdown.nori}개`);
    if (order.remainingToppingBreakdown.none > 0)
      lines.push(`토핑없이 : ${order.remainingToppingBreakdown.none}개`);

    return lines.join('\n');
  }

  updateProductionPanel(order: CustomerOrder) {
    if (!this.currentProductionPanel) {
      this.showProductionPanel(570, 390, order);
      return;
    }

    this.currentProductionPanel.text.setText(this.formatOrderText(order));
  }

  showFeedback(mood: 'happy' | 'neutral' | 'angry') {
    if (!this.customerSprite) return;

    if (mood === 'happy') {
      this.scene.tweens.add({
        targets: this.customerSprite,
        y: this.customerSprite.y - 20,
        duration: 200,
        yoyo: true,
        ease: 'Quad.easeOut',
      });
      this.customerSprite.setTint(0xffff99);
    } else if (mood === 'angry') {
      this.scene.tweens.add({
        targets: this.customerSprite,
        x: this.customerSprite.x + 10,
        duration: 100,
        yoyo: true,
        repeat: 5,
        ease: 'Power2.easeInOut',
      });
      this.customerSprite.setTint(0xff6666);
    }

    this.scene.time.delayedCall(1000, () => {
      if (this.customerSprite) {
        this.customerSprite.clearTint();
      }
    });
  }

  clearOrderBubble() {
    if (this.currentOrderBubble) {
      this.currentOrderBubble.graphics.destroy();
      this.currentOrderBubble.text.destroy();
      this.currentOrderBubble = null;
    }
  }

  clearProductionPanel() {
    if (this.currentProductionPanel) {
      this.currentProductionPanel.panel.destroy();
      this.currentProductionPanel.text.destroy();
      this.currentProductionPanel = null;
    }
  }

  clearAllUI() {
    this.clearOrderBubble();
    this.clearProductionPanel();
  }

  startCustomerSystem() {
    this.spawnNewCustomer();

    this.scene.time.addEvent({
      delay: 1000,
      callback: this.updatePatience,
      callbackScope: this,
      loop: true,
    });
  }

  private updatePatience() {
    if (!gameFlow.isGameActive) return;

    if (currentCustomer.customer) {
      currentCustomer.customer.patience -= 1;

      if (currentCustomer.customer.patience <= 0) {
        console.log('손님이 화나서 떠났습니다!');
        gameStats.angryCustomers++;
        currentCustomer.customer = null;

        this.clearAllUI();

        if (gameFlow.isGameActive) {
          this.scene.time.delayedCall(1000, () => {
            this.spawnNewCustomer();
          });
        }
      }
    }
  }
}
