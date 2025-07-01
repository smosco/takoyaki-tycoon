/**
 * 게임 오브젝트에 커서 포인터 효과를 적용하는 유틸 함수
 */
export const setCursorPointer = (target: Phaser.GameObjects.GameObject, scene: Phaser.Scene) => {
  target.on('pointerover', () => {
    scene.game.canvas.style.cursor = 'pointer';
  });

  target.on('pointerout', () => {
    scene.game.canvas.style.cursor = 'default';
  });
};
