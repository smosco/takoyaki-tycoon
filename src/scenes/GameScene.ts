import Phaser from 'phaser';
import {
  ironPanCells,
  currentSelectedTool,
  platesWithTakoyaki,
  getTakoyakiColorByCookingLevel,
  calculateCurrentCookingLevel,
  currentCustomer,
  spawnNewCustomer,
  serveToCustomer,
  gameScore,
  gameStats,
} from '../state/gameState';
import { ButtonPanel } from '../ui/ButtonPanel';

export class GameScene extends Phaser.Scene {
  private plateVisualElements: Phaser.GameObjects.Rectangle[] = [];
  private plateTextElements: Phaser.GameObjects.Text[] = [];
  private ironPanVisualCells: Phaser.GameObjects.Rectangle[] = [];

  // 손님 UI 요소들
  private customerContainer: Phaser.GameObjects.Container | null = null;
  private scoreText: Phaser.GameObjects.Text | null = null;
  private statsText: Phaser.GameObjects.Text | null = null;

  constructor() {
    super('GameScene');
  }

  /**
   * 게임 씬을 초기화하고 모든 UI 요소들을 생성합니다.
   * 철판, 접시, 손님 영역, 버튼 패널 등을 배치하고 실시간 업데이트를 시작합니다.
   */
  create() {
    // 배경
    this.add.rectangle(400, 300, 800, 600, 0x2d2d2d);
    this.add
      .text(400, 30, 'Takoyaki Tycoon', {
        fontSize: '24px',
        color: '#fff',
      })
      .setOrigin(0.5);

    this.createIronPanGrid();
    this.createPlatesArea();
    this.createCustomerArea();
    this.createUI();

    // ButtonPanel에 서빙 콜백 전달
    new ButtonPanel(this, 150, 350, () => this.handleServing());

    // 실시간 업데이트 시작
    this.startRealtimeCookingUpdates();
    this.startCustomerSystem();
  }

