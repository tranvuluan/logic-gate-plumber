import Phaser from 'phaser';
import { gameConfig } from './config';

// Prevent context menu on long press (mobile)
window.addEventListener('contextmenu', (e) => e.preventDefault());

// Create the game instance
const game = new Phaser.Game(gameConfig);

// Handle resize
window.addEventListener('resize', () => {
  game.scale.refresh();
});

export default game;
