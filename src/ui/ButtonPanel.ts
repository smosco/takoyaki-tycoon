import Phaser from 'phaser';
import { currentSelectedTool, type Tool } from '../state/gameState';

/**
 * 게임의 모든 도구와 서빙 기능을 관리하는 버튼 패널 클래스
 * 타코야끼 제작에 필요한 도구들과 서빙 버튼을 포함합니다.
 */
export class ButtonPanel {
  private scene: Phaser.Scene;
  private toolButtonElements: Phaser.GameObjects.Image[] = [];
  private toolButtonImages: Phaser.GameObjects.Image[] = [];
  private toolButtonData: { tool: Tool; label: string; image: string }[] = []; // 도구 데이터 저장
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
    const mainToolsData: { tool: Tool; label: string; image: string }[] = [
      { tool: 'batter', label: '반죽', image: 'tool-kattle' },
      { tool: 'octopus', label: '문어', image: 'tool-octopus' },
      { tool: 'stick', label: '꼬챙이', image: 'tool-stick' },
      { tool: 'sauce', label: '소스', image: 'tool-sauce' },
    ];

    // 메인 도구들 생성 (첫 번째 줄)
    mainToolsData.forEach((toolData, buttonIndex) => {
      const toolButton = this.scene.add
        .image(startX + buttonIndex * 75, startY, 'button-disabled')
        .setScale(0.2)
        .setInteractive()
        .setDepth(6);

      const toolButtonImage = this.scene.add
        .image(startX + buttonIndex * 75, startY, toolData.image)
        .setScale(0.05)
        .setOrigin(0.5)
        .setDepth(6);

      this.toolButtonElements.push(toolButton);
      this.toolButtonImages.push(toolButtonImage);
      this.toolButtonData.push(toolData); // 도구 데이터 저장

      toolButton.on('pointerover', () => {
        this.scene.game.canvas.style.cursor = 'pointer';
      });
      toolButton.on('pointerout', () => {
        this.scene.game.canvas.style.cursor = 'default';
      });
      toolButton.on('pointerdown', () => {
        currentSelectedTool.current = toolData.tool;
        this.updateAllButtonStyles();
        console.log('선택된 도구:', toolData.tool);
      });
    });

    const serveData: { tool: Tool; label: string; image: string }[] = [
      { tool: 'serve', label: '서빙', image: 'tool-serve' },
    ];

    const serveButton = this.scene.add
      .image(startX + 7 * 75, startY, 'button-disabled')
      .setScale(0.2)
      .setInteractive()
      .setDepth(6);

    const ServeButtonImage = this.scene.add
      .image(startX + 7 * 75, startY, serveData[0].image)
      .setScale(0.05)
      .setOrigin(0.5)
      .setDepth(6);

    this.toolButtonElements.push(serveButton);
    this.toolButtonImages.push(ServeButtonImage);
    this.toolButtonData.push(serveData[0]);

    serveButton.on('pointerover', () => {
      this.scene.game.canvas.style.cursor = 'pointer';
    });
    serveButton.on('pointerout', () => {
      this.scene.game.canvas.style.cursor = 'default';
    });
    serveButton.on('pointerdown', () => {
      if (this.onServeCallback) {
        currentSelectedTool.current = serveData[0].tool;
        this.onServeCallback();
        this.updateAllButtonStyles();
        this.scene.sound.play('serve-sound');
      }
      console.log('서빙 버튼 클릭!');
    });

    // 토핑들 생성 (두 번째 줄)
    const toppingsData: { tool: Tool; label: string; image: string }[] = [
      { tool: 'negi', label: '파', image: 'topping-negi' },
      { tool: 'katsuobushi', label: '가츠오', image: 'topping-katsuo' },
      { tool: 'nori', label: '김', image: 'topping-nori' },
    ];

    toppingsData.forEach((toppingData, toppingIndex) => {
      const toppingButton = this.scene.add
        .image(startX + (4 + toppingIndex) * 75, startY, 'button')
        .setScale(0.2)
        .setInteractive()
        .setDepth(6);

      const toppingButtonImage = this.scene.add
        .image(startX + (4 + toppingIndex) * 75, startY, toppingData.image)
        .setScale(0.05)
        .setOrigin(0.5)
        .setDepth(6);

      this.toolButtonElements.push(toppingButton);
      this.toolButtonImages.push(toppingButtonImage);
      this.toolButtonData.push(toppingData); // 토핑 데이터 저장

      toppingButton.on('pointerover', () => {
        this.scene.game.canvas.style.cursor = 'pointer';
      });
      toppingButton.on('pointerout', () => {
        this.scene.game.canvas.style.cursor = 'default';
      });
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
   * 선택된 버튼은 활성화된 버튼 텍스처와 확대된 이미지로 강조되고,
   * 선택되지 않은 버튼은 비활성화된 텍스처와 기본 크기 이미지를 사용합니다.
   */
  // TODO: 버튼 스타일 업데이트 로직 개선
  private updateAllButtonStyles() {
    this.toolButtonElements.forEach((button, index) => {
      const currentTool = currentSelectedTool.current;
      const buttonToolData = this.toolButtonData[index];
      const isSelected = buttonToolData.tool === currentTool;

      // 버튼 컨테이너 스타일 업데이트
      if (isSelected) {
        button.setTexture('button');
        // this.toolButtonImages[index].setScale(0.06);
      } else {
        button.setTexture('button-disabled');
        // this.toolButtonImages[index].setScale(0.05);
      }
    });
  }
}
