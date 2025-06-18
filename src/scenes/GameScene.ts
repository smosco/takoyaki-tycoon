import Phaser from 'phaser';
import {
  ironPanCells,
  currentSelectedTool,
  platesWithTakoyaki,
  toolToActualSauce,
  toolToActualTopping,
  getTakoyakiColorByCookingLevel,
  calculateCurrentCookingLevel,
} from '../state/gameState';
import { ButtonPanel } from '../ui/ButtonPanel';

export class GameScene extends Phaser.Scene {
  private plateVisualElements: Phaser.GameObjects.Rectangle[] = [];
  private plateTextElements: Phaser.GameObjects.Text[] = [];
  private ironPanVisualCells: Phaser.GameObjects.Rectangle[] = [];

  constructor() {
    super('GameScene');
  }

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
    new ButtonPanel(this, 150, 350);

    // 실시간 업데이트 시작
    this.startRealtimeCookingUpdates();
  }

  // 철판 격자 생성 (더 명확한 이름)
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

  // 철판 셀 클릭 처리
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
          const initialColor = getTakoyakiColorByCookingLevel('raw', false);
          cellVisualElement.setFillStyle(initialColor);

          console.log(`[${row},${col}] 반죽 추가, 요리 시작!`);
        }
        break;

      case 'octopus':
        if (currentCellState.hasBatter && !currentCellState.hasOctopus) {
          currentCellState.hasOctopus = true;
          console.log(`[${row},${col}] 문어 추가`);
          // 색상은 실시간 업데이트에서 관리됨
        }
        break;

      case 'stick':
        if (currentCellState.hasBatter && currentCellState.hasOctopus) {
          if (!currentCellState.isFlipped) {
            // 첫 번째 클릭: 뒤집기
            currentCellState.isFlipped = true;
            currentCellState.flipTime = currentTime;

            // 현재 익힘 상태 계산하여 저장
            currentCellState.cookingLevel = calculateCurrentCookingLevel(
              currentCellState,
              currentTime
            );

            const flippedColor = getTakoyakiColorByCookingLevel(
              currentCellState.cookingLevel,
              true
            );
            cellVisualElement.setFillStyle(flippedColor);

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
                flipTime: null,
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

  // 접시 영역 생성
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

  // 접시에 담긴 타코야끼 클릭 처리
  private handlePlateClick(plateIndex: number) {
    if (plateIndex >= platesWithTakoyaki.length) return; // 빈 접시면 무시

    const clickedTakoyaki = platesWithTakoyaki[plateIndex];

    switch (currentSelectedTool.current) {
      case 'sauce':
        if (!clickedTakoyaki.sauce) {
          clickedTakoyaki.sauce = toolToActualSauce['sauce'];
          console.log(`접시[${plateIndex}] 소스 추가: ${clickedTakoyaki.sauce}`);
          this.updatePlatesDisplay();
        } else {
          console.log(`접시[${plateIndex}]에 이미 소스가 있습니다: ${clickedTakoyaki.sauce}`);
        }
        break;

      case 'topping1':
        if (!clickedTakoyaki.topping) {
          clickedTakoyaki.topping = toolToActualTopping['topping1'];
          console.log(`접시[${plateIndex}] 토핑 추가: ${clickedTakoyaki.topping}`);
          this.updatePlatesDisplay();
        } else {
          console.log(`접시[${plateIndex}]에 이미 토핑이 있습니다: ${clickedTakoyaki.topping}`);
        }
        break;

      case 'topping2':
        if (!clickedTakoyaki.topping) {
          clickedTakoyaki.topping = toolToActualTopping['topping2'];
          console.log(`접시[${plateIndex}] 토핑 추가: ${clickedTakoyaki.topping}`);
          this.updatePlatesDisplay();
        } else {
          console.log(`접시[${plateIndex}]에 이미 토핑이 있습니다: ${clickedTakoyaki.topping}`);
        }
        break;

      case 'topping3':
        if (!clickedTakoyaki.topping) {
          clickedTakoyaki.topping = toolToActualTopping['topping3'];
          console.log(`접시[${plateIndex}] 토핑 추가: ${clickedTakoyaki.topping}`);
          this.updatePlatesDisplay();
        } else {
          console.log(`접시[${plateIndex}]에 이미 토핑이 있습니다: ${clickedTakoyaki.topping}`);
        }
        break;

      case 'serve':
        console.log('서빙 모드에서는 개별 접시 클릭이 아닌 서빙 버튼을 사용하세요');
        break;

      default:
        console.log(`${currentSelectedTool.current} 모드에서는 접시를 클릭할 수 없습니다`);
        break;
    }
  }

  // 접시 표시 업데이트
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

        // 디버그용 콘솔 출력 (선택사항)
        if (plateIndex === 0) {
          console.log(
            `접시[${plateIndex}] 상태 - 소스: ${currentTakoyaki.sauce}, 토핑: ${currentTakoyaki.topping}, 익힘: ${currentTakoyaki.cookingLevel}`
          );
        }
      } else {
        // 빈 접시
        this.plateVisualElements[plateIndex].setFillStyle(0x999999); // 회색
        this.plateTextElements[plateIndex].setText(''); // 텍스트 없음
      }
    }
  }

  // 실시간 익힘 상태 업데이트 시작
  private startRealtimeCookingUpdates() {
    this.time.addEvent({
      delay: 100, // 0.1초마다 업데이트
      callback: this.updateAllCellsCookingStates,
      callbackScope: this,
      loop: true,
    });
  }

  // 모든 셀의 익힘 상태 업데이트
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
            const updatedColor = getTakoyakiColorByCookingLevel(
              newCookingLevel,
              currentCellState.isFlipped
            );
            cellVisualElement.setFillStyle(updatedColor);

            console.log(`[${row},${col}] 익힘 상태 변경: ${newCookingLevel}`);
          }
        }
      }
    }
  }
}
