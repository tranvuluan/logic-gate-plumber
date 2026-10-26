import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../utils/Constants';
import { ProceduralGraphics } from '../graphics/ProceduralGraphics';
import { getLevels } from '../logic/LevelGenerator';

export class WinScene extends Phaser.Scene {
  private levelId: number = 1;

  constructor() {
    super({ key: 'WinScene' });
  }

  init(data: { levelId: number }): void {
    this.levelId = data.levelId || 1;
  }

  create(): void {
    this.cameras.main.resetFX();
    this.cameras.main.setAlpha(1);

    // Background
    const bg = this.add.graphics();
    const procGraphics = new ProceduralGraphics(this);
    procGraphics.drawBackground(bg, GAME_WIDTH, GAME_HEIGHT);

    // Success glow effect
    const glow = this.add.graphics();
    glow.fillStyle(COLORS.SUCCESS, 0.05);
    glow.fillCircle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 300);
    glow.fillStyle(COLORS.SUCCESS, 0.08);
    glow.fillCircle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 200);

    this.tweens.add({
      targets: glow,
      alpha: { from: 0.5, to: 1 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });

    // Victory icon
    const icon = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.25, '🎉', {
      fontSize: '96px',
    });
    icon.setOrigin(0.5);
    this.tweens.add({
      targets: icon,
      y: icon.y - 20,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Win text
    const winText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT * 0.4,
      'HOÀN THÀNH!',
      {
        fontSize: '40px',
        fontFamily: 'monospace',
        color: '#00ff88',
        fontStyle: 'bold',
      }
    );
    winText.setOrigin(0.5);

    // Level info
    const levelInfo = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT * 0.47,
      `Level ${this.levelId} — Tất cả LED đã sáng!`,
      {
        fontSize: '16px',
        fontFamily: 'monospace',
        color: '#88aacc',
      }
    );
    levelInfo.setOrigin(0.5);

    // LED animation
    const ledEmojis = '💡💡💡💡💡';
    const leds = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.53, ledEmojis, {
      fontSize: '28px',
    });
    leds.setOrigin(0.5);
    this.tweens.add({
      targets: leds,
      alpha: { from: 0.4, to: 1 },
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    // Buttons
    const levels = getLevels();
    const hasNextLevel = this.levelId < levels.length;
    const btnY = GAME_HEIGHT * 0.65;

    if (hasNextLevel) {
      this.createButton(
        GAME_WIDTH / 2,
        btnY,
        '▶  MÀN TIẾP THEO',
        '#00ff88',
        () => {
          this.cameras.main.resetFX();
          this.scene.start('GameScene', { levelId: this.levelId + 1 });
        }
      );
    }

    this.createButton(
      GAME_WIDTH / 2,
      btnY + 80,
      '🔄  CHƠI LẠI',
      '#00aaff',
      () => {
        this.cameras.main.resetFX();
        this.scene.start('GameScene', { levelId: this.levelId });
      }
    );

    this.createButton(
      GAME_WIDTH / 2,
      btnY + 160,
      '📋  CHỌN MÀN',
      '#8888cc',
      () => {
        this.cameras.main.resetFX();
        this.scene.start('LevelSelectScene');
      }
    );

    // Sparkle particles
    this.createSparkles();
  }

  private createButton(
    x: number,
    y: number,
    text: string,
    color: string,
    callback: () => void
  ): void {
    const btnW = 320;
    const btnH = 55;
    const g = this.add.graphics();

    g.fillStyle(COLORS.UI_BUTTON, 1);
    g.lineStyle(2, Phaser.Display.Color.HexStringToColor(color).color, 0.7);
    g.fillRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 10);
    g.strokeRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 10);

    const label = this.add.text(x, y, text, {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: color,
    });
    label.setOrigin(0.5);

    const zone = this.add.zone(x, y, btnW, btnH);
    zone.setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => {
      this.tweens.add({
        targets: [label],
        scaleX: 0.9,
        scaleY: 0.9,
        duration: 100,
        yoyo: true,
        onComplete: callback,
      });
    });
  }

  private createSparkles(): void {
    // Simple sparkle effect using tweens
    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(50, GAME_WIDTH - 50);
      const y = Phaser.Math.Between(50, GAME_HEIGHT - 50);
      const star = this.add.text(x, y, '✦', {
        fontSize: `${Phaser.Math.Between(8, 18)}px`,
        color: '#ffdd44',
      });
      star.setAlpha(0);
      this.tweens.add({
        targets: star,
        alpha: { from: 0, to: 0.7 },
        scale: { from: 0.5, to: 1.2 },
        duration: Phaser.Math.Between(800, 2000),
        delay: Phaser.Math.Between(0, 3000),
        yoyo: true,
        repeat: -1,
      });
    }
  }
}
