import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';

new Phaser.Game({
  type: Phaser.AUTO,
  width: 600,
  height: 400,
  scene: [GameScene],
  backgroundColor: '#222',
});
