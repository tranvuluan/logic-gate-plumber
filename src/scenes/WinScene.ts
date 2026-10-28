import Phaser from 'phaser';
import { COLORS, FONTS } from '../utils/Constants';
import { ProceduralGraphics } from '../graphics/ProceduralGraphics';
import { ProgressManager } from '../utils/ProgressManager';
import { i18n } from '../utils/i18n';
import { audio } from '../utils/AudioManager';
import { crazyGames } from '../utils/CrazyGamesManager';
import { OrientationManager } from '../utils/OrientationManager';

export class WinScene extends Phaser.Scene {
  private levelId: number = 1;
  private moves: number = 0;
  private parMoves: number = 5;
  private stars: number = 3;
  private isEndless: boolean = false;
  private hasTransitioned: boolean = false;

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
    // Notify CrazyGames HappyTime
    crazyGames.happytime();
    audio.playWin();

    this.cameras.main.resetFX();
    this.cameras.main.setAlpha(1);

    const width = this.scale.width;
    const height = this.scale.height;
    const isPort = OrientationManager.isPortrait(this);

    // Background
    const bg = this.add.graphics();
    const procGraphics = new ProceduralGraphics(this);
    procGraphics.drawBackground(bg, width, height);

    // Glowing victory aura
    const glow = this.add.graphics();
    glow.fillStyle(COLORS.SIGNAL_ON, 0.08);
    glow.fillCircle(width / 2, height / 2, 280);
    glow.fillStyle(COLORS.SIGNAL_ON, 0.12);
    glow.fillCircle(width / 2, height / 2, 180);

    this.tweens.add({
      targets: glow,
      alpha: { from: 0.5, to: 1 },
      duration: 900,
      yoyo: true,
      repeat: -1,
    });

    // Modal Card
    const cardW = isPort ? Math.min(640, width - 36) : 600;
    const cardH = isPort ? 560 : 460;
    const cardX = (width - cardW) / 2;
    const cardY = (height - cardH) / 2;

    const card = this.add.graphics();
    card.fillStyle(0x0c1b30, 0.96);
    card.lineStyle(2.5, COLORS.SIGNAL_ON, 0.95);
    card.fillRoundedRect(cardX, cardY, cardW, cardH, 16);
    card.strokeRoundedRect(cardX, cardY, cardW, cardH, 16);

    // Inner highlight border
    card.lineStyle(1, 0x00ff9d, 0.3);
    card.strokeRoundedRect(cardX + 6, cardY + 6, cardW - 12, cardH - 12, 12);

    // Victory Icon
    const icon = this.add.text(width / 2, cardY + 54, '⚡', {
      fontSize: '48px',
    });
    icon.setOrigin(0.5);

    // Title
    const titleStr = this.isEndless
      ? i18n.t('win_endless_title', { level: this.levelId - 100 })
      : i18n.t('win_title', { level: this.levelId });

    const titleText = this.add.text(width / 2, cardY + 112, titleStr, {
      fontSize: isPort ? '24px' : '28px',
      fontFamily: FONTS.TITLE,
      color: '#00ff9d',
      fontStyle: 'bold',
    });
    titleText.setOrigin(0.5);

    // Stars rating with bounce animation
    const starStr = this.stars >= 3 ? '⭐⭐⭐' : this.stars === 2 ? '⭐⭐☆' : '⭐☆☆';
    const starsText = this.add.text(width / 2, cardY + 175, starStr, {
      fontSize: '46px',
    });
    starsText.setOrigin(0.5);
    starsText.setScale(0);

    this.tweens.add({
      targets: starsText,
      scaleX: 1,
      scaleY: 1,
      duration: 600,
      ease: 'Back.easeOut',
    });

    // Rating Label
    const ratingLabel =
      this.stars >= 3
        ? i18n.t('rating_3_stars')
        : this.stars === 2
        ? i18n.t('rating_2_stars')
        : i18n.t('rating_1_star');

    const ratingText = this.add.text(width / 2, cardY + 232, ratingLabel, {
      fontSize: '17px',
      fontFamily: FONTS.TITLE,
      color: '#ffd000',
      fontStyle: 'bold',
    });
    ratingText.setOrigin(0.5);

    // Moves Stats
    const movesDesc = i18n.t('win_moves_stat', {
      moves: this.moves,
      max: this.parMoves + 4,
      par: this.parMoves,
    });
    const movesText = this.add.text(width / 2, cardY + 266, movesDesc, {
      fontSize: '15px',
      fontFamily: FONTS.UI,
      color: '#a0c4e8',
    });
    movesText.setOrigin(0.5);

    this.hasTransitioned = false;

    // Buttons Container
    const btnY = cardY + (isPort ? 350 : 326);
    const nextLevelId = this.levelId + 1;

    // Navigation callbacks
    const onNextLevel = () => {
      if (this.hasTransitioned) return;
      this.hasTransitioned = true;
      audio.playButtonClick();
      this.cameras.main.resetFX();
      this.scene.start('GameScene', {
        levelId: nextLevelId,
        isEndless: this.isEndless || nextLevelId > 100,
      });
    };

