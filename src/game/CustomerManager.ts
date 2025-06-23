import Phaser from 'phaser';
import {
  currentCustomer,
  spawnNewCustomer,
  gameStats,
  gameFlow,
  getCustomerMoodByPatience,
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

  // 현재 손님의 기분 상태
  private currentMood: 'happy' | 'neutral' | 'angry' = 'happy';

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

    // 새 손님이므로 기분 초기화
    this.currentMood = 'happy';
    console.log('새 손님 등장! 초기 기분: happy');

    this.scene.tweens.add({
      targets: this.customerSprite,
      x: 650,
      duration: 1000,
      ease: 'Power2.easeOut',
      onComplete: () => {
        this.startIdleAnimation();
        this.showCustomerOrder();
        // 등장 후 바로 기분 적용
        this.applyMoodTint('happy');
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

    this.showProductionPanel(640, 470, currentCustomer.customer.order);
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

  // 실시간 기분 업데이트 (인내심 기반)
  private updateMoodByPatience() {
    console.log('updateMoodByPatience 호출됨');

    if (!currentCustomer.customer) {
      console.log('손님이 없어서 기분 업데이트 안됨');
      return;
    }

    if (!this.customerSprite) {
      console.log('손님 스프라이트가 없어서 기분 업데이트 안됨');
      return;
    }

    const patience = currentCustomer.customer.patience;
    console.log(`현재 인내심: ${patience}%`);

    const moodData = getCustomerMoodByPatience(patience);
    const newMood = moodData.mood;
    console.log(`계산된 새 기분: ${newMood} (이전: ${this.currentMood})`);

    // 항상 기분을 적용
    console.log(`기분 적용: ${newMood}`);
    this.currentMood = newMood;
    this.applyMoodTint(newMood);

    // 기분이 바뀐 경우에만 로그 (기존 로직)
    // if (this.currentMood !== newMood) {
    //   console.log(`손님 기분 변화: ${this.currentMood} → ${newMood} (인내심: ${patience}%)`);
    //   this.currentMood = newMood;
    //   this.applyMoodTint(newMood);
    // }
  }

  // 기분에 따른 Tint 적용
  private applyMoodTint(mood: 'happy' | 'neutral' | 'angry') {
    console.log(`applyMoodTint 호출: ${mood}`); // 디버깅

    if (!this.customerSprite) {
      console.log('스프라이트가 없어서 Tint 적용 안됨');
      return;
    }

    switch (mood) {
      case 'happy':
        console.log('Happy 틴트 적용 (기본색)');
        break;
      case 'neutral':
        console.log('Neutral 틴트 적용 (노란색)');
        this.customerSprite.setTint(0xffffaa); // 연한 노랑 (약간 지침)
        break;
      case 'angry':
        console.log('Angry 틴트 적용 (빨간색)');
        this.customerSprite.setTint(0xffaaaa); // 연한 빨간색 (화남)
        break;
    }
  }

  // 현재 기분 반환 (서빙 완료 시 보너스 계산용)
  getCurrentMood(): 'happy' | 'neutral' | 'angry' {
    return this.currentMood;
  }

  // 테스트용 강제 기분 변경 함수
  public testMoodChange() {
    console.log('테스트: 강제로 기분 변경');
    const moods: ('happy' | 'neutral' | 'angry')[] = ['happy', 'neutral', 'angry'];
    const randomMood = moods[Math.floor(Math.random() * moods.length)];
    console.log(`테스트 기분: ${randomMood}`);
    this.applyMoodTint(randomMood);
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
    console.log('CustomerSystem 시작'); // 디버깅
    this.spawnNewCustomer();

    // 인내심 업데이트 (기존 1초마다)
    this.scene.time.addEvent({
      delay: 1000,
      callback: this.updatePatience,
      callbackScope: this,
      loop: true,
    });

    // 기분 업데이트
    console.log('기분 업데이트 타이머 시작 (5초마다)');
    this.scene.time.addEvent({
      delay: 5000, // 5초
      callback: this.updateMoodByPatience,
      callbackScope: this,
      loop: true,
    });

    // 10초 후 강제 기분 변경
    this.scene.time.delayedCall(10000, () => {
      console.log('10초 후 테스트 실행');
      this.testMoodChange();
    });
  }

  private updatePatience() {
    if (!gameFlow.isGameActive) return;

    if (currentCustomer.customer) {
      currentCustomer.customer.patience -= 1;
      console.log(`인내심 감소: ${currentCustomer.customer.patience}%`);

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
