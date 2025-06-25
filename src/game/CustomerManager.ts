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
  // 손님 앞 서빙된 상자들 관리
  private servedBoxes: Phaser.GameObjects.Image[] = [];
  // TODO: 최대 상자 개수 설정
  private readonly maxBoxesDisplay = 3; // 최대 3개 상자까지 표시

  // 주문 말풍선
  private currentOrderBubble: {
    graphics: Phaser.GameObjects.Graphics;
    text: Phaser.GameObjects.Text;
  } | null = null;

  // 남은 주문 패널
  private currentProductionPanel: {
    panel: Phaser.GameObjects.Graphics;
    text: Phaser.GameObjects.Text;
  } | null = null;

  // 기분 말풍선 추가
  private currentMoodBubble: {
    graphics: Phaser.GameObjects.Graphics;
    text: Phaser.GameObjects.Text;
  } | null = null;

  // 현재 손님의 기분 상태 (캐시)
  private currentMood: 'happy' | 'neutral' | 'angry' = 'happy';
  private lastPatienceCheck: number = 100; // 마지막으로 체크한 인내심 값

  // 타이머 참조들 (정리용)
  private patienceUpdateTimer: Phaser.Time.TimerEvent | null = null;
  private moodUpdateTimer: Phaser.Time.TimerEvent | null = null;

  constructor(scene: Phaser.Scene, platesManager: PlatesManager) {
    this.scene = scene;
    this.platesManager = platesManager;
    // TODO: PlatesManager이 사용되지 않아 발생하는 빌드 에러 수정 필요
    console.log(this.platesManager);
    this.createCustomerArea();
  }

  // 타코야끼 상자 서빙 애니메이션
  async animateBoxServing(): Promise<void> {
    return new Promise((resolve) => {
      const sourceX = 370; // PlatesManager 위치
      const sourceY = 340;

      // 손님 앞 테이블 위치
      const tableX = 650;
      const tableY = 430;

      const boxTexture = 'takoyaki-box';

      // 1. 날아갈 타코야끼 상자 생성
      const flyingBox = this.scene.add
        .image(sourceX, sourceY, boxTexture)
        .setScale(0.08)
        .setDepth(25);

      // 2. 목표 위치 계산 (기존 상자들 옆에 배치)
      const boxIndex = this.servedBoxes.length % this.maxBoxesDisplay;
      const targetX = tableX - 20 + boxIndex * 25;
      const targetY = tableY - 40;

      // 3. 포물선 비행 애니메이션
      this.animateBoxFlight(flyingBox, targetX, targetY, () => {
        // 4. 도착 후 처리
        flyingBox.destroy();

        // 기존 상자가 최대 개수에 도달하면 가장 오래된 것 제거
        if (this.servedBoxes.length >= this.maxBoxesDisplay) {
          const oldestBox = this.servedBoxes.shift();
          if (oldestBox) {
            this.scene.tweens.add({
              targets: oldestBox,
              alpha: 0,
              duration: 300,
              onComplete: () => oldestBox.destroy(),
            });
          }
        }

        // 5. 새 상자를 테이블에 고정
        const servedBox = this.scene.add
          .image(targetX, targetY, boxTexture)
          .setScale(0.12)
          .setDepth(15)
          .setAlpha(0);

        this.servedBoxes.push(servedBox);

        // 6. 상자 등장 애니메이션
        this.scene.tweens.add({
          targets: servedBox,
          alpha: 1,
          scaleX: 0.14,
          scaleY: 0.14,
          duration: 200,
          ease: 'Back.easeOut',
          onComplete: () => {
            // 7. 원래 크기로 안정화
            this.scene.tweens.add({
              targets: servedBox,
              scaleX: 0.12,
              scaleY: 0.12,
              duration: 150,
              ease: 'Power2.easeOut',
            });
          },
        });

        resolve();
      });
    });
  }

  // 상자 비행 애니메이션 (포물선)
  private animateBoxFlight(
    flyingBox: Phaser.GameObjects.Image,
    targetX: number,
    targetY: number,
    onComplete: () => void
  ) {
    const startX = flyingBox.x;
    const startY = flyingBox.y;

    const midX = (startX + targetX) / 2;
    const midY = Math.min(startY, targetY) - 80; // 포물선 높이

    // 베지어 곡선 경로
    const curve = new Phaser.Curves.QuadraticBezier(
      new Phaser.Math.Vector2(startX, startY),
      new Phaser.Math.Vector2(midX, midY),
      new Phaser.Math.Vector2(targetX, targetY)
    );

    // 경로를 따라 이동
    this.scene.tweens.add({
      targets: flyingBox,
      duration: 1000,
      ease: 'Power2.easeOut',
      onUpdate: (tween) => {
        const point = curve.getPoint(tween.progress);
        flyingBox.x = point.x;
        flyingBox.y = point.y;
      },
      onComplete: onComplete,
    });

    // 회전 효과 (상자가 날아가면서 회전)
    this.scene.tweens.add({
      targets: flyingBox,
      rotation: Math.PI * 1.5, // 270도 회전
      duration: 1000,
      ease: 'Power2.easeOut',
    });

    // 크기 변화 (날아가면서 조금 작아짐)
    this.scene.tweens.add({
      targets: flyingBox,
      scaleX: 0.08,
      scaleY: 0.08,
      duration: 1000,
      ease: 'Power2.easeOut',
    });
  }

  // 주문 완료 시 모든 상자 제거
  clearServedBoxes() {
    this.servedBoxes.forEach((box) => {
      // 상자 사라짐 애니메이션
      this.scene.tweens.add({
        targets: box,
        alpha: 0,
        y: box.y - 30,
        duration: 500,
        ease: 'Power2.easeIn',
        onComplete: () => box.destroy(),
      });
    });

    this.servedBoxes = [];
  }

  private createCustomerArea() {
    this.createTemporaryCustomer();
  }

  private createTemporaryCustomer() {
    this.customerSprite = this.scene.add
      .sprite(600, 300, 'customer_happy')
      .setScale(0.6)
      .setDepth(1);
  }

  spawnNewCustomer() {
    this.clearAllUI();

    if (this.customerSprite) {
      this.customerSprite.destroy();
    }

    this.customerSprite = this.scene.add
      .sprite(900, 360, 'customer_happy')
      .setScale(0.6)
      .setDepth(1);

    // 새 손님이므로 기분 및 인내심 초기화
    this.currentMood = 'happy';
    this.lastPatienceCheck = 100;
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

  // 최적화된 기분 업데이트 (인내심이 변경된 경우에만 실행)
  private updateMoodByPatience() {
    if (!currentCustomer.customer || !this.customerSprite) {
      return;
    }

    const currentPatience = currentCustomer.customer.patience;

    // 인내심이 변경되지 않았으면 스킵
    if (currentPatience === this.lastPatienceCheck) {
      return;
    }

    this.lastPatienceCheck = currentPatience;

    const moodData = getCustomerMoodByPatience(currentPatience);
    const newMood = moodData.mood;

    // 기분이 실제로 변경된 경우에만 적용
    if (this.currentMood !== newMood) {
      console.log(`손님 기분 변화: ${this.currentMood} → ${newMood} (인내심: ${currentPatience}%)`);
      this.applyMoodTint(newMood);
      this.showMoodBubble(newMood, moodData.message); // 기분 말풍선 표시
      this.currentMood = newMood; // 기분 적용 후에 상태 업데이트
    }
  }

  // 기분 말풍선 표시
  private showMoodBubble(mood: 'happy' | 'neutral' | 'angry', message: string) {
    if (!this.customerSprite) return;

    this.clearMoodBubble();

    const x = this.customerSprite.x - 50;
    const y = this.customerSprite.y - 250;
    const width = 160;
    const height = 60;

    // 기분에 따른 말풍선 색상 설정
    let bubbleColor: number;
    let borderColor: number;
    let textColor: string;

    switch (mood) {
      case 'happy':
        bubbleColor = 0xe8f5e8; // 연한 초록
        borderColor = 0x4caf50; // 초록
        textColor = '#2e7d32';
        break;
      case 'neutral':
        bubbleColor = 0xfff8e1; // 연한 노랑
        borderColor = 0xffc107; // 노랑
        textColor = '#f57f17';
        break;
      case 'angry':
        bubbleColor = 0xffebee; // 연한 빨강
        borderColor = 0xf44336; // 빨강
        textColor = '#c62828';
        break;
    }

    const bubble = this.scene.add.graphics();
    bubble.setDepth(25); // 다른 UI보다 위에 표시

    // 말풍선 배경
    bubble.fillStyle(bubbleColor, 0.95);
    bubble.lineStyle(2, borderColor);
    bubble.fillRoundedRect(x, y, width, height, 12);
    bubble.strokeRoundedRect(x, y, width, height, 12);

    // 생각 풍선 동그라미들 (손님 쪽으로)
    const circleX = x + width / 2;
    const circleStartY = y + height;

    // 큰 동그라미
    bubble.fillCircle(circleX - 2, circleStartY + 12, 6);
    bubble.strokeCircle(circleX - 2, circleStartY + 12, 6);

    // 중간 동그라미
    bubble.fillCircle(circleX - 12, circleStartY + 22, 4);
    bubble.strokeCircle(circleX - 12, circleStartY + 22, 4);

    // 텍스트
    const bubbleText = this.scene.add
      .text(x + width / 2, y + height / 2, message, {
        fontSize: '14px',
        color: textColor,
        fontStyle: 'bold',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(26);

    this.currentMoodBubble = { graphics: bubble, text: bubbleText };

    // 2.5초 후 자동으로 사라짐
    // this.scene.time.delayedCall(2500, () => {
    //   this.clearMoodBubble();
    // });

    // 말풍선 등장 애니메이션
    bubble.setScale(0);
    bubbleText.setScale(0);

    this.scene.tweens.add({
      targets: [bubble, bubbleText],
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      ease: 'Back.easeOut',
    });
  }

  // 기분 말풍선 제거
  private clearMoodBubble() {
    if (this.currentMoodBubble) {
      this.currentMoodBubble.graphics.destroy();
      this.currentMoodBubble.text.destroy();
      this.currentMoodBubble = null;
    }
  }

  // 기분 적용 (currentMood 업데이트는 호출하는 쪽에서 처리)
  private applyMoodTint(mood: 'happy' | 'neutral' | 'angry') {
    if (!this.customerSprite) {
      console.log('스프라이트가 없어서 Tint 적용 안됨');
      return;
    }

    console.log(`${mood} 기분 적용 중...`);

    switch (mood) {
      case 'happy':
        console.log('Happy 상태로 변경 - 기본 텍스처, 틴트 제거');
        this.customerSprite.setTexture('customer_happy');
        this.customerSprite.clearTint();
        break;
      case 'neutral':
        console.log('Neutral 상태로 변경 - neutral 텍스처, 노란 틴트');
        this.customerSprite.setTexture('customer_neutral');
        this.customerSprite.setTint(0xffffaa);
        break;
      case 'angry':
        console.log('Angry 상태로 변경 - angry 텍스처, 빨간 틴트');
        this.customerSprite.setTexture('customer_angry');
        this.customerSprite.setTint(0xffaaaa);
        break;
    }
  }

  // 현재 기분 반환 (서빙 완료 시 보너스 계산용)
  getCurrentMood(): 'happy' | 'neutral' | 'angry' {
    return this.currentMood;
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

  // 타이머 정리 메서드 추가
  private cleanupTimers() {
    if (this.patienceUpdateTimer) {
      this.patienceUpdateTimer.destroy();
      this.patienceUpdateTimer = null;
    }
    if (this.moodUpdateTimer) {
      this.moodUpdateTimer.destroy();
      this.moodUpdateTimer = null;
    }
  }

  startCustomerSystem() {
    console.log('CustomerSystem 시작');

    // 기존 타이머들 정리
    this.cleanupTimers();

    this.spawnNewCustomer();

    // 인내심 업데이트 (1초마다)
    this.patienceUpdateTimer = this.scene.time.addEvent({
      delay: 1000,
      callback: this.updatePatience,
      callbackScope: this,
      loop: true,
    });

    // 기분 업데이트 (2초마다로 줄임 - 더 반응성 있게)
    this.moodUpdateTimer = this.scene.time.addEvent({
      delay: 2000,
      callback: this.updateMoodByPatience,
      callbackScope: this,
      loop: true,
    });
  }

  private updatePatience() {
    if (!gameFlow.isGameActive || !currentCustomer.customer) return;

    currentCustomer.customer.patience -= 1;
    // console.log(`인내심 감소: ${currentCustomer.customer.patience}%`);

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

  // 기존 clearAllUI
  clearAllUI() {
    this.clearOrderBubble();
    this.clearProductionPanel();
    this.clearMoodBubble();
    this.clearServedBoxes(); // 상자들도 정리
  }

  // 성공적인 서빙 후 상자 반짝임 효과
  celebrateSuccessfulServing() {
    this.servedBoxes.forEach((box, index) => {
      this.scene.time.delayedCall(index * 100, () => {
        // 황금색 반짝임
        this.scene.tweens.add({
          targets: box,
          tint: 0xffd700, // 황금색
          duration: 200,
          yoyo: true,
          repeat: 2,
          onComplete: () => {
            box.clearTint();
          },
        });
      });
    });
  }

  // 메모리 누수 방지를 위한 destroy 메서드
  destroy() {
    this.cleanupTimers();
    this.clearAllUI();
    if (this.customerSprite) {
      this.customerSprite.destroy();
      this.customerSprite = null;
    }
  }
}
