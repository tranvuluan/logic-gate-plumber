import Phaser from 'phaser';
import { gameConfig } from './config';
import { OrientationManager } from './utils/OrientationManager';

// Prevent context menu on long press (mobile)
window.addEventListener('contextmenu', (e) => e.preventDefault());

// Create the game instance
const game = new Phaser.Game(gameConfig);

// Handle dynamic orientation and resize changes
window.addEventListener('resize', () => {
  OrientationManager.handleWindowResize(game);
});

if (typeof window !== 'undefined' && 'screen' in window && window.screen.orientation) {
  window.screen.orientation.addEventListener('change', () => {
    OrientationManager.handleWindowResize(game);
  });
}

export default game;
