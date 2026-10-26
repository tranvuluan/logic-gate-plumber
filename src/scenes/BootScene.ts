import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../utils/Constants';
import { ProceduralGraphics } from '../graphics/ProceduralGraphics';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    // Generate all procedural textures
    const procGraphics = new ProceduralGraphics(this);
    procGraphics.generateTextures();

    // Show loading animation
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.BG_DARK, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Title
    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100, '⚡', {
      fontSize: '80px',
    });
    title.setOrigin(0.5);

    const titleText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      'LOGIC GATE\nPLUMBER',
      {
        fontSize: '42px',
        fontFamily: 'monospace',
        color: '#00ff88',
        align: 'center',
        lineSpacing: 8,
      }
    );
    titleText.setOrigin(0.5);

    const subtitle = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 + 80,
      'Digital Circuit Puzzle',
      {
        fontSize: '18px',
        fontFamily: 'monospace',
        color: '#4488aa',
      }
    );
    subtitle.setOrigin(0.5);

    // Loading dots animation
    const loadingText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 + 160,
      'Loading...',
      {
        fontSize: '16px',
        fontFamily: 'monospace',
        color: '#336688',
      }
    );
    loadingText.setOrigin(0.5);

    // Pulse animation on title
    this.tweens.add({
      targets: title,
      scale: { from: 0.8, to: 1.2 },
      alpha: { from: 0.7, to: 1 },
      duration: 800,
      yoyo: true,
      repeat: 1,
    });

    // Transition to menu after delay
    this.time.delayedCall(1600, () => {
      this.cameras.main.resetFX();
      this.scene.start('MenuScene');
    });
  }
}
