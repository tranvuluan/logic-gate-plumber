import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../utils/Constants';
import { ProceduralGraphics } from '../graphics/ProceduralGraphics';
import { getLevels, generateEndlessLevel } from '../logic/LevelGenerator';
import { ProgressManager, MAX_LEVELS } from '../utils/ProgressManager';
import { i18n } from '../utils/i18n';

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
  private scrollContainer!: Phaser.GameObjects.Container;
  private scrollY: number = 0;
  private maxScrollY: number = 0;
  private tabButtons: Phaser.GameObjects.Container[] = [];
  private chapterTitleText!: Phaser.GameObjects.Text;
  private chapterDescText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'LevelSelectScene' });
  }

  create(): void {
    this.cameras.main.resetFX();
    this.cameras.main.setAlpha(1);

    const procGraphics = new ProceduralGraphics(this);
    const bg = this.add.graphics();
    procGraphics.drawBackground(bg, GAME_WIDTH, GAME_HEIGHT);

    const unlockedLevel = ProgressManager.getUnlockedLevel();
    const totalStars = ProgressManager.getTotalStars();

    // Auto-select chapter of the latest unlocked level
    for (const ch of CHAPTERS) {
      if (unlockedLevel >= ch.range[0] && unlockedLevel <= ch.range[1]) {
        this.currentChapter = ch.id;
        break;
      }
    }

    // Top Header Bar
    const headerBg = this.add.graphics();
    headerBg.fillStyle(COLORS.BG_DARK, 0.95);
    headerBg.fillRect(0, 0, GAME_WIDTH, 140);
    headerBg.lineStyle(1.5, COLORS.CYBER_CYAN, 0.4);
    headerBg.lineBetween(0, 140, GAME_WIDTH, 140);

    // Back to Menu button
    const backBtn = this.add.text(30, 36, i18n.t('btn_back_menu'), {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#00f0ff',
      fontStyle: 'bold',
    });
    backBtn.setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => {
      this.cameras.main.resetFX();
      this.scene.start('MenuScene');
    });

    // Title
    const title = this.add.text(GAME_WIDTH / 2, 28, i18n.t('level_select_title'), {
      fontSize: '24px',
      fontFamily: 'monospace',
      color: '#00ff88',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    // Stars & Total Progress
    const subheader = this.add.text(
      GAME_WIDTH / 2,
      56,
      i18n.t('progress_label', { unlocked: unlockedLevel, stars: totalStars }),
      {
        fontSize: '13px',
        fontFamily: 'monospace',
        color: '#ffd000',
        fontStyle: 'bold',
      }
    );
    subheader.setOrigin(0.5);

    // Chapter navigation tabs
    this.createChapterTabs();

    // Chapter Header Info
    this.chapterTitleText = this.add.text(GAME_WIDTH / 2, 160, '', {
      fontSize: '17px',
      fontFamily: 'monospace',
      color: '#00ff88',
      fontStyle: 'bold',
    });
    this.chapterTitleText.setOrigin(0.5);

    this.chapterDescText = this.add.text(GAME_WIDTH / 2, 185, '', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#88aacc',
    });
    this.chapterDescText.setOrigin(0.5);

    // Scrollable cards container
    this.scrollContainer = this.add.container(0, 215);

    // Setup Touch / Mouse Drag Scrolling
    this.setupScrollInteractions();

    // Render cards for the currently selected chapter
    this.renderChapterCards();

    // Bottom Action Bar: Reset Progress & Endless Mode
    this.createBottomActionBar();
  }

  private createChapterTabs(): void {
    const tabY = 105;
    const tabWidth = 98;
    const tabHeight = 36;
    const gap = 12;
    const totalWidth = 6 * tabWidth + 5 * gap; // 5 chapters + 1 endless
    const startX = (GAME_WIDTH - totalWidth) / 2 + tabWidth / 2;

    this.tabButtons = [];

    // 5 Chapters
    for (let i = 0; i < CHAPTERS.length; i++) {
      const ch = CHAPTERS[i];
      const x = startX + i * (tabWidth + gap);
      const tab = this.createTabButton(x, tabY, tabWidth, tabHeight, ch.tag, ch.id);
      this.tabButtons.push(tab);
    }

    // Endless Mode Tab (Special 6th Tab)
    const isVi = i18n.getLanguage() === 'vi';
    const endlessX = startX + 5 * (tabWidth + gap);
    const endlessTab = this.createTabButton(endlessX, tabY, tabWidth, tabHeight, isVi ? 'VÔ TẬN' : 'ENDLESS', 6);
    this.tabButtons.push(endlessTab);
  }

  private createTabButton(
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    chapterId: number
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const g = this.add.graphics();
    const isActive = this.currentChapter === chapterId;

    const btnBg = isActive ? 0x00ff88 : 0x112740;
    const borderColor = isActive ? 0x00ffaa : 0x00a8cc;

    g.fillStyle(btnBg, isActive ? 0.95 : 0.7);
    g.lineStyle(1.5, borderColor, 0.9);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 6);
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, 6);

    const txt = this.add.text(0, 0, label, {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: isActive ? '#05111f' : '#00f0ff',
      fontStyle: 'bold',
    });
    txt.setOrigin(0.5);

    container.add([g, txt]);

    const zone = this.add.zone(0, 0, w, h);
    zone.setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => {
      if (this.currentChapter !== chapterId) {
        this.currentChapter = chapterId;
        this.scrollY = 0;
        this.scrollContainer.y = 215;
        this.updateTabStyles();
        this.renderChapterCards();
      }
    });
    container.add(zone);

    return container;
  }

  private updateTabStyles(): void {
    const tabWidth = 98;
    const tabHeight = 36;

    for (let i = 0; i < this.tabButtons.length; i++) {
      const container = this.tabButtons[i];
      const g = container.list[0] as Phaser.GameObjects.Graphics;
      const txt = container.list[1] as Phaser.GameObjects.Text;
      const chapterId = i === 5 ? 6 : CHAPTERS[i].id;
      const isActive = this.currentChapter === chapterId;

      g.clear();
      const btnBg = isActive ? 0x00ff88 : 0x112740;
      const borderColor = isActive ? 0x00ffaa : 0x00a8cc;

      g.fillStyle(btnBg, isActive ? 0.95 : 0.7);
      g.lineStyle(1.5, borderColor, 0.9);
      g.fillRoundedRect(-tabWidth / 2, -tabHeight / 2, tabWidth, tabHeight, 6);
      g.strokeRoundedRect(-tabWidth / 2, -tabHeight / 2, tabWidth, tabHeight, 6);

      txt.setColor(isActive ? '#05111f' : '#00f0ff');
    }
  }

  private renderChapterCards(): void {
    this.scrollContainer.removeAll(true);

    if (this.currentChapter === 6) {
      // Endless Mode Screen
      const isVi = i18n.getLanguage() === 'vi';
      this.chapterTitleText.setText(isVi ? '🌌 CHẾ ĐỘ VÔ TẬN (ENDLESS MODE)' : '🌌 ENDLESS MODE');
      this.chapterDescText.setText(isVi ? 'Các siêu vi mạch ngẫu nhiên vô hạn. Kiểm tra bản lĩnh công trình sư!' : 'Infinite procedural circuits. Test your engineering mastery!');
      this.renderEndlessMode();
      return;
    }

    const ch = CHAPTERS.find((c) => c.id === this.currentChapter)!;
    const isVi = i18n.getLanguage() === 'vi';
    const chName = i18n.t(ch.nameKey);
    const chLabel = isVi ? `CHƯƠNG ${ch.id}` : `CHAPTER ${ch.id}`;
    const rangeLabel = isVi ? `Màn ${ch.range[0]} – Màn ${ch.range[1]}` : `Level ${ch.range[0]} – Level ${ch.range[1]}`;
    this.chapterTitleText.setText(`${chLabel}: ${chName.toUpperCase()}`);
    this.chapterDescText.setText(`${rangeLabel} • ${isVi ? 'Lưới mở rộng' : 'Expanding Grid'}`);

    const levels = getLevels().filter((l) => l.id >= ch.range[0] && l.id <= ch.range[1]);
    const unlockedLevel = ProgressManager.getUnlockedLevel();

    const cols = 4;
    const cardWidth = 146;
    const cardHeight = 142;
    const gapX = 18;
    const gapY = 18;

    const totalGridWidth = cols * cardWidth + (cols - 1) * gapX;
    const startX = (GAME_WIDTH - totalGridWidth) / 2 + cardWidth / 2;
    const startY = cardHeight / 2;

    levels.forEach((level, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = startX + col * (cardWidth + gapX);
      const y = startY + row * (cardHeight + gapY);

      const isUnlocked = level.id <= unlockedLevel;
      const isCurrent = level.id === unlockedLevel;
      const stars = ProgressManager.getStars(level.id);

      const card = this.createLevelCard(
        x,
        y,
        cardWidth,
        cardHeight,
        level.id,
        i18n.translateLevelName(level.id, level.name),
        i18n.translateLevelSubtitle(level.id, level.subtitle),
        isUnlocked,
        isCurrent,
        stars
      );
      this.scrollContainer.add(card);
    });

    const totalRows = Math.ceil(levels.length / cols);
    const contentHeight = totalRows * (cardHeight + gapY);
    const viewportHeight = GAME_HEIGHT - 215 - 70;
    this.maxScrollY = Math.max(0, contentHeight - viewportHeight);
  }

  private renderEndlessMode(): void {
    const streak = ProgressManager.getEndlessStreak();
    const isVi = i18n.getLanguage() === 'vi';

    const card = this.add.container(GAME_WIDTH / 2, 140);
    const g = this.add.graphics();
    const w = 480;
    const h = 260;

    g.fillStyle(0x0e223a, 0.95);
    g.lineStyle(2.5, COLORS.CYBER_PURPLE, 0.9);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, 14);

    const icon = this.add.text(0, -60, '🌌', { fontSize: '48px' });
    icon.setOrigin(0.5);

    const title = this.add.text(0, -5, isVi ? 'KHỞI CHẠY SIÊU MẠCH VÔ TẬN' : 'LAUNCH ENDLESS CIRCUIT', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#00f0ff',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    const score = this.add.text(0, 25, isVi ? `KỶ LỤC CHUỖI THẮNG: ${streak} MÀN LIÊN TIẾP` : `WIN STREAK RECORD: ${streak} LEVELS`, {
      fontSize: '13px',
      fontFamily: 'monospace',
      color: '#ffd000',
      fontStyle: 'bold',
    });
    score.setOrigin(0.5);

    // Play Endless Button
    const playBtn = this.add.container(0, 75);
    const bgBtn = this.add.graphics();
    bgBtn.fillStyle(0x00ff88, 1);
    bgBtn.fillRoundedRect(-140, -22, 280, 44, 8);
    const playTxt = this.add.text(0, 0, isVi ? '▶ BẮT ĐẦU CHƠI' : '▶ START GAME', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#05111f',
      fontStyle: 'bold',
    });
    playTxt.setOrigin(0.5);
    playBtn.add([bgBtn, playTxt]);

    const zone = this.add.zone(0, 0, 280, 44);
    zone.setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => {
      this.cameras.main.resetFX();
      this.scene.start('GameScene', { levelId: 101, isEndless: true });
    });
    playBtn.add(zone);

    card.add([g, icon, title, score, playBtn]);
    this.scrollContainer.add(card);
    this.maxScrollY = 0;
  }

  private createLevelCard(
    x: number,
    y: number,
    w: number,
    h: number,
    levelId: number,
    levelName: string,
    subtitle: string,
    isUnlocked: boolean,
    isCurrent: boolean,
    stars: number
  ): Phaser.GameObjects.Container {
    const cardContainer = this.add.container(x, y);
    const g = this.add.graphics();
    const circleY = -h / 2 + 36;
    const numStr = levelId < 10 ? `0${levelId}` : `${levelId}`;

    if (isUnlocked) {
      const borderColor = isCurrent ? 0x00ff88 : 0x00a8cc;
      const bgColor = isCurrent ? 0x122b49 : 0x0e223a;

      g.fillStyle(bgColor, 0.95);
      g.lineStyle(isCurrent ? 2.5 : 2, borderColor, 0.85);
      g.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
      g.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);

      g.fillStyle(isCurrent ? 0x00ff88 : 0x00f0ff, 0.18);
      g.fillCircle(0, circleY, 20);
      g.lineStyle(2, isCurrent ? 0x00ff88 : 0x00f0ff, 0.9);
      g.strokeCircle(0, circleY, 20);

      const numText = this.add.text(0, circleY, numStr, {
        fontSize: '17px',
        fontFamily: 'monospace',
        color: isCurrent ? '#00ff88' : '#ffffff',
        fontStyle: 'bold',
      });
      numText.setOrigin(0.5);

      const nameText = this.add.text(0, 10, levelName.split(':')[1]?.trim() || levelName, {
        fontSize: '11px',
        fontFamily: 'monospace',
        color: '#00f0ff',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: w - 16 },
      });
      nameText.setOrigin(0.5);

      // Star rating display
      const starStr = stars >= 3 ? '⭐⭐⭐' : stars === 2 ? '⭐⭐☆' : stars === 1 ? '⭐☆☆' : '☆☆☆';
      const starText = this.add.text(0, h / 2 - 16, starStr, {
        fontSize: '13px',
      });
      starText.setOrigin(0.5);

      cardContainer.add([g, numText, nameText, starText]);

      const hitZone = this.add.zone(0, 0, w, h);
      hitZone.setInteractive({ useHandCursor: true });
      hitZone.on('pointerdown', () => {
        this.cameras.main.resetFX();
        this.scene.start('GameScene', { levelId });
      });
      cardContainer.add(hitZone);
    } else {
      // Locked level card
      g.fillStyle(0x0a1626, 0.75);
      g.lineStyle(1.5, 0x1f344d, 0.8);
      g.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
      g.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);

      g.fillStyle(0x132333, 1);
      g.fillCircle(0, circleY, 18);

      const lockIcon = this.add.text(0, circleY, '🔒', { fontSize: '16px' });
      lockIcon.setOrigin(0.5);

      const isVi = i18n.getLanguage() === 'vi';
      const lockText = this.add.text(0, 14, isVi ? `MÀN ${numStr}\nCHƯA MỞ` : `LVL ${numStr}\nLOCKED`, {
        fontSize: '10px',
        fontFamily: 'monospace',
        color: '#4a627a',
        align: 'center',
      });
      lockText.setOrigin(0.5);

      cardContainer.add([g, lockIcon, lockText]);
    }

    return cardContainer;
  }

  private setupScrollInteractions(): void {
    let startPointerY = 0;
    let isDragging = false;

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.y > 200 && pointer.y < GAME_HEIGHT - 60) {
        startPointerY = pointer.y;
        isDragging = true;
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (isDragging && this.maxScrollY > 0) {
        const delta = pointer.y - startPointerY;
        startPointerY = pointer.y;

        this.scrollY -= delta;
        this.scrollY = Phaser.Math.Clamp(this.scrollY, 0, this.maxScrollY);
        this.scrollContainer.y = 215 - this.scrollY;
      }
    });

    this.input.on('pointerup', () => {
      isDragging = false;
    });

    // Mouse wheel support for Desktop
    this.input.on('wheel', (_pointer: any, _gameObjects: any, _deltaX: number, deltaY: number) => {
      if (this.maxScrollY > 0) {
        this.scrollY += deltaY * 0.6;
        this.scrollY = Phaser.Math.Clamp(this.scrollY, 0, this.maxScrollY);
        this.scrollContainer.y = 215 - this.scrollY;
      }
    });
  }

  private createBottomActionBar(): void {
    const bottomBar = this.add.graphics();
    bottomBar.fillStyle(COLORS.BG_DARK, 0.95);
    bottomBar.fillRect(0, GAME_HEIGHT - 55, GAME_WIDTH, 55);
    bottomBar.lineStyle(1.5, COLORS.CYBER_CYAN, 0.4);
    bottomBar.lineBetween(0, GAME_HEIGHT - 55, GAME_WIDTH, GAME_HEIGHT - 55);
    bottomBar.setDepth(100);

    const isVi = i18n.getLanguage() === 'vi';
    const resetBtn = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT - 28,
      isVi ? '🔄 ĐẶT LẠI TIẾN TRÌNH VỀ MÀN 1' : '🔄 RESET PROGRESS TO LEVEL 1',
      {
        fontSize: '12px',
        fontFamily: 'monospace',
        color: '#ff4466',
        fontStyle: 'bold',
      }
    );
    resetBtn.setOrigin(0.5);
    resetBtn.setDepth(101);
    resetBtn.setInteractive({ useHandCursor: true });
    resetBtn.on('pointerdown', () => {
      const msg = isVi
        ? 'Bạn có chắc chắn muốn khóa lại toàn bộ các màn và chơi lại từ Màn 1?'
        : 'Are you sure you want to lock all levels and restart from Level 1?';
      if (confirm(msg)) {
        ProgressManager.resetProgress();
        this.cameras.main.resetFX();
        this.scene.restart();
      }
    });
  }
}
