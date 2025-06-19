import Phaser from 'phaser';
import { currentSelectedTool, type Tool } from '../state/gameState';

/**
 * 게임의 모든 도구와 서빙 기능을 관리하는 버튼 패널 클래스
 * 타코야끼 제작에 필요한 도구들과 서빙 버튼을 포함합니다.
 */
export class ButtonPanel {
  private scene: Phaser.Scene;
  private toolButtonElements: Phaser.GameObjects.Rectangle[] = [];
  private toolButtonTexts: Phaser.GameObjects.Text[] = [];
  private serveButton: Phaser.GameObjects.Rectangle | null = null;
  private onServeCallback: (() => void) | null = null;

  /**
   * ButtonPanel 생성자
   * @param onServeCallback - 서빙 버튼 클릭 시 호출될 콜백 함수
   */
  constructor(scene: Phaser.Scene, startX: number, startY: number, onServeCallback?: () => void) {
    this.scene = scene;
    this.onServeCallback = onServeCallback || null;
    this.createAllToolButtons(startX, startY);
  }

  /**
   * 모든 버튼들을 생성하고 배치합니다.
   * 첫 번째 줄: 메인 도구들 + 서빙 버튼
   * 두 번째 줄: 토핑들
   */
  private createAllToolButtons(startX: number, startY: number) {
    const mainToolsData: { tool: Tool; label: string; color: number }[] = [
      { tool: 'batter', label: '반죽', color: 0xffd700 },
      { tool: 'octopus', label: '문어', color: 0xff8c00 },
      { tool: 'stick', label: '꼬챙이', color: 0x8b4513 },
      { tool: 'sauce', label: '소스', color: 0xdc143c },
    ];

    // 메인 도구들 생성 (첫 번째 줄)
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

    // 서빙 버튼 (소스 옆에 배치 - 첫 번째 줄)
    this.serveButton = this.scene.add
      .rectangle(startX + 4 * 90, startY, 80, 40, 0x4caf50)
      .setInteractive();

    this.scene.add
      .text(startX + 4 * 90, startY, '서빙', {
        fontSize: '14px',
        color: '#fff',
      })
      .setOrigin(0.5);

    this.serveButton.on('pointerdown', () => {
      if (this.onServeCallback) {
        this.onServeCallback();
      }
      console.log('서빙 버튼 클릭!');
    });

    // 토핑들 생성 (두 번째 줄)
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

  /**
   * 현재 선택된 도구에 따라 모든 버튼의 스타일을 업데이트합니다.
   * 선택된 버튼은 검은색 두꺼운 테두리로 강조되고,
   * 서빙 버튼은 별도의 고유 스타일을 유지합니다.
   */
  private updateAllButtonStyles() {
    // 선택 가능한 모든 도구들 (서빙 버튼 제외)
    const allAvailableTools: Tool[] = [
      'batter',
      'octopus',
      'stick',
      'sauce',
      'mayo',
      'katsuobushi',
      'nori',
    ];

    // 도구 버튼들의 스타일 업데이트
    this.toolButtonElements.forEach((buttonElement, buttonIndex) => {
      if (allAvailableTools[buttonIndex] === currentSelectedTool.current) {
        buttonElement.setStrokeStyle(3, 0x000000); // 선택된 버튼 강조
      } else {
        buttonElement.setStrokeStyle(1, 0x666666); // 선택되지 않은 버튼
      }
    });

    // 서빙 버튼은 항상 같은 스타일 유지 (선택 상태와 무관)
    if (this.serveButton) {
      this.serveButton.setStrokeStyle(2, 0x2e7d32); // 서빙 버튼 고유 스타일
    }
  }
}
