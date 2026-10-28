import Phaser from 'phaser';
import { COLORS, FONTS } from '../utils/Constants';
import { ProceduralGraphics } from '../graphics/ProceduralGraphics';
import { crazyGames } from '../utils/CrazyGamesManager';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  async create(): Promise<void> {
    // Notify CrazyGames loading start
    crazyGames.loadingStart();

    // Generate all procedural circuit textures
    const procGraphics = new ProceduralGraphics(this);
    procGraphics.generateTextures();

    // Dynamic dimensions for portrait & landscape
    const width = this.scale.width;
    const height = this.scale.height;

    // Background
    const bg = this.add.graphics();
    procGraphics.drawBackground(bg, width, height);

    const centerY = height / 2;

    // Glowing Cyber Logo
    const icon = this.add.text(width / 2, centerY - 110, '⚡', {
      fontSize: '64px',
    });
    icon.setOrigin(0.5);

    const titleText = this.add.text(
      width / 2,
      centerY - 30,
      'LOGIC GATE PLUMBER',
      {
        fontSize: width < 800 ? '34px' : '44px',
        fontFamily: FONTS.TITLE,
        color: '#00ff9d',
        fontStyle: 'bold',
        stroke: '#003822',
        strokeThickness: 3,
      }
    );
    titleText.setOrigin(0.5);

    const subtitle = this.add.text(
      width / 2,
      centerY + 24,
      'HIGH-TECH DIGITAL CIRCUIT PUZZLE',
      {
        fontSize: width < 800 ? '15px' : '18px',
        fontFamily: FONTS.UI,
        color: '#00f0ff',
        letterSpacing: 2,
      }
    );
    subtitle.setOrigin(0.5);

    // Cyberpunk loading bar container
    const barWidth = Math.min(360, width - 80);
    const barHeight = 8;
    const barX = (width - barWidth) / 2;
    const barY = centerY + 80;

    const barBg = this.add.graphics();
    barBg.fillStyle(0x0e1f36, 1);
    barBg.lineStyle(1.5, COLORS.CYBER_CYAN, 0.7);
    barBg.fillRoundedRect(barX, barY, barWidth, barHeight, 4);
    barBg.strokeRoundedRect(barX, barY, barWidth, barHeight, 4);

    const barFill = this.add.graphics();

    const loadingLabel = this.add.text(
      width / 2,
      barY + 30,
      'INITIALIZING LOGIC ENGINE...',
      {
        fontSize: '14px',
        fontFamily: FONTS.MONO,
        color: '#7ba0c5',
      }
    );
    loadingLabel.setOrigin(0.5);

    // Pulse animation on logo
    this.tweens.add({
      targets: icon,
      scale: { from: 0.85, to: 1.15 },
      alpha: { from: 0.7, to: 1 },
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Animate progress bar fill
    const progressObj = { value: 0 };
    this.tweens.add({
      targets: progressObj,
      value: 1,
      duration: 800,
      ease: 'Cubic.easeOut',
      onUpdate: () => {
        barFill.clear();
        barFill.fillStyle(COLORS.SIGNAL_ON, 1);
        barFill.fillRoundedRect(barX + 1, barY + 1, (barWidth - 2) * progressObj.value, barHeight - 2, 3);
      },
      onComplete: async () => {
        // Initialize CrazyGames SDK v3
        await crazyGames.init();
        crazyGames.loadingStop();

        this.cameras.main.fade(300, 6, 12, 24);
        this.time.delayedCall(320, () => {
          this.scene.start('MenuScene');
        });
      },
    });
  }
}
