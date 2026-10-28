import Phaser from 'phaser';
import { COLORS, FONTS } from '../utils/Constants';
import { ProceduralGraphics } from '../graphics/ProceduralGraphics';
import { ProgressManager } from '../utils/ProgressManager';
import { i18n } from '../utils/i18n';
import { audio } from '../utils/AudioManager';
import { crazyGames } from '../utils/CrazyGamesManager';
import { OrientationManager } from '../utils/OrientationManager';

interface ChapterInfo {
  id: number;
  nameKey: 'ch1_name' | 'ch2_name' | 'ch3_name' | 'ch4_name' | 'ch5_name';
  range: [number, number];
  tag: string;
}

const CHAPTERS: ChapterInfo[] = [
  { id: 1, nameKey: 'ch1_name', range: [1, 15], tag: 'CH 1' },
  { id: 2, nameKey: 'ch2_name', range: [16, 35], tag: 'CH 2' },
  { id: 3, nameKey: 'ch3_name', range: [36, 60], tag: 'CH 3' },
  { id: 4, nameKey: 'ch4_name', range: [61, 85], tag: 'CH 4' },
  { id: 5, nameKey: 'ch5_name', range: [86, 100], tag: 'CH 5' },
];

export class LevelSelectScene extends Phaser.Scene {
  private currentChapter: number = 1;
  private tabButtons: Phaser.GameObjects.Container[] = [];
  private gridContainer!: Phaser.GameObjects.Container;
  private chapterTitleText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'LevelSelectScene' });
  }

  create(): void {
    crazyGames.gameplayStop();
    this.cameras.main.resetFX();
    this.cameras.main.setAlpha(1);

    const width = this.scale.width;
    const height = this.scale.height;
    const isPort = OrientationManager.isPortrait(this);

    const procGraphics = new ProceduralGraphics(this);
    const bg = this.add.graphics();
    procGraphics.drawBackground(bg, width, height);

    const unlockedLevel = ProgressManager.getUnlockedLevel();
    const totalStars = ProgressManager.getTotalStars();

    // Auto-select chapter of the latest unlocked level
    for (const ch of CHAPTERS) {
      if (unlockedLevel >= ch.range[0] && unlockedLevel <= ch.range[1]) {
        this.currentChapter = ch.id;
        break;
      }
    }
    audio.setChapterBGM(this.currentChapter);

    // Top Header Bar
    const headerHeight = 84;
    const headerBg = this.add.graphics();
    headerBg.fillStyle(COLORS.BG_DARK, 0.95);
    headerBg.fillRect(0, 0, width, headerHeight);
    headerBg.lineStyle(1.5, COLORS.CYBER_CYAN, 0.4);
    headerBg.lineBetween(0, headerHeight, width, headerHeight);

    // Back to Menu button
    const backBtnX = isPort ? 64 : 90;
    const backBtnW = isPort ? 96 : 130;
    const backBtnContainer = this.add.container(backBtnX, 42);
    const backBg = this.add.rectangle(0, 0, backBtnW, 36, 0x0e243c, 0.95);
    backBg.setStrokeStyle(1.5, 0x00f0ff, 0.85);
    backBg.setInteractive({ useHandCursor: true });
    const backBtnText = this.add.text(0, 0, isPort ? '◀ MENU' : i18n.t('btn_back_menu'), {
      fontSize: '14px',
      fontFamily: FONTS.TITLE,
      color: '#00f0ff',
      fontStyle: 'bold',
    });
    backBtnText.setOrigin(0.5);
    backBtnContainer.add([backBg, backBtnText]);

    backBg.on('pointerdown', () => {
      audio.playButtonClick();
      this.cameras.main.resetFX();
      this.scene.start('MenuScene');
    });

    // Scene Title
    const title = this.add.text(width / 2, 28, i18n.t('level_select_title'), {
      fontSize: isPort ? '22px' : '28px',
      fontFamily: FONTS.TITLE,
      color: '#00ff9d',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    // Stars & Total Progress
    const subheader = this.add.text(
      width / 2,
      58,
      i18n.t('progress_label', { unlocked: unlockedLevel, stars: totalStars }),
      {
        fontSize: isPort ? '13px' : '15px',
        fontFamily: FONTS.TITLE,
        color: '#ffd000',
        fontStyle: 'bold',
      }
    );
    subheader.setOrigin(0.5);

    // Endless Mode Button at Top-Right
    const endlessBtnX = isPort ? width - 65 : width - 100;
    const endlessBtnW = isPort ? 96 : 130;
    const endlessContainer = this.add.container(endlessBtnX, 42);
    const endlessBg = this.add.rectangle(0, 0, endlessBtnW, 36, 0x221338, 0.95);
    endlessBg.setStrokeStyle(1.5, 0xd946ef, 0.9);
    endlessBg.setInteractive({ useHandCursor: true });
    const endlessText = this.add.text(0, 0, isPort ? '⚡ ENDLESS' : '⚡ ENDLESS', {
      fontSize: isPort ? '12px' : '14px',
      fontFamily: FONTS.TITLE,
      color: '#f0abfc',
      fontStyle: 'bold',
    });
    endlessText.setOrigin(0.5);
    endlessContainer.add([endlessBg, endlessText]);

    endlessBg.on('pointerdown', () => {
      audio.playButtonClick();
      this.cameras.main.resetFX();
      this.scene.start('GameScene', { levelId: 101, isEndless: true });
    });

    // Chapter navigation tabs
    this.createChapterTabs(width, isPort);

    // Chapter Title
    this.chapterTitleText = this.add.text(width / 2, isPort ? 166 : 160, '', {
      fontSize: isPort ? '16px' : '20px',
      fontFamily: FONTS.TITLE,
      color: '#00f0ff',
      fontStyle: 'bold',
    });
    this.chapterTitleText.setOrigin(0.5);

    // Level Grid Container
    this.gridContainer = this.add.container(0, 0);
    this.renderChapterLevels(width, isPort);
  }

  private createChapterTabs(width: number, isPort: boolean): void {
    const tabY = 116;
    const tabW = isPort ? 126 : 210;
    const tabH = 38;
    const gap = isPort ? 8 : 12;
    const totalW = CHAPTERS.length * tabW + (CHAPTERS.length - 1) * gap;
    const startX = (width - totalW) / 2 + tabW / 2;

    this.tabButtons = [];

    CHAPTERS.forEach((ch, idx) => {
      const x = startX + idx * (tabW + gap);
      const container = this.add.container(x, tabY);

      const isCurrent = ch.id === this.currentChapter;
      const bg = this.add.graphics();
      this.drawTabBg(bg, tabW, tabH, isCurrent);

      const labelText = isPort ? ch.tag : `${ch.tag}: ${i18n.t(ch.nameKey)}`;
      const label = this.add.text(0, 0, labelText, {
        fontSize: isPort ? '13px' : '13px',
        fontFamily: FONTS.TITLE,
        color: isCurrent ? '#00ff9d' : '#88a4c2',
        fontStyle: 'bold',
      });
      label.setOrigin(0.5);

      container.add([bg, label]);

      const hitZone = this.add.zone(0, 0, tabW, tabH);
      hitZone.setInteractive({ useHandCursor: true });
      hitZone.on('pointerdown', () => {
        if (this.currentChapter === ch.id) return;
        audio.playButtonClick();
        this.currentChapter = ch.id;
        audio.setChapterBGM(ch.id);
        this.updateTabsVisual(isPort);
        this.renderChapterLevels(width, isPort);
      });

      container.add(hitZone);
      this.tabButtons.push(container);
    });
  }

  private drawTabBg(g: Phaser.GameObjects.Graphics, w: number, h: number, isSelected: boolean): void {
    g.clear();
    if (isSelected) {
      g.fillStyle(0x0e2e28, 1);
      g.lineStyle(2, COLORS.SIGNAL_ON, 1);
    } else {
      g.fillStyle(0x0c1b30, 0.85);
      g.lineStyle(1.5, 0x1a3b5c, 0.7);
    }
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 6);
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, 6);
  }

  private updateTabsVisual(isPort: boolean): void {
    const tabW = isPort ? 126 : 210;
    const tabH = 38;
    CHAPTERS.forEach((ch, idx) => {
      const container = this.tabButtons[idx];
      const isCurrent = ch.id === this.currentChapter;
      const bg = container.getAt(0) as Phaser.GameObjects.Graphics;
      const label = container.getAt(1) as Phaser.GameObjects.Text;

      this.drawTabBg(bg, tabW, tabH, isCurrent);
      label.setColor(isCurrent ? '#00ff9d' : '#88a4c2');
    });
  }

  private renderChapterLevels(width: number, isPort: boolean): void {
    this.gridContainer.removeAll(true);

    const chapter = CHAPTERS.find((c) => c.id === this.currentChapter) || CHAPTERS[0];
    this.chapterTitleText.setText(`[ ${chapter.tag} • ${i18n.t(chapter.nameKey).toUpperCase()} ]`);

    const [startLvl, endLvl] = chapter.range;
    const totalInChapter = endLvl - startLvl + 1;
    const unlockedLevel = ProgressManager.getUnlockedLevel();

    // Responsive Grid layout: 4 columns in portrait, 5 columns in landscape
    const cols = isPort ? 4 : 5;
    const cardW = isPort ? 144 : 160;
    const cardH = isPort ? 82 : 90;
    const gapX = isPort ? 14 : 28;
    const gapY = isPort ? 14 : 20;

    const gridW = cols * cardW + (cols - 1) * gapX;
    const startX = (width - gridW) / 2 + cardW / 2;
    const startY = isPort ? 210 : 240;

    for (let i = 0; i < totalInChapter; i++) {
      const lvlNum = startLvl + i;
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (cardW + gapX);
      const y = startY + row * (cardH + gapY);

      const isUnlocked = lvlNum <= unlockedLevel;
      const stars = ProgressManager.getStars(lvlNum);

      const card = this.add.container(x, y);

      const cardBg = this.add.graphics();
      if (isUnlocked) {
        cardBg.fillStyle(0x0e223c, 0.95);
        cardBg.lineStyle(2, lvlNum === unlockedLevel ? COLORS.CYBER_YELLOW : COLORS.CYBER_CYAN, 0.85);
      } else {
        cardBg.fillStyle(0x0a1422, 0.7);
        cardBg.lineStyle(1.5, 0x22364c, 0.5);
      }
      cardBg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 8);
      cardBg.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 8);

      // Level number
      const numText = this.add.text(0, -16, `LEVEL ${lvlNum}`, {
        fontSize: isPort ? '15px' : '18px',
        fontFamily: FONTS.TITLE,
        color: isUnlocked ? (lvlNum === unlockedLevel ? '#ffd000' : '#00f0ff') : '#486581',
        fontStyle: 'bold',
      });
      numText.setOrigin(0.5);

      // Stars or Lock Icon
      let statusObj: Phaser.GameObjects.Text;
      if (isUnlocked) {
        const starStr = stars >= 3 ? '⭐⭐⭐' : stars === 2 ? '⭐⭐☆' : stars === 1 ? '⭐☆☆' : '☆☆☆';
        statusObj = this.add.text(0, 16, starStr, {
          fontSize: isPort ? '16px' : '18px',
        });
      } else {
        statusObj = this.add.text(0, 16, '🔒 LOCKED', {
          fontSize: isPort ? '12px' : '13px',
          fontFamily: FONTS.TITLE,
          color: '#486581',
        });
      }
      statusObj.setOrigin(0.5);

      card.add([cardBg, numText, statusObj]);

      if (isUnlocked) {
        const zone = this.add.zone(0, 0, cardW, cardH);
        zone.setInteractive({ useHandCursor: true });

        zone.on('pointerover', () => {
          cardBg.clear();
          cardBg.fillStyle(0x133458, 1);
          cardBg.lineStyle(2.5, 0x00ffff, 1);
          cardBg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 8);
          cardBg.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 8);
        });

        zone.on('pointerout', () => {
          cardBg.clear();
          cardBg.fillStyle(0x0e223c, 0.95);
          cardBg.lineStyle(2, lvlNum === unlockedLevel ? COLORS.CYBER_YELLOW : COLORS.CYBER_CYAN, 0.85);
          cardBg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 8);
          cardBg.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 8);
        });

        zone.on('pointerdown', () => {
          audio.playButtonClick();
          this.cameras.main.resetFX();
          this.scene.start('GameScene', { levelId: lvlNum });
        });

        card.add(zone);
      }

      this.gridContainer.add(card);
    }
  }
}
