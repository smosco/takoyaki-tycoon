import Phaser from 'phaser';
import { currentSelectedTool, type Tool } from '../state/gameState';

/**
 * 게임의 모든 도구와 서빙 기능을 관리하는 버튼 패널 클래스
 * 타코야끼 제작에 필요한 도구들과 서빙 버튼을 포함합니다.
 */
export class ButtonPanel {
  private scene: Phaser.Scene;
  private toolButtonElements: Phaser.GameObjects.Image[] = [];
  private toolButtonTexts: Phaser.GameObjects.Text[] = [];
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
      // TODO: 선택됐을 때 표시
      const toolButton = this.scene.add
        .image(startX + buttonIndex * 90, startY, 'button')
        .setScale(0.25)
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

    const serveButton = this.scene.add
      .image(startX + 7 * 90, startY, 'button')
      .setScale(0.25)
      .setInteractive();

    this.scene.add
      .text(startX + 7 * 90, startY, '서빙', {
        fontSize: '14px',
        color: '#000',
      })
      .setOrigin(0.5);

    serveButton.on('pointerdown', () => {
      if (this.onServeCallback) {
        this.onServeCallback();
      }
      console.log('서빙 버튼 클릭!');
    });

    // 토핑들 생성 (두 번째 줄)
    const toppingsData: { tool: Tool; label: string; color: number }[] = [
      { tool: 'negi', label: '파', color: 0xfffacd },
      { tool: 'katsuobushi', label: '가츠오', color: 0xdeb887 },
      { tool: 'nori', label: '김', color: 0x2f4f2f },
    ];

    toppingsData.forEach((toppingData, toppingIndex) => {
      const toppingButton = this.scene.add
        .image(startX + (4 + toppingIndex) * 90, startY, 'button')
        .setScale(0.25)
        .setInteractive();

      const toppingButtonText = this.scene.add
        .text(startX + (4 + toppingIndex) * 90, startY, toppingData.label, {
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
  private updateAllButtonStyles() {}
}
