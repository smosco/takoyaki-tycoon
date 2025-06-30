import Phaser from 'phaser';

export class AudioManager {
  scene: Phaser.Scene;
  isMuted: boolean;
  muteButton: Phaser.GameObjects.Image | null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.isMuted = false;
    this.muteButton = null;
  }

  // 각 씬에서 호출
  createMuteButton(scene: Phaser.Scene, x = 750, y = 50) {
    this.muteButton = scene.add
      .image(x, y, this.isMuted ? 'muteBtn' : 'unmuteBtn')
      .setInteractive()
      .setScrollFactor(0)
      .on('pointerdown', () => this.toggleMute(scene), this);

    // 현재 음소거 상태 적용
    scene.sound.mute = this.isMuted;

    return this.muteButton;
  }

  toggleMute(scene: Phaser.Scene) {
    this.isMuted = !this.isMuted;
    scene.sound.mute = this.isMuted;

    // 버튼 이미지 업데이트
    if (this.muteButton) {
      this.muteButton.setTexture(this.isMuted ? 'muteBtn' : 'unmuteBtn');
    }
  }
}
