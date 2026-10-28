import Phaser from 'phaser';
import {
  LANDSCAPE_WIDTH,
  LANDSCAPE_HEIGHT,
  PORTRAIT_WIDTH,
  PORTRAIT_HEIGHT,
  COLORS,
} from './utils/Constants';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';
import { WinScene } from './scenes/WinScene';

const isInitialPortrait =
  typeof window !== 'undefined' && window.innerHeight > window.innerWidth;
const initialWidth = isInitialPortrait ? PORTRAIT_WIDTH : LANDSCAPE_WIDTH;
const initialHeight = isInitialPortrait ? PORTRAIT_HEIGHT : LANDSCAPE_HEIGHT;

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: COLORS.BG_DARK,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: initialWidth,
    height: initialHeight,
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
    activePointers: 2,
  },
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: true,
  },
};