    const onReplay = () => {
      if (this.hasTransitioned) return;
      this.hasTransitioned = true;
      audio.playButtonClick();
      this.cameras.main.resetFX();
      this.scene.start('GameScene', {
        levelId: this.levelId,
        isEndless: this.isEndless,
      });
    };

    const onLevelSelect = () => {
      if (this.hasTransitioned) return;
      this.hasTransitioned = true;
      audio.playButtonClick();
      this.cameras.main.resetFX();
      this.scene.start('LevelSelectScene');
    };

    // 1. Next Level Button (Primary) with ENTER badge
    const baseNextText = this.isEndless
      ? i18n.t('btn_next_endless')
      : i18n.t('btn_continue_next', { next: nextLevelId });
    const nextBtnText = `${baseNextText}  [ENTER ↵]`;

    this.createModalButton(
      width / 2,
      btnY,
      Math.min(360, cardW - 40),
      48,
      nextBtnText,
      true,
      onNextLevel
    );

    // 2. Replay Button
    const secBtnW = isPort ? 140 : 170;
    this.createModalButton(
      width / 2 - (secBtnW / 2 + 10),
      btnY + 62,
      secBtnW,
      38,
      `🔄 ${i18n.t('btn_replay')} [R]`,
      false,
      onReplay
    );

    // 3. Level Select Button
    this.createModalButton(
      width / 2 + (secBtnW / 2 + 10),
      btnY + 62,
      secBtnW,
      38,
      `📋 ${i18n.t('btn_levels_list')} [ESC]`,
      false,
      onLevelSelect
    );

    // Bottom Keyboard Helper Hint
    const isVi = i18n.getLanguage() === 'vi';
    const hintStr = isVi
      ? '⌨️ Nhấn phím ENTER hoặc SPACE để qua màn'
      : '⌨️ Press ENTER or SPACE to continue to next level';
    const hintText = this.add.text(width / 2, cardY + cardH - 18, hintStr, {
      fontSize: '12px',
      fontFamily: FONTS.TITLE,
      color: '#6086aa',
      letterSpacing: 0.5,
    });
    hintText.setOrigin(0.5);

    this.tweens.add({
      targets: hintText,
      alpha: { from: 0.5, to: 1 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // Keyboard Shortcuts: ENTER, SPACE, R, ESC
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-ENTER', onNextLevel);
      this.input.keyboard.on('keydown-SPACE', onNextLevel);
      this.input.keyboard.on('keydown-R', onReplay);
      this.input.keyboard.on('keydown-ESC', onLevelSelect);
    }

    this.events.once('shutdown', () => {
      if (this.input.keyboard) {
        this.input.keyboard.removeAllListeners();
      }
    });

    // Celebratory spark particles
    this.createSparkShower(width);
  }

  private createModalButton(
    x: number,
    y: number,
    w: number,
    h: number,
    text: string,
    isPrimary: boolean,
    callback: () => void
  ): void {
    const bg = this.add.graphics();
    const strokeCol = isPrimary ? COLORS.SIGNAL_ON : COLORS.CYBER_CYAN;
    bg.fillStyle(isPrimary ? 0x0c3325 : COLORS.UI_BUTTON, 1);
    bg.lineStyle(2, strokeCol, 0.9);
    bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 8);
    bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 8);

    const label = this.add.text(x, y, text, {
      fontSize: isPrimary ? '15px' : '13px',
      fontFamily: FONTS.TITLE,
      color: isPrimary ? '#00ff9d' : '#00f0ff',
      fontStyle: 'bold',
    });
    label.setOrigin(0.5);

    const hit = this.add.zone(x, y, w, h);
    hit.setInteractive({ useHandCursor: true });

    hit.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(isPrimary ? 0x114d36 : COLORS.UI_BUTTON_HOVER, 1);
      bg.lineStyle(2.5, isPrimary ? 0x00ffcc : 0x00ffff, 1);
      bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 8);
      bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 8);
    });

    hit.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(isPrimary ? 0x0c3325 : COLORS.UI_BUTTON, 1);
      bg.lineStyle(2, strokeCol, 0.9);
      bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 8);
      bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 8);
    });

    hit.on('pointerdown', () => {
      audio.playButtonClick();
      callback();
    });
  }

  private createSparkShower(width: number): void {
    for (let i = 0; i < 24; i++) {
      const spark = this.add.circle(
        Phaser.Math.Between(width / 2 - 220, width / 2 + 220),
        Phaser.Math.Between(180, 500),
        Phaser.Math.Between(2, 4),
        i % 2 === 0 ? COLORS.SIGNAL_ON : COLORS.CYBER_CYAN,
        1
      );

      this.tweens.add({
        targets: spark,
        y: spark.y - Phaser.Math.Between(40, 100),
        x: spark.x + Phaser.Math.Between(-30, 30),
        alpha: { from: 1, to: 0 },
        scale: { from: 1, to: 0.2 },
        duration: Phaser.Math.Between(800, 1500),
        delay: Phaser.Math.Between(0, 400),
        onComplete: () => spark.destroy(),
      });
    }
  }
}
