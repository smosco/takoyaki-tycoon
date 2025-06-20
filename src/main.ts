import Phaser from 'phaser';
import { StartScene } from './scenes/StartScene';
import { GameScene } from './scenes/GameScene';
import { EndScene } from './scenes/EndScene';

/**
 * Phaser 게임 설정
 * 시작 화면 → 게임 화면 → 종료 화면 순서로 씬이 전환됩니다.
 */
const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#2d2d2d',
  scene: [GameScene, EndScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: {
      width: 400,
      height: 300,
    },
    max: {
      width: 1200,
      height: 900,
    },
  },
  render: {
    antialias: true,
    pixelArt: false,
  },
};

/**
 * 게임 인스턴스를 생성하고 시작합니다.
 */
export function createGame(): Phaser.Game {
  return new Phaser.Game(gameConfig);
}

// 게임 즉시 시작 (개발용)
// 실제 프로덕션에서는 필요에 따라 제거하거나 조건부로 실행
const game = createGame();

export default game;
