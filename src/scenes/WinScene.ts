import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../utils/Constants';
import { ProceduralGraphics } from '../graphics/ProceduralGraphics';
import { getLevels } from '../logic/LevelGenerator';
import { ProgressManager, MAX_LEVELS } from '../utils/ProgressManager';
import { i18n } from '../utils/i18n';
import { audio } from '../utils/AudioManager';

export class WinScene extends Phaser.Scene {
  private levelId: number = 1;
  private moves: number = 0;
  private parMoves: number = 5;
  private stars: number = 3;
  private isEndless: boolean = false;

  constructor() {
    super({ key: 'WinScene' });
  }

  init(data: { levelId: number; moves?: number; parMoves?: number; stars?: number; isEndless?: boolean }): void {
    this.levelId = data.levelId || 1;
    this.moves = data.moves || 0;
    this.parMoves = data.parMoves || 5;
    this.stars = data.stars || 3;
    this.isEndless = data.isEndless || false;

    if (!this.isEndless) {
      ProgressManager.saveStars(this.levelId, this.stars);
      ProgressManager.unlockNextLevel(this.levelId);
    } else {
      const streak = ProgressManager.getEndlessStreak();
      ProgressManager.saveEndlessStreak(Math.max(streak, this.levelId - 100));
    }
  }

  create(): void {
    audio.playWin();
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
    const icon = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.22, '🎉', {
      fontSize: '84px',
    });
    icon.setOrigin(0.5);
    this.tweens.add({
      targets: icon,
      y: icon.y - 15,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Win text
    const winTitle = this.isEndless
      ? i18n.t('win_endless_title', { level: this.levelId - 100 })
      : i18n.t('win_title', { level: this.levelId });
    const winText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.35, winTitle, {
      fontSize: '32px',
      fontFamily: 'monospace',
      color: '#00ff88',
      fontStyle: 'bold',
    });
    winText.setOrigin(0.5);

    // Stars rating display (Animated)
    const starStr = this.stars >= 3 ? '⭐⭐⭐' : this.stars === 2 ? '⭐⭐☆' : '⭐☆☆';
    const starsText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.42, starStr, {
      fontSize: '40px',
    });
    starsText.setOrigin(0.5);
    starsText.setScale(0);

    this.tweens.add({
      targets: starsText,
      scaleX: 1,
      scaleY: 1,
      duration: 500,
      ease: 'Back.easeOut',
    });

    // Performance info: Moves & Par
    const ratingStr = this.stars === 3 ? i18n.t('rating_3_stars') : this.stars === 2 ? i18n.t('rating_2_stars') : i18n.t('rating_1_star');
    const moveInfo = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT * 0.49,
      `${i18n.t('win_moves_stat', { moves: this.moves, max: this.parMoves + 4, par: this.parMoves })}\n${ratingStr}`,
      {
        fontSize: '15px',
        fontFamily: 'monospace',
        color: '#00f0ff',
        align: 'center',
        lineSpacing: 8,
      }
    );
    moveInfo.setOrigin(0.5);

    // Buttons
    const btnY = GAME_HEIGHT * 0.63;
    const hasNext = this.isEndless || this.levelId < MAX_LEVELS;

    if (hasNext) {
      const nextLabel = this.isEndless
        ? i18n.t('btn_next_endless')
        : i18n.t('btn_continue_next', { next: this.levelId + 1 });
      this.createButton(GAME_WIDTH / 2, btnY, nextLabel, '#00ff88', () => {
        this.cameras.main.resetFX();
        this.scene.start('GameScene', {
          levelId: this.levelId + 1,
          isEndless: this.isEndless,
        });
      });
    }

    this.createButton(GAME_WIDTH / 2, btnY + 75, i18n.t('btn_replay'), '#00aaff', () => {
      this.cameras.main.resetFX();
      this.scene.start('GameScene', {
        levelId: this.levelId,
        isEndless: this.isEndless,
      });
    });

    this.createButton(GAME_WIDTH / 2, btnY + 150, i18n.t('btn_levels_list'), '#8888cc', () => {
      this.cameras.main.resetFX();
      this.scene.start('LevelSelectScene');
    });

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
    const btnH = 52;
    const g = this.add.graphics();

    g.fillStyle(COLORS.UI_BUTTON, 1);
    g.lineStyle(2, Phaser.Display.Color.HexStringToColor(color).color, 0.7);
    g.fillRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 10);
    g.strokeRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 10);

    const label = this.add.text(x, y, text, {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: color,
      fontStyle: 'bold',
    });
    label.setOrigin(0.5);

    const zone = this.add.zone(x, y, btnW, btnH);
    zone.setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => {
      audio.playButtonClick();
      this.tweens.add({
        targets: [label],
        scaleX: 0.9,
        scaleY: 0.9,
        duration: 80,
        yoyo: true,
        onComplete: callback,
      });
    });
  }

  private createSparkles(): void {
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