  /**
   * 3x3 철판 격자를 생성합니다.
   * 각 셀은 클릭 가능하며, 선택된 도구에 따라 다른 동작을 수행합니다.
   */
  private createIronPanGrid() {
    const ironPanStartX = 100;
    const ironPanStartY = 100;
    const cellSize = 60;

    // 철판 배경
    this.add.rectangle(ironPanStartX + 90, ironPanStartY + 90, 200, 200, 0x444444, 0.8);

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const cellX = ironPanStartX + 30 + col * cellSize;
        const cellY = ironPanStartY + 30 + row * cellSize;

        const cellVisualElement = this.add
          .rectangle(cellX, cellY, cellSize - 5, cellSize - 5, 0x666666)
          .setInteractive();

        cellVisualElement.on('pointerdown', () =>
          this.handleIronPanCellClick(row, col, cellVisualElement)
        );

        // 셀 저장 (나중에 색상 업데이트용)
        this.ironPanVisualCells[row * 3 + col] = cellVisualElement;
      }
    }
  }

  /**
   * 선택된 도구에 따라 철판 셀에서 타코야끼 제작 과정을 처리합니다.
   * 반죽 추가 → 문어 추가 → 뒤집기 → 접시로 이동 순서로 진행됩니다.
   *
   * @param row - 철판 셀의 행 인덱스 (0-2)
   * @param col - 철판 셀의 열 인덱스 (0-2)
   * @param cellVisualElement - 해당 셀의 Phaser 시각적 요소
   */
  private handleIronPanCellClick(
    row: number,
    col: number,
    cellVisualElement: Phaser.GameObjects.Rectangle
  ) {
    const currentCellState = ironPanCells[row][col];
    const currentTime = Date.now();

    console.log(
      `[${row},${col}] 선택된 도구: ${currentSelectedTool.current}, 셀 상태:`,
      currentCellState
    );

    switch (currentSelectedTool.current) {
      case 'batter':
        if (!currentCellState.hasBatter) {
          currentCellState.hasBatter = true;
          currentCellState.cookingStartTime = currentTime;
          currentCellState.cookingLevel = 'raw';

          // 초기 색상 설정
          const initialColor = getTakoyakiColorByCookingLevel('raw');
          cellVisualElement.setFillStyle(initialColor);

          console.log(`[${row},${col}] 반죽 추가, 요리 시작!`);
        }
        break;

      case 'octopus':
        if (currentCellState.hasBatter && !currentCellState.hasOctopus) {
          currentCellState.hasOctopus = true;
          cellVisualElement.setFillStyle(0xff8c00);
          console.log(`[${row},${col}] 문어 추가`);
        }
        break;

      case 'stick':
        if (currentCellState.hasBatter && currentCellState.hasOctopus) {
          if (!currentCellState.isFlipped) {
            // 첫 번째 클릭: 뒤집기 (시간은 그대로 진행)
            currentCellState.isFlipped = true;
            console.log(`[${row},${col}] 뒤집기 완료! 현재 익힘: ${currentCellState.cookingLevel}`);
          } else {
            // 두 번째 클릭: 접시로 이동
            if (platesWithTakoyaki.length < 9) {
              // 최종 익힘 상태 계산
              const finalCookingLevel = calculateCurrentCookingLevel(currentCellState, currentTime);

              platesWithTakoyaki.push({
                sauce: null,
                topping: null,
                cookingLevel: finalCookingLevel,
              });

              // 셀 완전 초기화
              Object.assign(currentCellState, {
                hasBatter: false,
                hasOctopus: false,
                isFlipped: false,
                cookingStartTime: null,
                cookingLevel: 'raw',
                isMovedToPlate: true,
              });

              cellVisualElement.setFillStyle(0x666666); // 원래 색으로
              console.log(
                `[${row},${col}] 접시로 이동! 익힘 상태: ${finalCookingLevel}, 총 ${platesWithTakoyaki.length}개`
              );
              this.updatePlatesDisplay();
            }
          }
        }
        break;
    }
  }

  /**
   * 3x3 접시 영역을 생성합니다.
   * 각 접시는 클릭 가능하며, 소스나 토핑을 추가할 수 있습니다.
   */
  private createPlatesArea() {
    const platesStartX = 350;
    const platesStartY = 100;
    const plateSize = 50;

    // 접시 영역 배경
    this.add.rectangle(platesStartX + 75, platesStartY + 75, 180, 180, 0x444444, 0.8);

    for (let plateIndex = 0; plateIndex < 9; plateIndex++) {
      const plateX = platesStartX + 25 + (plateIndex % 3) * plateSize;
      const plateY = platesStartY + 25 + Math.floor(plateIndex / 3) * plateSize;

      const plateVisualElement = this.add
        .rectangle(plateX, plateY, plateSize - 5, plateSize - 5, 0x999999)
        .setStrokeStyle(2, 0x333333)
        .setInteractive();

      const plateTextElement = this.add
        .text(plateX, plateY, '', {
          fontSize: '20px',
          color: '#000',
        })
        .setOrigin(0.5);

      this.plateVisualElements.push(plateVisualElement);
      this.plateTextElements.push(plateTextElement);

      // 접시 클릭 이벤트 (소스/토핑용)
      plateVisualElement.on('pointerdown', () => this.handlePlateClick(plateIndex));
    }

    this.updatePlatesDisplay();
  }

  /**
   * 접시에 담긴 타코야끼에 소스나 토핑을 추가합니다.
   * 현재 선택된 도구에 따라 해당하는 재료를 추가하고 시각적 표시를 업데이트합니다.
   *
   * @param plateIndex - 클릭한 접시의 인덱스 (0-8)
   */
  private handlePlateClick(plateIndex: number) {
    if (plateIndex >= platesWithTakoyaki.length) return; // 빈 접시면 무시

    const clickedTakoyaki = platesWithTakoyaki[plateIndex];
    const currentTool = currentSelectedTool.current;

    switch (currentTool) {
      case 'sauce':
        if (!clickedTakoyaki.sauce) {
          clickedTakoyaki.sauce = 'okonomiyaki';
          console.log(`접시[${plateIndex}] 소스 추가: ${clickedTakoyaki.sauce}`);
          this.updatePlatesDisplay();
        } else {
          console.log(`접시[${plateIndex}]에 이미 소스가 있습니다: ${clickedTakoyaki.sauce}`);
        }
        break;

      case 'mayo':
      case 'katsuobushi':
      case 'nori':
        // 토핑 타입 체크 및 직접 할당
        if (!clickedTakoyaki.topping) {
          clickedTakoyaki.topping = currentTool;
          console.log(`접시[${plateIndex}] 토핑 추가: ${clickedTakoyaki.topping}`);
          this.updatePlatesDisplay();
        } else {
          console.log(`접시[${plateIndex}]에 이미 토핑이 있습니다: ${clickedTakoyaki.topping}`);
        }
        break;

      default:
        console.log(`${currentTool} 모드에서는 접시를 클릭할 수 없습니다`);
        break;
    }
  }

  /**
   * 접시에 담긴 타코야끼의 상태에 따라 시각적 표시를 업데이트합니다.
   * 소스/토핑 여부에 따라 색상과 이모지를 다르게 표시합니다.
   * - 소스+토핑: 빨간색 배경, ✨ 이모지 (완성품)
   * - 소스만: 주황색 배경
   * - 기본: 노란색 배경
   * - 빈 접시: 회색 배경
   */
  private updatePlatesDisplay() {
    for (let plateIndex = 0; plateIndex < this.plateVisualElements.length; plateIndex++) {
      if (plateIndex < platesWithTakoyaki.length) {
        const currentTakoyaki = platesWithTakoyaki[plateIndex];

        // 색상 결정 (소스/토핑 여부에 따라)
        let plateColor = 0xffcc66; // 기본 타코야끼 색 (노란색)
        let displayText = '🍥';

        if (currentTakoyaki.sauce && currentTakoyaki.topping) {
          // 소스 + 토핑 완성품
          plateColor = 0xff6b6b; // 빨간색
          displayText = '🍥✨'; // 완성품 표시
        } else if (currentTakoyaki.sauce) {
          // 소스만 있음
          plateColor = 0xffa500; // 주황색
          displayText = '🍥';
        } else {
          // 기본 타코야끼 (소스/토핑 없음)
          plateColor = 0xffcc66; // 기본 노란색
          displayText = '🍥';
        }

        this.plateVisualElements[plateIndex].setFillStyle(plateColor);
        this.plateTextElements[plateIndex].setText(displayText);
      } else {
        // 빈 접시
        this.plateVisualElements[plateIndex].setFillStyle(0x999999); // 회색
        this.plateTextElements[plateIndex].setText(''); // 텍스트 없음
      }
    }
  }

  /**
   * 손님이 나타나는 영역을 생성합니다.
   * 컨테이너를 사용하여 손님의 아바타와 주문 내용을 동적으로 표시합니다.
   */
  private createCustomerArea() {
    // 손님 영역 배경
    this.add.rectangle(600, 150, 180, 120, 0x333333, 0.8);
    this.add.text(600, 80, '손님', { fontSize: '16px', color: '#fff' }).setOrigin(0.5);

    // 손님 컨테이너 생성 (나중에 동적으로 업데이트)
    this.customerContainer = this.add.container(600, 150);
  }

  /**
   * 점수와 통계를 표시하는 UI를 생성합니다.
   * 서빙 버튼은 ButtonPanel에서 관리되므로 여기서는 제외됩니다.
   */
  private createUI() {
    // 점수 표시
    this.scoreText = this.add.text(50, 50, 'Score: 0', {
      fontSize: '18px',
      color: '#fff',
    });

    // 통계 표시
    this.statsText = this.add.text(50, 80, 'Served: 0 | Happy: 0 | Angry: 0', {
      fontSize: '14px',
      color: '#fff',
    });

    // 초기 UI 업데이트
    this.updateCustomerDisplay();
    this.updateScoreDisplay();
  }

  /**
   * 손님에게 타코야끼를 서빙하고 주문과 비교하여 점수를 계산합니다.
   * 정확한 주문 이행 여부에 따라 손님의 감정과 점수가 결정됩니다.
   * 서빙 후 잠시 뒤 새로운 손님이 등장합니다.
   */
  private handleServing() {
    const result = serveToCustomer();

    if (result.success && result.result) {
      console.log(result.message);

      // 결과 로그
      const breakdown = result.result.breakdown;
      console.log('상세 결과:', {
        마요: `${breakdown.mayo.correct}/${breakdown.mayo.requested}`,
        가츠오: `${breakdown.katsuobushi.correct}/${breakdown.katsuobushi.requested}`,
        김: `${breakdown.nori.correct}/${breakdown.nori.requested}`,
        토핑없음: `${breakdown.none.correct}/${breakdown.none.requested}`,
        소스문제: breakdown.sauceIssues,
        익힘문제: breakdown.cookingIssues,
      });

      // 피드백 애니메이션 표시
      this.showCustomerFeedback(result.result.mood, result.result.score);

      // UI 업데이트
      this.updatePlatesDisplay();
      this.updateScoreDisplay();

      // 잠시 후 새 손님 등장
      this.time.delayedCall(2000, () => {
        spawnNewCustomer();
        this.updateCustomerDisplay();
      });
    } else {
      console.log(result.message);
    }
  }

  /**
   * 서빙 후 손님의 반응을 애니메이션으로 표시합니다.
   * 감정에 따라 다른 이모지와 색상으로 피드백을 제공하고,
   * 확대/축소 애니메이션으로 시각적 효과를 추가합니다.
   *
   * @param mood - 손님의 감정 상태 ('happy' | 'neutral' | 'angry')
   * @param score - 획득한 점수
   */
  private showCustomerFeedback(mood: 'happy' | 'neutral' | 'angry', score: number) {
    if (!this.customerContainer) return;

    // 기존 손님 표시 제거
    this.customerContainer.removeAll(true);

    // 감정에 따른 이모지와 색상
    const moodData = {
      happy: { emoji: '😊', color: 0x4caf50, text: `+${score}점!` },
      neutral: { emoji: '😐', color: 0xffc107, text: `+${score}점` },
      angry: { emoji: '😠', color: 0xf44336, text: `+${score}점...` },
    };

    const data = moodData[mood];

    // 감정 표시
    const moodSprite = this.add
      .text(0, -20, data.emoji, {
        fontSize: '32px',
      })
      .setOrigin(0.5);

    // 점수 표시 (색상 수정)
    const scoreDisplay = this.add
      .text(0, 20, data.text, {
        fontSize: '14px',
      })
      .setOrigin(0.5);

    this.customerContainer.add([moodSprite, scoreDisplay]);

    // 애니메이션
    this.tweens.add({
      targets: this.customerContainer,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 300,
      yoyo: true,
      ease: 'Back.easeInOut',
    });
  }

  /**
   * 손님의 주문 내용을 말풍선 형태로 표시합니다.
   * 토핑별 개수와 요구사항을 상세히 보여주며,
   * 손님이 없을 때는 "대기 중..." 메시지를 표시합니다.
   */
  private updateCustomerDisplay() {
    if (!this.customerContainer) return;

    // 기존 내용 제거
    this.customerContainer.removeAll(true);

    if (!currentCustomer.customer) {
      // 손님이 없을 때
      const waitingText = this.add
        .text(0, 0, '대기 중...', {
          fontSize: '14px',
          color: '#888',
        })
        .setOrigin(0.5);

      this.customerContainer.add(waitingText);
      return;
    }

    const customer = currentCustomer.customer;
    const order = customer.order;

    // 손님 아바타
    const customerAvatar = this.add
      .text(0, -30, '🧑‍🍳', {
        fontSize: '24px',
      })
      .setOrigin(0.5);

    // 말풍선 크기
    const bubbleWidth = 200;
    const bubbleHeight = 100;

    const speechBubble = this.add.graphics();
    speechBubble.fillStyle(0xffffff, 0.9);

    // 말풍선 본체
    speechBubble.fillRoundedRect(-bubbleWidth / 2, 0, bubbleWidth, bubbleHeight, 10);
    speechBubble.strokeRoundedRect(-bubbleWidth / 2, 0, bubbleWidth, bubbleHeight, 10);

    // 말풍선 꼬리
    speechBubble.fillTriangle(-10, bubbleHeight, 0, bubbleHeight + 10, 10, bubbleHeight);
    speechBubble.strokeTriangle(-10, bubbleHeight, 0, bubbleHeight + 10, 10, bubbleHeight);

    // 주문 내용 텍스트 구성
    let orderLines: string[] = [`총 ${order.totalQuantity}개 (소스 필수)`];

    // 토핑별로 표시 (0개가 아닌 것만)
    if (order.toppingBreakdown.mayo > 0) {
      orderLines.push(`마요 ${order.toppingBreakdown.mayo}개`);
    }
    if (order.toppingBreakdown.katsuobushi > 0) {
      orderLines.push(`가츠오 ${order.toppingBreakdown.katsuobushi}개`);
    }
    if (order.toppingBreakdown.nori > 0) {
      orderLines.push(`김 ${order.toppingBreakdown.nori}개`);
    }
    if (order.toppingBreakdown.none > 0) {
      orderLines.push(`토핑없이 ${order.toppingBreakdown.none}개`);
    }

    const orderText = this.add
      .text(0, 15, orderLines.join('\n'), {
        fontSize: '12px',
        color: '#000',
        align: 'center',
        lineSpacing: 1,
      })
      .setOrigin(0.5, 0);

    this.customerContainer.add([customerAvatar, speechBubble, orderText]);
  }

  /**
   * 현재 점수와 게임 통계를 화면에 업데이트합니다.
   * 총 점수, 서빙한 손님 수, 만족/불만족 손님 수를 표시합니다.
   */
  private updateScoreDisplay() {
    if (this.scoreText) {
      this.scoreText.setText(`Score: ${gameScore.value}`);
    }

    if (this.statsText) {
      this.statsText.setText(
        `Served: ${gameStats.servedCustomers} | Happy: ${gameStats.happyCustomers} | Angry: ${gameStats.angryCustomers}`
      );
    }
  }

  /**
   * 철판의 모든 셀에서 타코야끼 익힘 상태를 실시간으로 업데이트하는 시스템을 시작합니다.
   * 0.1초마다 호출되어 요리 시간에 따른 색상 변화를 표시합니다.
   */
  private startRealtimeCookingUpdates() {
    this.time.addEvent({
      delay: 100, // 0.1초마다 업데이트
      callback: this.updateAllCellsCookingStates,
      callbackScope: this,
      loop: true,
    });
  }

  /**
   * 철판의 모든 셀을 순회하며 타코야끼의 익힘 상태를 계산하고 시각적으로 업데이트합니다.
   * 시간이 지남에 따라 raw → perfect → burnt 순서로 색상이 변화합니다.
   */
  private updateAllCellsCookingStates() {
    const currentTime = Date.now();

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const currentCellState = ironPanCells[row][col];
        const cellVisualIndex = row * 3 + col;
        const cellVisualElement = this.ironPanVisualCells[cellVisualIndex];

        if (currentCellState.hasBatter && !currentCellState.isMovedToPlate) {
          // 익힘 상태 계산
          const newCookingLevel = calculateCurrentCookingLevel(currentCellState, currentTime);

          // 상태가 변경되었을 때만 업데이트
          if (currentCellState.cookingLevel !== newCookingLevel) {
            currentCellState.cookingLevel = newCookingLevel;

            // 색상 업데이트
            const updatedColor = getTakoyakiColorByCookingLevel(newCookingLevel);
            cellVisualElement.setFillStyle(updatedColor);

            console.log(`[${row},${col}] 익힘 상태 변경: ${newCookingLevel}`);
          }
        }
      }
    }
  }

  /**
   * 손님 시스템을 시작하고 첫 번째 손님을 등장시킵니다.
   * 또한 손님의 인내심을 관리하는 타이머를 설정합니다.
   */
  private startCustomerSystem() {
    // 게임 시작 시 첫 손님 등장
    spawnNewCustomer();
    this.updateCustomerDisplay();

    // 주기적으로 손님 상태 업데이트 (인내심 감소 등)
    this.time.addEvent({
      delay: 1000, // 1초마다
      callback: this.updateCustomerPatience,
      callbackScope: this,
      loop: true,
    });
  }

  /**
   * 손님의 인내심을 1초마다 감소시킵니다.
   * 인내심이 0에 도달하면 손님이 화나서 떠나고 새로운 손님이 등장합니다.
   * 떠난 손님은 자동으로 불만족 통계에 추가됩니다.
   */
  private updateCustomerPatience() {
    if (currentCustomer.customer) {
      currentCustomer.customer.patience -= 1;

      // 인내심이 0이 되면 화난 상태로 떠남
      if (currentCustomer.customer.patience <= 0) {
        console.log('손님이 화나서 떠났습니다!');
        gameStats.angryCustomers++;
        currentCustomer.customer = null;

        // 새 손님 등장
        this.time.delayedCall(1000, () => {
          spawnNewCustomer();
          this.updateCustomerDisplay();
        });

        this.updateCustomerDisplay();
        this.updateScoreDisplay();
      }
    }
  }
}
