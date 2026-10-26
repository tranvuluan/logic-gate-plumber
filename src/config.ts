import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from './utils/Constants';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';
import { WinScene } from './scenes/WinScene';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: COLORS.BG_DARK,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    min: {
      width: 360,
      height: 640,
    },
    max: {
      width: 1080,
      height: 1920,
    },
  },
  scene: [BootScene, MenuScene, LevelSelectScene, GameScene, WinScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  input: {
    activePointers: 2, // Support multi-touch
  },
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: true,
  },
};
