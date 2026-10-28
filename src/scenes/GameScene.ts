import Phaser from 'phaser';
import {
  CELL_SIZE,
  COLORS,
  FONTS,
  GateType,
  Direction,
  GateDefinition,
  ANIM,
  TestCase,
} from '../utils/Constants';
import { ProceduralGraphics } from '../graphics/ProceduralGraphics';
import { SignalEngine, CellState, ShortCircuitEdge } from '../logic/SignalEngine';
import { getLevels, generateEndlessLevel } from '../logic/LevelGenerator';
import { ProgressManager } from '../utils/ProgressManager';
import { i18n } from '../utils/i18n';
import { audio } from '../utils/AudioManager';
import { crazyGames } from '../utils/CrazyGamesManager';
import { OrientationManager } from '../utils/OrientationManager';

interface CellSprite {
  container: Phaser.GameObjects.Container;
  gateGraphics: Phaser.GameObjects.Graphics;
  label: Phaser.GameObjects.Text;
  signalIndicator: Phaser.GameObjects.Graphics;
  lockIcon?: Phaser.GameObjects.Sprite;
  metalPad?: Phaser.GameObjects.Graphics;
}

export class GameScene extends Phaser.Scene {
  private levelId: number = 1;
  private isEndless: boolean = false;
  private levelName: string = '';
  private levelSubtitle: string = '';
  private tutorialText: string = '';
  private grid: (GateDefinition | null)[][] = [];
  private gridWidth: number = 3;
  private gridHeight: number = 3;
  private cellSize: number = CELL_SIZE;
  private cellSprites: (CellSprite | null)[][] = [];
  private signalEngine!: SignalEngine;
  private boardOffsetX: number = 0;
  private boardOffsetY: number = 0;
  private sources: { row: number; col: number; value: number }[] = [];
  private leds: { row: number; col: number; targetSignal?: number }[] = [];
  private testCases?: TestCase[];
  private boardContainer!: Phaser.GameObjects.Container;
  private isAnimating: boolean = false;
  private isWon: boolean = false;
  private isTimeOver: boolean = false;
  private isOutOfMoves: boolean = false;
  private cheatSheetGroup: Phaser.GameObjects.Container | null = null;
  private availableHints: number = 3;

  // Move Limit & Par Moves (3-Star Rating)
  private movesCount: number = 0;
  private parMoves: number = 5;
  private twoStarMoves: number = 7;
  private maxMoves: number = 12;
  private movesText!: Phaser.GameObjects.Text;
  private starsPreviewText!: Phaser.GameObjects.Text;

  // Level Countdown Timer
  private totalTimeLimit: number = 90;
  private timeRemaining: number = 90;
  private timerText!: Phaser.GameObjects.Text;
  private timerBarGraphics!: Phaser.GameObjects.Graphics;

  // Real-time electric pulse effect layer
  private electricPulseGraphics!: Phaser.GameObjects.Graphics;
  private pulseOffset: number = 0;

  // Short-circuit warning graphics
  private shortCircuitGraphics!: Phaser.GameObjects.Graphics;

  // Target gate hover / selection highlight
  private targetCellHighlight!: Phaser.GameObjects.Graphics;
  private activeHoveredCell: { row: number; col: number } | null = null;
  private selectedCell: { row: number; col: number } | null = null;

  // Left & Right Panels
  private hintBtnText!: Phaser.GameObjects.Text;
  private ledStatusText!: Phaser.GameObjects.Text;
  private clockStatusText?: Phaser.GameObjects.Text;

  // Gate Inspector & Truth Table Container (Right side)
  private inspectorContainer!: Phaser.GameObjects.Container;

  // Plumber character and movement
  private player!: Phaser.GameObjects.Sprite;
  private playerSpeed: number = 320;
  private isPlayerWalking: boolean = false;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys?: { [key: string]: Phaser.Input.Keyboard.Key };

  // Dynamic Floating Joystick (Phím di chuyển linh động theo vị trí tay)
  private joystickContainer!: Phaser.GameObjects.Container;
  private joystickKnob!: Phaser.GameObjects.Graphics;
  private isJoystickActive: boolean = false;
  private activePointerId: number | null = null;
  private joystickOrigin: { x: number; y: number } = { x: 0, y: 0 };
  private dynamicMoveVector: { x: number; y: number } = { x: 0, y: 0 };
  private readonly JOYSTICK_MAX_RADIUS: number = 55;

  // Level 1 tutorial pointer
  private tutorialPointer?: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { levelId: number; isEndless?: boolean }): void {
    this.levelId = data.levelId || 1;
    this.isEndless = data.isEndless || this.levelId > 100;
    this.isWon = false;
    this.isTimeOver = false;
    this.isOutOfMoves = false;
    this.isAnimating = false;
    this.pulseOffset = 0;
    this.availableHints = 3;
    this.movesCount = 0;
    this.cheatSheetGroup = null;
    this.activeHoveredCell = null;
    this.selectedCell = null;
    this.isJoystickActive = false;
    this.activePointerId = null;
    this.dynamicMoveVector = { x: 0, y: 0 };
  }

  create(): void {
    // Notify CrazyGames gameplay start
    crazyGames.gameplayStart();

    this.cameras.main.resetFX();
    this.cameras.main.setAlpha(1);

    // 1. Load level data
    let level;
    if (this.isEndless) {
      level = generateEndlessLevel(this.levelId);
    } else {
      const levels = getLevels();
      level = levels.find((l) => l.id === this.levelId) || levels[0];
    }

    this.levelId = level.id;
    this.levelName = i18n.translateLevelName(level.id, level.name);
    this.levelSubtitle = i18n.translateLevelSubtitle(level.id, level.subtitle);
    this.tutorialText = i18n.translateTutorialText(level.id, level.tutorialText);

    // Give new players plenty of time (120s on early levels) to prevent frustration
    this.totalTimeLimit = this.levelId <= 5 ? 150 : (level.timeLimit || 90);
    this.timeRemaining = this.totalTimeLimit;

    this.gridWidth = level.gridWidth;
    this.gridHeight = level.gridHeight;
    this.sources = level.sources;
    this.leds = level.leds;
    this.testCases = level.testCases;

    // Calculate dynamic cell size for current orientation
    const isPort = OrientationManager.isPortrait(this);
    const maxAreaH = isPort ? 600 : 550;
    const maxAreaW = isPort ? 680 : 660;
    this.cellSize = Math.min(104, Math.floor(Math.min(maxAreaW / this.gridWidth, maxAreaH / this.gridHeight)));

    // Chapter BGM
    let chapterId = 1;
    if (this.isEndless || this.levelId > 100) {
      chapterId = 6;
    } else if (this.levelId >= 86) {
      chapterId = 5;
    } else if (this.levelId >= 61) {
      chapterId = 4;
    } else if (this.levelId >= 36) {
      chapterId = 3;
    } else if (this.levelId >= 16) {
      chapterId = 2;
    } else {
      chapterId = 1;
    }
    audio.setChapterBGM(chapterId);

    // Deep clone grid
    this.grid = level.cells.map((row) =>
      row.map((cell) =>
        cell
          ? {
              ...cell,
              ports: cell.ports ? [...cell.ports] : undefined,
            }
          : null
      )
    );

    // Par moves and limits
    this.parMoves = level.parMoves || this.calculateExactMinMoves(this.grid);
    this.twoStarMoves = this.parMoves + 1;
    this.maxMoves = level.maxMoves || (this.parMoves + (this.parMoves <= 3 ? 3 : this.parMoves <= 7 ? 4 : 5));

    // Disable browser right-click context menu for smooth PC rotation
    this.input.mouse?.disableContextMenu();

    // Initialize SignalEngine
    this.signalEngine = new SignalEngine(this.grid, this.gridHeight, this.gridWidth);

    const width = this.scale.width;
    const height = this.scale.height;

    // Draw Cyberpunk Background
    const bg = this.add.graphics();
    const procGraphics = new ProceduralGraphics(this);
    procGraphics.drawBackground(bg, width, height);

    // Draw Top Header
    this.drawHeader();

    // Draw Panels based on orientation
    if (isPort) {
      this.drawPortraitUI();
    } else {
      this.drawLeftPanel();
      this.drawRightInspectorPanel();
    }

    // Calculate Board Layout
    const boardWidth = this.gridWidth * this.cellSize;
    const boardHeight = this.gridHeight * this.cellSize;
    if (isPort) {
      const centerAreaY = 142;
      const centerAreaH = 638;
      this.boardOffsetX = (width - boardWidth) / 2;
      this.boardOffsetY = centerAreaY + (centerAreaH - boardHeight) / 2;
    } else {
      const centerAreaX = 290;
      const centerAreaW = 690;
      const centerAreaY = 72;
      const centerAreaH = 620;
      this.boardOffsetX = centerAreaX + (centerAreaW - boardWidth) / 2;
      this.boardOffsetY = centerAreaY + (centerAreaH - boardHeight) / 2;
    }

    // Board container
    this.boardContainer = this.add.container(0, 0);

    // Board background grid frame
    const gridBg = this.add.graphics();
    procGraphics.drawGridBackground(
      gridBg,
      this.boardOffsetX,
      this.boardOffsetY,
      this.gridWidth,
      this.gridHeight,
      this.cellSize
    );
    this.boardContainer.add(gridBg);

    // Create cell sprites
    this.createCellSprites();

    // Electric pulse layer
    this.electricPulseGraphics = this.add.graphics();
    this.electricPulseGraphics.setDepth(35);
    this.boardContainer.add(this.electricPulseGraphics);

    // Short circuit warning layer
    this.shortCircuitGraphics = this.add.graphics();
    this.shortCircuitGraphics.setDepth(38);
    this.boardContainer.add(this.shortCircuitGraphics);

    // Target highlight
    this.targetCellHighlight = this.add.graphics();
    this.targetCellHighlight.setDepth(45);
    this.boardContainer.add(this.targetCellHighlight);

    // Create Plumber character
    this.createPlayer();

    // Keyboard controls
    this.setupKeyboardControls();

    // Dynamic Floating Joystick (Phím di chuyển linh động)
    this.setupDynamicFloatingJoystick();

    // Initial signal propagation
    this.propagateSignals();

    // Onboarding finger prompt for Level 1
    if (this.levelId === 1) {
      this.showLevel1TutorialPrompt();
    }
  }

  private drawHeader(): void {
    const width = this.scale.width;
    const isPort = OrientationManager.isPortrait(this);
    const headerHeight = 62;
    const headerBg = this.add.graphics();
    headerBg.fillStyle(COLORS.BG_DARK, 0.95);
    headerBg.fillRect(0, 0, width, headerHeight);
    headerBg.lineStyle(1.5, COLORS.CYBER_CYAN, 0.4);
    headerBg.lineBetween(0, headerHeight, width, headerHeight);
    headerBg.setDepth(100);

    // Timer Bar at top edge of screen
    this.timerBarGraphics = this.add.graphics();
    this.timerBarGraphics.setDepth(102);
    this.updateTimerBar();

    // Back to Level Select button
    const backBtnX = isPort ? 50 : 80;
    const backBtnW = isPort ? 80 : 120;
    const backBtnContainer = this.add.container(backBtnX, 31);
    backBtnContainer.setDepth(105);
    const backBg = this.add.rectangle(0, 0, backBtnW, 32, 0x0e243c, 0.95);
    backBg.setStrokeStyle(1.5, 0x00f0ff, 0.85);
    backBg.setInteractive({ useHandCursor: true });
    const backBtnText = this.add.text(0, 0, isPort ? '◀ MENU' : i18n.t('btn_back_levels'), {
      fontSize: '13px',
      fontFamily: FONTS.TITLE,
      color: '#00f0ff',
      fontStyle: 'bold',
    });
    backBtnText.setOrigin(0.5);
    backBtnContainer.add([backBg, backBtnText]);

    backBg.on('pointerdown', () => {
      audio.playButtonClick();
      this.cleanupAndNavigate('LevelSelectScene');
    });

    // Level Title
    const title = this.add.text(width / 2, 14, this.levelName, {
      fontSize: isPort ? '16px' : '20px',
      fontFamily: FONTS.TITLE,
      color: '#00ff9d',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5, 0);
    title.setDepth(105);

    // Subtitle
    const subtitle = this.add.text(width / 2, 38, this.levelSubtitle, {
      fontSize: isPort ? '11px' : '13px',
      fontFamily: FONTS.UI,
      color: '#82a5c7',
      fontStyle: 'bold',
    });
    subtitle.setOrigin(0.5, 0);
    subtitle.setDepth(105);

    if (isPort) {
      // In portrait: Timer and Audio toggle in header
      this.timerText = this.add.text(width - 110, 31, this.formatTime(this.timeRemaining), {
        fontSize: '15px',
        fontFamily: FONTS.MONO,
        color: '#ffd000',
        fontStyle: 'bold',
      });
      this.timerText.setOrigin(0.5);
      this.timerText.setDepth(105);

      // Audio toggle
      const audioContainer = this.add.container(width - 45, 31);
      audioContainer.setDepth(105);
      const audioBg = this.add.rectangle(0, 0, 36, 30, 0x0e243c, 0.92);
      audioBg.setStrokeStyle(1.5, 0x00f0ff, 0.8);
      audioBg.setInteractive({ useHandCursor: true });
      const audioIcon = this.add.text(0, 0, audio.isMuted() ? '🔇' : '🔊', { fontSize: '14px' });
      audioIcon.setOrigin(0.5);
      audioContainer.add([audioBg, audioIcon]);
      audioBg.on('pointerdown', () => {
        const nowMuted = audio.toggleMute();
        audioIcon.setText(nowMuted ? '🔇' : '🔊');
        if (!nowMuted) {
          audio.playButtonClick();
          audio.startBGM();
        }
      });
    } else {
      // In landscape
      this.timerText = this.add.text(width - 210, 31, this.formatTime(this.timeRemaining), {
        fontSize: '16px',
        fontFamily: FONTS.MONO,
        color: '#ffd000',
        fontStyle: 'bold',
      });
      this.timerText.setOrigin(0.5);
      this.timerText.setDepth(105);

      // Audio Sound Toggle Button
      const audioContainer = this.add.container(width - 120, 31);
      audioContainer.setDepth(105);
      const audioBg = this.add.rectangle(0, 0, 38, 30, 0x0e243c, 0.92);
      audioBg.setStrokeStyle(1.5, 0x00f0ff, 0.8);
      audioBg.setInteractive({ useHandCursor: true });
      const audioIcon = this.add.text(0, 0, audio.isMuted() ? '🔇' : '🔊', { fontSize: '15px' });
      audioIcon.setOrigin(0.5);
      audioContainer.add([audioBg, audioIcon]);
      audioBg.on('pointerdown', () => {
        const nowMuted = audio.toggleMute();
        audioIcon.setText(nowMuted ? '🔇' : '🔊');
        if (!nowMuted) {
          audio.playButtonClick();
          audio.startBGM();
        }
      });

      // Restart button
      const restartContainer = this.add.container(width - 55, 31);
      restartContainer.setDepth(105);
      const restartBg = this.add.rectangle(0, 0, 72, 30, 0x2e1224, 0.92);
      restartBg.setStrokeStyle(1.5, 0xff5277, 0.85);
      restartBg.setInteractive({ useHandCursor: true });
      const restartText = this.add.text(0, 0, `↻ ${i18n.getLanguage() === 'vi' ? 'LÀM LẠI' : 'RETRY'}`, {
        fontSize: '11px',
        fontFamily: FONTS.TITLE,
        color: '#ff88aa',
        fontStyle: 'bold',
      });
      restartText.setOrigin(0.5);
      restartContainer.add([restartBg, restartText]);
      restartBg.on('pointerdown', () => {
        audio.playButtonClick();
        this.restartCurrentLevel();
      });
    }
  }

  private drawPortraitUI(): void {
    const width = this.scale.width;
    const px = 15;
    const pw = width - 30;

    // 1. Top HUD Status Bar (Y: 66 to 134, H: 68)
    const topPy = 66;
    const topPh = 68;
    const topBar = this.add.graphics();
    topBar.fillStyle(COLORS.UI_PANEL, 0.94);
    topBar.lineStyle(1.5, COLORS.CYBER_CYAN, 0.5);
    topBar.fillRoundedRect(px, topPy, pw, topPh, 10);
    topBar.strokeRoundedRect(px, topPy, pw, topPh, 10);
    topBar.setDepth(80);

    // Moves display & Stars preview on Left
    this.movesText = this.add.text(px + 14, topPy + 16, '', {
      fontSize: '15px',
      fontFamily: FONTS.TITLE,
      color: '#ffffff',
      fontStyle: 'bold',
    });
    this.movesText.setDepth(81);

    this.starsPreviewText = this.add.text(px + 14, topPy + 38, '⭐⭐⭐', {
      fontSize: '18px',
    });
    this.starsPreviewText.setDepth(81);
    this.updateMovesDisplay();

    // LED status in center
    const statCenter = px + pw * 0.46;
    this.ledStatusText = this.add.text(statCenter, topPy + 34, `${i18n.t('led_outputs')}: 0/${this.leds.length}`, {
      fontSize: '14px',
      fontFamily: FONTS.TITLE,
      color: '#00ff9d',
      fontStyle: 'bold',
    });
    this.ledStatusText.setOrigin(0.5);
    this.ledStatusText.setDepth(81);

    // Hint button on right
    const hintX = px + pw - 105;
    const hintBtn = this.createPanelButton(hintX, topPy + 34, 84, 36, `💡 ${this.availableHints}`, COLORS.CYBER_YELLOW, () => {
      this.useHint();
    });
    this.hintBtnText = hintBtn.getAt(1) as Phaser.GameObjects.Text;

    // Restart button on far right
    const restartX = px + pw - 38;
    this.createPanelButton(restartX, topPy + 34, 42, 36, '↻', 0xff5277, () => {
      this.restartCurrentLevel();
    });

    // 2. Bottom Inspector & Mobile Touch Controls (Y: 790 to 1260, H: 470)
    const botPy = 790;
    const botPh = 470;
    const botPanel = this.add.graphics();
    botPanel.fillStyle(COLORS.UI_PANEL, 0.94);
    botPanel.lineStyle(1.5, COLORS.CYBER_CYAN, 0.5);
    botPanel.fillRoundedRect(px, botPy, pw, botPh, 10);
    botPanel.strokeRoundedRect(px, botPy, pw, botPh, 10);
    botPanel.setDepth(80);

    // Inspector Header
    const hdr = this.add.text(px + pw / 2, botPy + 20, i18n.t('gate_inspector_title'), {
      fontSize: '14px',
      fontFamily: FONTS.TITLE,
      color: '#00f0ff',
      fontStyle: 'bold',
    });
    hdr.setOrigin(0.5);
    hdr.setDepth(81);

    // Divider
    const div = this.add.graphics();
    div.lineStyle(1, 0x1b3c66, 0.6);
    div.lineBetween(px + 15, botPy + 38, px + pw - 15, botPy + 38);
    div.setDepth(81);

    // Inspector Container for dynamic content
    this.inspectorContainer = this.add.container(px, botPy + 44);
    this.inspectorContainer.setDepth(82);

    // Render default inspector
    this.renderDefaultInspector();

    // Bottom Action Buttons (Rotate Left, Rotate Right, Guide)
    const isVi = i18n.getLanguage() === 'vi';
    const actionBtnY = botPy + botPh - 54;
    const btnW1 = 180;
    const btnW2 = 250;
    const btnW3 = 180;

    // Rotate Left CCW
    this.createPanelButton(px + 16 + btnW1 / 2, actionBtnY, btnW1, 52, i18n.t('btn_rotate_left'), COLORS.CYBER_CYAN, () => {
      this.rotateSelectedOrTargetGate(-1);
    });

    // Rotate Right CW (Primary)
    this.createPanelButton(px + pw / 2, actionBtnY, btnW2, 52, i18n.t('btn_rotate_right'), COLORS.SIGNAL_ON, () => {
      this.rotateSelectedOrTargetGate(1);
    });

    // Cheat Sheet
    this.createPanelButton(px + pw - 16 - btnW3 / 2, actionBtnY, btnW3, 52, `📖 ${i18n.t('btn_cheat_sheet')}`, COLORS.CYBER_YELLOW, () => {
      this.toggleCheatSheet();
    });

    // Subtitle helper for touch
    const touchHelper = this.add.text(
      px + pw / 2,
      botPy + botPh - 14,
      isVi ? '🕹️ Chạm & Kéo bất kỳ đâu để di chuyển linh động  •  Chạm ô để xoay' : '🕹️ Touch & Drag anywhere for dynamic joystick  •  Tap cell to rotate',
      {
        fontSize: '11px',
        fontFamily: FONTS.UI,
        color: '#00f0ff',
      }
    );
    touchHelper.setOrigin(0.5);
    touchHelper.setDepth(81);
  }

  private drawLeftPanel(): void {
    const px = 20;
    const py = 76;
    const pw = 255;
    const ph = 624;

    const panel = this.add.graphics();
    panel.fillStyle(COLORS.UI_PANEL, 0.94);
    panel.lineStyle(1.5, COLORS.CYBER_CYAN, 0.5);
    panel.fillRoundedRect(px, py, pw, ph, 10);
    panel.strokeRoundedRect(px, py, pw, ph, 10);
    panel.setDepth(80);

    // Panel Header
    const hdr = this.add.text(px + pw / 2, py + 22, 'STATUS TERMINAL', {
      fontSize: '15px',
      fontFamily: FONTS.TITLE,
      color: '#00f0ff',
      fontStyle: 'bold',
    });
    hdr.setOrigin(0.5);
    hdr.setDepth(81);

    // Divider line
    const div = this.add.graphics();
    div.lineStyle(1, 0x1b3c66, 0.6);
    div.lineBetween(px + 15, py + 42, px + pw - 15, py + 42);
    div.setDepth(81);

    // Moves display
    this.movesText = this.add.text(px + pw / 2, py + 68, '', {
      fontSize: '16px',
      fontFamily: FONTS.TITLE,
      color: '#ffffff',
      fontStyle: 'bold',
    });
    this.movesText.setOrigin(0.5);
    this.movesText.setDepth(81);

    // Stars Preview
    this.starsPreviewText = this.add.text(px + pw / 2, py + 98, '⭐⭐⭐', {
      fontSize: '22px',
    });
    this.starsPreviewText.setOrigin(0.5);
    this.starsPreviewText.setDepth(81);
    this.updateMovesDisplay();

    // Par Info
    const parLabel = this.add.text(
      px + pw / 2,
      py + 128,
      `${i18n.t('par_label')}: ${this.parMoves} (3★) | MAX: ${this.maxMoves}`,
      {
        fontSize: '12px',
        fontFamily: FONTS.MONO,
        color: '#ffd000',
      }
    );
    parLabel.setOrigin(0.5);
    parLabel.setDepth(81);

    // Action Buttons: Rotate Left & Right
    const btnW = pw - 30;
    const btnH = 38;
    const btnStartX = px + pw / 2;

    this.createPanelButton(btnStartX, py + 180, btnW, btnH, i18n.t('btn_rotate_right'), COLORS.SIGNAL_ON, () => {
      this.rotateSelectedOrTargetGate(1);
    });

    this.createPanelButton(btnStartX, py + 226, btnW, btnH, i18n.t('btn_rotate_left'), COLORS.CYBER_CYAN, () => {
      this.rotateSelectedOrTargetGate(-1);
    });

    // Hint Button
    const hintBtn = this.createPanelButton(btnStartX, py + 282, btnW, btnH, `💡 ${i18n.t('btn_hint')} (${this.availableHints})`, COLORS.CYBER_YELLOW, () => {
      this.useHint();
    });
    this.hintBtnText = hintBtn.getAt(1) as Phaser.GameObjects.Text;

    // Cheat Sheet / Logic Guide Button
    this.createPanelButton(btnStartX, py + 328, btnW, btnH, `📖 ${i18n.t('btn_cheat_sheet')}`, COLORS.CYBER_CYAN, () => {
      this.toggleCheatSheet();
    });

    // Tutorial Box
    const tutY = py + 382;
    const tutH = 110;
    const tutBg = this.add.graphics();
    tutBg.fillStyle(0x081729, 0.9);
    tutBg.lineStyle(1, 0x1d4470, 0.8);
    tutBg.fillRoundedRect(px + 12, tutY, pw - 24, tutH, 6);
    tutBg.strokeRoundedRect(px + 12, tutY, pw - 24, tutH, 6);
    tutBg.setDepth(81);

    const tutTitle = this.add.text(px + 22, tutY + 10, '💡 MISSION INTEL', {
      fontSize: '11px',
      fontFamily: FONTS.TITLE,
      color: '#00ff9d',
      fontStyle: 'bold',
    });
    tutTitle.setDepth(82);

    const tutDesc = this.add.text(px + 22, tutY + 30, this.tutorialText, {
      fontSize: '13px',
      fontFamily: FONTS.UI,
      color: '#d0e8ff',
      wordWrap: { width: pw - 44 },
      lineSpacing: 3,
    });
    tutDesc.setDepth(82);

    // Mouse / Keyboard Guide at Bottom of Left Panel
    const guideY = py + ph - 85;
    const isVi = i18n.getLanguage() === 'vi';
    const guideText = isVi
      ? '🎮 MŨI TÊN / WASD: Di chuyển\nSPACE / ENTER: Xoay Thuận (↻)\nQ: Xoay Ngược (↺)\n🖱️ Click Chuột: Trái (↻) | Phải (↺)'
      : '🎮 ARROWS / WASD: Move Player\nSPACE / ENTER: Rotate CW (↻)\nQ: Rotate CCW (↺)\n🖱️ Mouse: Left (↻) | Right (↺)';

    const mouseGuide = this.add.text(
      px + pw / 2,
      guideY,
      guideText,
      {
        fontSize: '11px',
        fontFamily: FONTS.UI,
        color: '#6e93b8',
        align: 'center',
        lineSpacing: 2,
      }
    );
    mouseGuide.setOrigin(0.5, 0);
    mouseGuide.setDepth(82);
  }

  private createPanelButton(
    x: number,
    y: number,
    w: number,
    h: number,
    text: string,
    strokeColor: number,
    callback: () => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    container.setDepth(85);

    const bg = this.add.graphics();
    bg.fillStyle(0x0e243c, 0.95);
    bg.lineStyle(1.5, strokeColor, 0.8);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 6);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 6);

    const label = this.add.text(0, 0, text, {
      fontSize: '13px',
      fontFamily: FONTS.TITLE,
      color: '#ffffff',
      fontStyle: 'bold',
    });
    label.setOrigin(0.5);

    container.add([bg, label]);

    const hit = this.add.zone(0, 0, w, h);
    hit.setInteractive({ useHandCursor: true });

    hit.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x153c63, 1);
      bg.lineStyle(2, strokeColor, 1);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 6);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 6);
      label.setColor('#00ffff');
    });

    hit.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x0e243c, 0.95);
      bg.lineStyle(1.5, strokeColor, 0.8);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 6);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 6);
      label.setColor('#ffffff');
    });

    hit.on('pointerdown', () => {
      audio.playButtonClick();
      this.tweens.add({
        targets: container,
        scaleX: 0.94,
        scaleY: 0.94,
        duration: 60,
        yoyo: true,
        onComplete: callback,
      });
    });

    container.add(hit);
    return container;
  }

  private drawRightInspectorPanel(): void {
    const px = 1005;
    const py = 76;
    const pw = 255;
    const ph = 624;

    const panel = this.add.graphics();
    panel.fillStyle(COLORS.UI_PANEL, 0.94);
    panel.lineStyle(1.5, COLORS.CYBER_CYAN, 0.5);
    panel.fillRoundedRect(px, py, pw, ph, 10);
    panel.strokeRoundedRect(px, py, pw, ph, 10);
    panel.setDepth(80);

    // Inspector Header
    const hdr = this.add.text(px + pw / 2, py + 22, i18n.t('gate_inspector_title'), {
      fontSize: '15px',
      fontFamily: FONTS.TITLE,
      color: '#00f0ff',
      fontStyle: 'bold',
    });
    hdr.setOrigin(0.5);
    hdr.setDepth(81);

    // Divider
    const div = this.add.graphics();
    div.lineStyle(1, 0x1b3c66, 0.6);
    div.lineBetween(px + 15, py + 42, px + pw - 15, py + 42);
    div.setDepth(81);

    // Container for dynamic inspector content
    this.inspectorContainer = this.add.container(px, py + 50);
    this.inspectorContainer.setDepth(82);

    // LED Status Bar at bottom of Right Panel
    const statusY = py + ph - 64;
    const statBg = this.add.graphics();
    statBg.fillStyle(0x071526, 0.95);
    statBg.lineStyle(1.5, COLORS.SIGNAL_ON, 0.6);
    statBg.fillRoundedRect(px + 12, statusY, pw - 24, 46, 6);
    statBg.strokeRoundedRect(px + 12, statusY, pw - 24, 46, 6);
    statBg.setDepth(81);

    this.ledStatusText = this.add.text(px + pw / 2, statusY + 23, `${i18n.t('led_outputs')}: 0/${this.leds.length}`, {
      fontSize: '14px',
      fontFamily: FONTS.TITLE,
      color: '#00ff9d',
      fontStyle: 'bold',
    });
    this.ledStatusText.setOrigin(0.5);
    this.ledStatusText.setDepth(82);

    // Render default inspector content
    this.renderDefaultInspector();
  }

  private renderDefaultInspector(): void {
    this.inspectorContainer.removeAll(true);
    const isPort = OrientationManager.isPortrait(this);
    const pw = isPort ? this.scale.width - 30 : 255;

    const idleText = this.add.text(
      pw / 2,
      isPort ? 45 : 60,
      'SELECT A GATE\nTO INSPECT TRUTH TABLE',
      {
        fontSize: isPort ? '13px' : '14px',
        fontFamily: FONTS.TITLE,
        color: '#6e93b8',
        align: 'center',
        lineSpacing: 6,
      }
    );
    idleText.setOrigin(0.5);

    const circuitStatus = this.add.text(
      pw / 2,
      isPort ? 115 : 170,
      `CIRCUIT OBJECTIVE:\nLight all target LEDs within par moves!`,
      {
        fontSize: '14px',
        fontFamily: FONTS.UI,
        color: '#ffd000',
        align: 'center',
        lineSpacing: 6,
      }
    );
    circuitStatus.setOrigin(0.5);

    this.inspectorContainer.add([idleText, circuitStatus]);

    if (isPort) {
      const missionIntel = this.add.text(
        pw / 2,
        185,
        `💡 ${this.tutorialText}`,
        {
          fontSize: '13px',
          fontFamily: FONTS.UI,
          color: '#d0e8ff',
          align: 'center',
          wordWrap: { width: pw - 60 },
          lineSpacing: 4,
        }
      );
      missionIntel.setOrigin(0.5);
      this.inspectorContainer.add(missionIntel);
    }
  }

  private renderGateInspector(cell: GateDefinition, row: number, col: number): void {
    this.inspectorContainer.removeAll(true);
    const isPort = OrientationManager.isPortrait(this);
    const pw = isPort ? this.scale.width - 30 : 255;

    const cellState = this.signalEngine.getCellStates()[row]?.[col];
    const inSignals = cellState?.inputSignals || [];
    const outSignal = cellState?.outputSignal ?? 0;

    // Gate Name
    const gateTitle = this.add.text(pw / 2, isPort ? 12 : 16, this.getGateName(cell.type), {
      fontSize: isPort ? '16px' : '16px',
      fontFamily: FONTS.TITLE,
      color: '#00ff9d',
      fontStyle: 'bold',
    });
    gateTitle.setOrigin(0.5);

    // Live Signal Monitor
    const inA = inSignals.length > 0 ? inSignals[0] : 0;
    const inB = inSignals.length > 1 ? inSignals[1] : 0;
    const sigStatus = this.add.text(
      pw / 2,
      isPort ? 32 : 44,
      `IN: [${inA}, ${inB}] ➔ OUT: [${outSignal}]`,
      {
        fontSize: isPort ? '12px' : '13px',
        fontFamily: FONTS.MONO,
        color: outSignal === 1 ? '#00ff9d' : '#88a4c2',
        fontStyle: 'bold',
      }
    );
    sigStatus.setOrigin(0.5);

    // Truth Table Title
    const ttHeader = this.add.text(pw / 2, isPort ? 52 : 78, i18n.t('truth_table_title'), {
      fontSize: isPort ? '11px' : '12px',
      fontFamily: FONTS.TITLE,
      color: '#00f0ff',
      fontStyle: 'bold',
    });
    ttHeader.setOrigin(0.5);

    // Draw Truth Table Rows
    const tableData = this.getTruthTableData(cell.type);
    let tableEndY = isPort ? 68 : 96;
    if (tableData) {
      const tableW = isPort ? Math.min(320, pw - 40) : pw - 30;
      const tableX = (pw - tableW) / 2;
      const tableY = isPort ? 66 : 96;
      const rowCount = tableData.rows.length;
      const rowH = isPort ? 18 : 24;
      const tableH = rowCount * rowH + (isPort ? 20 : 28);
      tableEndY = tableY + tableH;

      const tableBg = this.add.graphics();
      tableBg.fillStyle(0x071526, 0.9);
      tableBg.lineStyle(1, 0x1a3b5c, 0.8);
      tableBg.fillRoundedRect(tableX, tableY, tableW, tableH, 6);
      tableBg.strokeRoundedRect(tableX, tableY, tableW, tableH, 6);
      this.inspectorContainer.add(tableBg);

      // Header row
      const hdrRow = this.add.text(pw / 2, tableY + (isPort ? 10 : 14), `${tableData.headers.join('   |   ')}`, {
        fontSize: isPort ? '11px' : '12px',
        fontFamily: FONTS.MONO,
        color: '#ffd000',
        fontStyle: 'bold',
      });
      hdrRow.setOrigin(0.5);
      this.inspectorContainer.add(hdrRow);

      // Data rows
      tableData.rows.forEach((r, idx) => {
        const rowY = tableY + (isPort ? 26 : 38) + idx * rowH;
        const isMatch = r[0] === inA && (tableData.headers.length === 2 || r[1] === inB);

        if (isMatch) {
          const matchHighlight = this.add.graphics();
          matchHighlight.fillStyle(0x00ff9d, 0.2);
          matchHighlight.fillRect(tableX + 2, rowY - (isPort ? 8 : 10), tableW - 4, isPort ? 16 : 20);
          this.inspectorContainer.add(matchHighlight);
        }

        const rowText = this.add.text(pw / 2, rowY, r.join('   |   '), {
          fontSize: isPort ? '12px' : '13px',
          fontFamily: FONTS.MONO,
          color: isMatch ? '#00ff9d' : '#88a4c2',
          fontStyle: isMatch ? 'bold' : 'normal',
        });
        rowText.setOrigin(0.5);
        this.inspectorContainer.add(rowText);
      });
    }

    // Explanation text at bottom of table
    const descY = tableEndY + (isPort ? 8 : 18);
    const descText = this.add.text(pw / 2, descY, this.getGateRuleText(cell.type), {
      fontSize: isPort ? '12px' : '13px',
      fontFamily: FONTS.UI,
      color: '#d0e5ff',
      align: 'center',
      wordWrap: { width: pw - 36 },
      lineSpacing: isPort ? 2 : 4,
    });
    descText.setOrigin(0.5, 0);

    this.inspectorContainer.add([gateTitle, sigStatus, ttHeader, descText]);

    if (isPort) {
      const missionIntel = this.add.text(
        pw / 2,
        descY + 28,
        `💡 ${this.tutorialText}`,
        {
          fontSize: '11px',
          fontFamily: FONTS.UI,
          color: '#ffd000',
          align: 'center',
          wordWrap: { width: pw - 50 },
          lineSpacing: 2,
        }
      );
      missionIntel.setOrigin(0.5, 0);
      this.inspectorContainer.add(missionIntel);
    }
  }

  private getGateName(type: GateType): string {
    switch (type) {
      case GateType.AND: return 'AND GATE (&)';
      case GateType.OR: return 'OR GATE (≥1)';
      case GateType.NOT: return 'NOT INVERTER (1)';
      case GateType.XOR: return 'XOR GATE (=1)';
      case GateType.NAND: return 'NAND GATE (⊼)';
      case GateType.NOR: return 'NOR GATE (⊽)';
      case GateType.XNOR: return 'XNOR GATE (≡)';
      case GateType.DIODE: return 'DIODE (▷|)';
      case GateType.WIRE: return 'STRAIGHT WIRE';
      case GateType.WIRE_CORNER: return 'CORNER WIRE';
      case GateType.SPLIT: return 'T-SPLITTER';
      case GateType.CROSSOVER: return 'WIRE BRIDGE (┼)';
      case GateType.SOURCE: return 'POWER SOURCE';
      case GateType.LED: return 'OUTPUT LED';
      default: return 'LOGIC GATE';
    }
  }

  private getTruthTableData(type: GateType): { headers: string[]; rows: (number | string)[][] } | null {
    switch (type) {
      case GateType.AND:
        return {
          headers: ['A', 'B', 'OUT'],
          rows: [
            [0, 0, 0],
            [0, 1, 0],
            [1, 0, 0],
            [1, 1, 1],
          ],
        };
      case GateType.OR:
        return {
          headers: ['A', 'B', 'OUT'],
          rows: [
            [0, 0, 0],
            [0, 1, 1],
            [1, 0, 1],
            [1, 1, 1],
          ],
        };
      case GateType.NOT:
        return {
          headers: ['IN', 'OUT'],
          rows: [
            [0, 1],
            [1, 0],
          ],
        };
      case GateType.XOR:
        return {
          headers: ['A', 'B', 'OUT'],
          rows: [
            [0, 0, 0],
            [0, 1, 1],
            [1, 0, 1],
            [1, 1, 0],
          ],
        };
      case GateType.NAND:
        return {
          headers: ['A', 'B', 'OUT'],
          rows: [
            [0, 0, 1],
            [0, 1, 1],
            [1, 0, 1],
            [1, 1, 0],
          ],
        };
      case GateType.NOR:
        return {
          headers: ['A', 'B', 'OUT'],
          rows: [
            [0, 0, 1],
            [0, 1, 0],
            [1, 0, 0],
            [1, 1, 0],
          ],
        };
      case GateType.XNOR:
        return {
          headers: ['A', 'B', 'OUT'],
          rows: [
            [0, 0, 1],
            [0, 1, 0],
            [1, 0, 0],
            [1, 1, 1],
          ],
        };
      default:
        return null;
    }
  }

  private getGateRuleText(type: GateType): string {
    switch (type) {
      case GateType.AND:
        return 'Outputs 1 ONLY if BOTH inputs A & B are 1.';
      case GateType.OR:
        return 'Outputs 1 if AT LEAST ONE input is 1.';
      case GateType.NOT:
        return 'Inverts the signal: 0 becomes 1, 1 becomes 0.';
      case GateType.XOR:
        return 'Outputs 1 if inputs are DIFFERENT (1 & 0).';
      case GateType.NAND:
        return 'Inverted AND: Outputs 0 only when both inputs are 1.';
      case GateType.NOR:
        return 'Inverted OR: Outputs 1 only when both inputs are 0.';
      case GateType.XNOR:
        return 'Equivalence: Outputs 1 if inputs MATCH (0=0 or 1=1).';
      case GateType.DIODE:
        return 'One-way gate: Current only travels along arrow.';
      case GateType.CROSSOVER:
        return 'Independent bridge: Horizontal & vertical tracks do not interfere.';
      case GateType.WIRE:
      case GateType.WIRE_CORNER:
      case GateType.SPLIT:
        return 'Conductor wire: Transmits live power along connection arms.';
      default:
        return 'Digital circuit component.';
    }
  }

  private showLevel1TutorialPrompt(): void {
    // Center wire in level 1 is at r=1, c=1
    const x = this.boardOffsetX + 1 * this.cellSize + this.cellSize / 2;
    const y = this.boardOffsetY + 1 * this.cellSize + this.cellSize / 2;

    this.tutorialPointer = this.add.container(x, y - 56);
    this.tutorialPointer.setDepth(200);

    const promptText = this.add.text(0, -20, '👆 CLICK TO ROTATE', {
      fontSize: '14px',
      fontFamily: FONTS.TITLE,
      color: '#00ff9d',
      fontStyle: 'bold',
      backgroundColor: '#0c223c',
      padding: { x: 8, y: 4 },
    });
    promptText.setOrigin(0.5);

    const arrow = this.add.text(0, 8, '▼', {
      fontSize: '18px',
      color: '#00ff9d',
    });
    arrow.setOrigin(0.5);

    this.tutorialPointer.add([promptText, arrow]);

    this.tweens.add({
      targets: this.tutorialPointer,
      y: y - 44,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private createCellSprites(): void {
    this.cellSprites = [];

    for (let r = 0; r < this.gridHeight; r++) {
      this.cellSprites[r] = [];
      for (let c = 0; c < this.gridWidth; c++) {
        const gate = this.grid[r][c];
        const x = this.boardOffsetX + c * this.cellSize + this.cellSize / 2;
        const y = this.boardOffsetY + r * this.cellSize + this.cellSize / 2;

        if (!gate) {
          const emptyG = this.add.sprite(x, y, 'cell_empty');
          emptyG.setDisplaySize(this.cellSize, this.cellSize);
          emptyG.setDepth(15);
          this.boardContainer.add(emptyG);
          this.cellSprites[r][c] = null;
          continue;
        }

        const container = this.add.container(x, y);
        container.setDepth(20);

        let metalPad: Phaser.GameObjects.Graphics | undefined;
        if (gate.fixed) {
          metalPad = this.add.graphics();
          const halfSize = this.cellSize / 2 - 2;
          metalPad.fillStyle(COLORS.GATE_BODY_LOCKED, 1);
          metalPad.lineStyle(2, COLORS.GATE_BORDER_LOCKED, 1);
          metalPad.fillRoundedRect(-halfSize, -halfSize, halfSize * 2, halfSize * 2, 6);
          metalPad.strokeRoundedRect(-halfSize, -halfSize, halfSize * 2, halfSize * 2, 6);

          const riv = halfSize - 5;
          metalPad.fillStyle(0x7c8c9e, 1);
          metalPad.fillCircle(-riv, -riv, 2.5);
          metalPad.fillCircle(riv, -riv, 2.5);
          metalPad.fillCircle(-riv, riv, 2.5);
          metalPad.fillCircle(riv, riv, 2.5);
          container.add(metalPad);
        }

        const gateGraphics = this.add.graphics();
        const signalIndicator = this.add.graphics();
        const label = this.add.text(0, 0, '', {
          fontSize: `${Math.round(this.cellSize * 0.22)}px`,
          fontFamily: FONTS.TITLE,
          color: '#ffffff',
          fontStyle: 'bold',
        });
        label.setOrigin(0.5);

        const lockIcon = this.add.sprite(this.cellSize / 2 - 12, -this.cellSize / 2 + 12, 'icon_padlock');
        lockIcon.setScale((this.cellSize / CELL_SIZE) * 0.75);
        lockIcon.setVisible(!!gate.locked);

        container.add([gateGraphics, signalIndicator, label, lockIcon]);
        this.boardContainer.add(container);

        // Interactive hit area
        const hitArea = new Phaser.Geom.Rectangle(-this.cellSize / 2, -this.cellSize / 2, this.cellSize, this.cellSize);
        container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

        const cellR = r;
        const cellC = c;

        // Hover handling
        container.on('pointerover', () => {
          this.activeHoveredCell = { row: cellR, col: cellC };
          this.renderGateInspector(gate, cellR, cellC);
        });

        // Click/Touch handling: Move player to cell + Left click = CW (+1), Right click = CCW (-1)
        container.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
          if (this.isWon || this.isTimeOver || this.isOutOfMoves) return;

          const cellDef = this.grid[cellR]?.[cellC];
          this.selectedCell = { row: cellR, col: cellC };
          this.activeHoveredCell = { row: cellR, col: cellC };

          if (cellDef) {
            this.renderGateInspector(cellDef, cellR, cellC);
          }

          if (this.tutorialPointer) {
            this.tutorialPointer.destroy();
            this.tutorialPointer = undefined;
          }

          // Move player character directly to this tapped cell
          this.movePlayerToCell(cellR, cellC, () => {
            if (this.isAnimating) return;
            if (cellDef && !cellDef.fixed && !cellDef.locked && cellDef.type !== GateType.SOURCE && cellDef.type !== GateType.LED) {
              const direction: 1 | -1 = pointer.rightButtonDown() || pointer.button === 2 ? -1 : 1;
              this.handleCellTap(cellR, cellC, direction);
            }
          });
        });

        this.cellSprites[r][c] = {
          container,
          gateGraphics,
          label,
          signalIndicator,
          lockIcon,
          metalPad,
        };

        this.drawGateInCell(r, c);
      }
    }
  }

  private rotateSelectedOrTargetGate(direction: 1 | -1): void {
    const target = this.selectedCell || this.activeHoveredCell || this.findFirstRotatableGate();
    if (!target) return;
    this.handleCellTap(target.row, target.col, direction);
  }

  private findFirstRotatableGate(): { row: number; col: number } | null {
    for (let r = 0; r < this.gridHeight; r++) {
      for (let c = 0; c < this.gridWidth; c++) {
        const cell = this.grid[r][c];
        if (cell && !cell.fixed && !cell.locked && cell.type !== GateType.SOURCE && cell.type !== GateType.LED) {
          return { row: r, col: c };
        }
      }
    }
    return null;
  }

  private handleCellTap(row: number, col: number, direction: 1 | -1 = 1): void {
    if (this.isWon || this.isTimeOver || this.isOutOfMoves || this.isAnimating) return;

    const cell = this.grid[row]?.[col];
    if (!cell || cell.fixed || cell.locked || cell.type === GateType.SOURCE || cell.type === GateType.LED) {
      return;
    }

    this.isAnimating = true;

    // Update rotation
    cell.rotation = (cell.rotation + direction + 4) % 4;
    this.movesCount++;
    this.updateMovesDisplay();

    audio.playRotate(direction);

    const sprite = this.cellSprites[row]?.[col];
    if (sprite) {
      const targetAngle = sprite.container.angle + direction * 90;
      this.tweens.add({
        targets: sprite.container,
        angle: targetAngle,
        scaleX: 1.12,
        scaleY: 1.12,
        duration: ANIM.ROTATE_DURATION,
        ease: 'Back.easeOut',
        yoyo: true,
        onComplete: () => {
          this.drawGateInCell(row, col);
          audio.playFlow();
          this.propagateSignals();
          this.renderGateInspector(cell, row, col);
          this.isAnimating = false;

          // Check Out of moves
          if (!this.isWon && this.movesCount >= this.maxMoves && !this.isOutOfMoves) {
            this.triggerOutOfMoves();
          }
        },
      });
    } else {
      this.isAnimating = false;
      this.propagateSignals();
    }
  }

  private drawGateInCell(row: number, col: number): void {
    const cell = this.grid[row][col];
    const sprite = this.cellSprites[row]?.[col];
    if (!cell || !sprite) return;

    const g = sprite.gateGraphics;
    g.clear();

    const halfSize = this.cellSize / 2 - 4;

    if (cell.locked) {
      g.fillStyle(COLORS.GATE_BODY_LOCKED, 0.95);
      g.lineStyle(2.5, COLORS.GATE_BORDER_LOCKED, 1);
    } else if (cell.fixed) {
      g.fillStyle(COLORS.GATE_BODY_LOCKED, 0.9);
      g.lineStyle(2, COLORS.GATE_BORDER_LOCKED, 0.85);
    } else {
      g.fillStyle(COLORS.GATE_BODY, 0.95);
      g.lineStyle(2, COLORS.GATE_BORDER, 0.85);
    }
    g.fillRoundedRect(-halfSize, -halfSize, halfSize * 2, halfSize * 2, 7);
    g.strokeRoundedRect(-halfSize, -halfSize, halfSize * 2, halfSize * 2, 7);

    this.drawGateInner(g, cell.type, halfSize, row, col);

    sprite.container.setAngle(cell.rotation * 90);
    sprite.label.setAngle(-cell.rotation * 90);
    sprite.label.setText(this.getGateLabel(cell.type));
    sprite.label.setFontSize(Math.round(this.cellSize * 0.2));

    if (sprite.lockIcon) {
      sprite.lockIcon.setVisible(!!cell.locked);
      sprite.lockIcon.setAngle(-cell.rotation * 90);
    }
  }

  private drawGateInner(g: Phaser.GameObjects.Graphics, type: GateType, halfSize: number, r: number, c: number): void {
    const s = halfSize * 0.65;

    switch (type) {
      case GateType.WIRE:
        g.lineStyle(8, COLORS.SIGNAL_OFF, 1);
        g.beginPath();
        g.moveTo(-halfSize - 3, 0);
        g.lineTo(halfSize + 3, 0);
        g.strokePath();

        g.lineStyle(3, COLORS.WIRE_COPPER, 1);
        g.beginPath();
        g.moveTo(-halfSize - 3, 0);
        g.lineTo(halfSize + 3, 0);
        g.strokePath();

        g.fillStyle(COLORS.CYBER_YELLOW, 1);
        g.fillCircle(0, 0, 4);
        break;

      case GateType.WIRE_CORNER:
        g.lineStyle(8, COLORS.SIGNAL_OFF, 1);
        g.beginPath();
        g.moveTo(-halfSize - 3, 0);
        g.lineTo(0, 0);
        g.lineTo(0, halfSize + 3);
        g.strokePath();

        g.lineStyle(3, COLORS.WIRE_COPPER, 1);
        g.beginPath();
        g.moveTo(-halfSize - 3, 0);
        g.lineTo(0, 0);
        g.lineTo(0, halfSize + 3);
        g.strokePath();

        g.fillStyle(COLORS.CYBER_YELLOW, 1);
        g.fillCircle(0, 0, 5);
        break;

      case GateType.SPLIT:
        g.lineStyle(8, COLORS.SIGNAL_OFF, 1);
        g.beginPath();
        g.moveTo(-halfSize - 3, 0);
        g.lineTo(halfSize + 3, 0);
        g.moveTo(0, 0);
        g.lineTo(0, halfSize + 3);
        g.strokePath();

        g.lineStyle(3, COLORS.WIRE_COPPER, 1);
        g.beginPath();
        g.moveTo(-halfSize - 3, 0);
        g.lineTo(halfSize + 3, 0);
        g.moveTo(0, 0);
        g.lineTo(0, halfSize + 3);
        g.strokePath();

        g.fillStyle(COLORS.CYBER_YELLOW, 1);
        g.fillCircle(0, 0, 5.5);
        break;

      case GateType.SPLIT_4:
        g.lineStyle(8, COLORS.SIGNAL_OFF, 1);
        g.beginPath();
        g.moveTo(-halfSize - 3, 0);
        g.lineTo(halfSize + 3, 0);
        g.moveTo(0, -halfSize - 3);
        g.lineTo(0, halfSize + 3);
        g.strokePath();

        g.lineStyle(3, COLORS.WIRE_COPPER, 1);
        g.beginPath();
        g.moveTo(-halfSize - 3, 0);
        g.lineTo(halfSize + 3, 0);
        g.moveTo(0, -halfSize - 3);
        g.lineTo(0, halfSize + 3);
        g.strokePath();

        g.fillStyle(COLORS.GATE_BODY, 1);
        g.fillCircle(0, 0, 10);
        g.lineStyle(1.5, COLORS.CYBER_CYAN, 1);
        g.strokeCircle(0, 0, 10);
        g.fillStyle(COLORS.CYBER_YELLOW, 1);
        g.fillCircle(0, 0, 4.5);
        break;

      case GateType.CROSSOVER:
        g.lineStyle(8, COLORS.SIGNAL_OFF, 1);
        g.beginPath();
        g.moveTo(-halfSize - 3, 0);
        g.lineTo(halfSize + 3, 0);
        g.strokePath();
        g.lineStyle(3, COLORS.WIRE_COPPER, 1);
        g.beginPath();
        g.moveTo(-halfSize - 3, 0);
        g.lineTo(halfSize + 3, 0);
        g.strokePath();

        g.fillStyle(0x050c18, 0.95);
        g.fillCircle(0, 0, 10);
        g.lineStyle(1.5, 0x142844, 1);
        g.strokeCircle(0, 0, 10);

        g.lineStyle(8, COLORS.SIGNAL_OFF, 1);
        g.beginPath();
        g.moveTo(0, -halfSize - 3);
        g.lineTo(0, -10);
        g.moveTo(0, 10);
        g.lineTo(0, halfSize + 3);
        g.strokePath();
        g.lineStyle(3, COLORS.CYBER_CYAN, 1);
        g.beginPath();
        g.moveTo(0, -halfSize - 3);
        g.lineTo(0, -10);
        g.arc(0, 0, 8, -Math.PI / 2, Math.PI / 2, true);
        g.lineTo(0, halfSize + 3);
        g.strokePath();
        break;

      case GateType.DIODE:
        g.fillStyle(COLORS.CYBER_CYAN, 0.35);
        g.lineStyle(2.5, COLORS.CYBER_CYAN, 1);
        g.beginPath();
        g.moveTo(-s * 0.7, -s * 0.7);
        g.lineTo(s * 0.4, 0);
        g.lineTo(-s * 0.7, s * 0.7);
        g.closePath();
        g.fillPath();
        g.strokePath();

        g.lineStyle(3, COLORS.CYBER_YELLOW, 1);
        g.beginPath();
        g.moveTo(s * 0.4, -s * 0.7);
        g.lineTo(s * 0.4, s * 0.7);
        g.strokePath();

        g.lineStyle(2.5, COLORS.CYBER_YELLOW, 0.85);
        g.beginPath();
        g.moveTo(-halfSize, 0);
        g.lineTo(-s * 0.7, 0);
        g.strokePath();

        g.lineStyle(2.5, COLORS.SIGNAL_ON, 0.9);
        g.beginPath();
        g.moveTo(s * 0.4, 0);
        g.lineTo(halfSize, 0);
        g.strokePath();
        break;

      case GateType.AND:
      case GateType.NAND:
        g.lineStyle(2.5, COLORS.CYBER_CYAN, 1);
        g.beginPath();
        g.moveTo(-s * 0.7, -s * 0.85);
        g.lineTo(0, -s * 0.85);
        g.arc(0, 0, s * 0.85, -Math.PI / 2, Math.PI / 2, false);
        g.lineTo(-s * 0.7, s * 0.85);
        g.closePath();
        g.strokePath();

        if (type === GateType.NAND) {
          g.fillStyle(COLORS.BG_DARK, 1);
          g.lineStyle(2, COLORS.CYBER_CYAN, 1);
          g.fillCircle(s * 0.85 + 4, 0, 4);
          g.strokeCircle(s * 0.85 + 4, 0, 4);
        }

        g.lineStyle(2.5, COLORS.CYBER_YELLOW, 0.9);
        g.beginPath();
        g.moveTo(0, -halfSize);
        g.lineTo(0, -s * 0.85);
        g.moveTo(0, s * 0.85);
        g.lineTo(0, halfSize);
        g.strokePath();

        g.lineStyle(2.5, COLORS.SIGNAL_ON, 1);
        g.beginPath();
        g.moveTo(type === GateType.NAND ? s * 0.85 + 8 : s * 0.85, 0);
        g.lineTo(halfSize, 0);
        g.strokePath();
        break;

      case GateType.OR:
      case GateType.NOR:
        g.lineStyle(2.5, COLORS.CYBER_CYAN, 1);
        g.beginPath();
        g.moveTo(-s * 0.7, -s * 0.85);
        g.lineTo(s * 0.2, -s * 0.7);
        g.lineTo(s * 0.9, 0);
        g.lineTo(s * 0.2, s * 0.7);
        g.lineTo(-s * 0.7, s * 0.85);
        g.lineTo(-s * 0.3, 0);
        g.closePath();
        g.strokePath();

        if (type === GateType.NOR) {
          g.fillStyle(COLORS.BG_DARK, 1);
          g.lineStyle(2, COLORS.CYBER_CYAN, 1);
          g.fillCircle(s * 0.9 + 4, 0, 4);
          g.strokeCircle(s * 0.9 + 4, 0, 4);
        }

        g.lineStyle(2.5, COLORS.CYBER_YELLOW, 0.9);
        g.beginPath();
        g.moveTo(0, -halfSize);
        g.lineTo(0, -s * 0.7);
        g.moveTo(0, s * 0.7);
        g.lineTo(0, halfSize);
        g.strokePath();

        g.lineStyle(2.5, COLORS.SIGNAL_ON, 1);
        g.beginPath();
        g.moveTo(type === GateType.NOR ? s * 0.9 + 8 : s * 0.9, 0);
        g.lineTo(halfSize, 0);
        g.strokePath();
        break;

      case GateType.XOR:
      case GateType.XNOR:
        g.lineStyle(2.5, COLORS.CYBER_CYAN, 1);
        g.beginPath();
        g.moveTo(-s * 0.5, -s * 0.85);
        g.lineTo(s * 0.2, -s * 0.7);
        g.lineTo(s * 0.9, 0);
        g.lineTo(s * 0.2, s * 0.7);
        g.lineTo(-s * 0.5, s * 0.85);
        g.lineTo(-s * 0.1, 0);
        g.closePath();
        g.strokePath();

        g.beginPath();
        g.moveTo(-s * 0.8, -s * 0.85);
        g.lineTo(-s * 0.4, 0);
        g.lineTo(-s * 0.8, s * 0.85);
        g.strokePath();

        if (type === GateType.XNOR) {
          g.fillStyle(COLORS.BG_DARK, 1);
          g.lineStyle(2, COLORS.CYBER_CYAN, 1);
          g.fillCircle(s * 0.9 + 4, 0, 4);
          g.strokeCircle(s * 0.9 + 4, 0, 4);
        }

        g.lineStyle(2.5, COLORS.CYBER_YELLOW, 0.9);
        g.beginPath();
        g.moveTo(0, -halfSize);
        g.lineTo(0, -s * 0.7);
        g.moveTo(0, s * 0.7);
        g.lineTo(0, halfSize);
        g.strokePath();

        g.lineStyle(2.5, COLORS.SIGNAL_ON, 1);
        g.beginPath();
        g.moveTo(type === GateType.XNOR ? s * 0.9 + 8 : s * 0.9, 0);
        g.lineTo(halfSize, 0);
        g.strokePath();
        break;

      case GateType.NOT:
        g.lineStyle(2.5, COLORS.CYBER_CYAN, 1);
        g.beginPath();
        g.moveTo(-s * 0.8, -s * 0.7);
        g.lineTo(s * 0.3, 0);
        g.lineTo(-s * 0.8, s * 0.7);
        g.closePath();
        g.strokePath();

        g.fillStyle(COLORS.BG_DARK, 1);
        g.fillCircle(s * 0.65, 0, 4.5);
        g.strokeCircle(s * 0.65, 0, 4.5);

        g.lineStyle(2.5, COLORS.CYBER_YELLOW, 0.9);
        g.beginPath();
        g.moveTo(-halfSize, 0);
        g.lineTo(-s * 0.8, 0);
        g.strokePath();

        g.lineStyle(2.5, COLORS.SIGNAL_ON, 1);
        g.beginPath();
        g.moveTo(s * 0.65 + 4.5, 0);
        g.lineTo(halfSize, 0);
        g.strokePath();
        break;

      case GateType.SOURCE:
        g.fillStyle(0x0e243c, 1);
        g.lineStyle(2.5, COLORS.SIGNAL_ON, 1);
        g.fillCircle(0, 0, s * 0.85);
        g.strokeCircle(0, 0, s * 0.85);

        g.lineStyle(3, COLORS.SIGNAL_ON, 1);
        g.beginPath();
        g.moveTo(s * 0.85, 0);
        g.lineTo(halfSize, 0);
        g.strokePath();
        break;

      case GateType.LED:
        const ledDef = this.leds.find((l) => l.row === r && l.col === c);
        const targetZero = ledDef?.targetSignal === 0;

        g.fillStyle(targetZero ? 0x111e30 : COLORS.LED_OFF, 1);
        g.lineStyle(2.5, targetZero ? 0x0077b6 : 0x334a60, 1);
        g.fillCircle(0, 0, s * 0.8);
        g.strokeCircle(0, 0, s * 0.8);

        if (targetZero) {
          g.lineStyle(2, 0x00b4d8, 0.9);
          g.strokeCircle(0, 0, s * 0.4);
        }

        g.lineStyle(3, COLORS.SIGNAL_OFF, 1);
        g.beginPath();
        g.moveTo(-halfSize, 0);
        g.lineTo(-s * 0.8, 0);
        g.strokePath();
        break;
    }
  }

  private getGateLabel(type: GateType): string {
    switch (type) {
      case GateType.AND: return '&';
      case GateType.NAND: return '⊼';
      case GateType.OR: return '≥1';
      case GateType.NOR: return '⊽';
      case GateType.XOR: return '=1';
      case GateType.XNOR: return '≡';
      case GateType.NOT: return '1';
      case GateType.DIODE: return '▷|';
      case GateType.SPLIT_4: return '✚';
      case GateType.CROSSOVER: return '┼';
      default: return '';
    }
  }

  private setupKeyboardControls(): void {
    if (!this.input.keyboard) return;

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasdKeys = this.input.keyboard.addKeys('W,A,S,D') as any;

    this.input.keyboard.on('keydown-R', () => {
      if (this.isWon || this.isOutOfMoves) return;
      this.rotateSelectedOrTargetGate(1);
    });
    this.input.keyboard.on('keydown-E', () => {
      if (this.isWon || this.isOutOfMoves) return;
      this.rotateSelectedOrTargetGate(1);
    });
    this.input.keyboard.on('keydown-SPACE', () => {
      if (this.isWon || this.isOutOfMoves) return;
      this.rotateSelectedOrTargetGate(1);
    });
    this.input.keyboard.on('keydown-ENTER', () => {
      if (this.isWon || this.isOutOfMoves) return;
      this.rotateSelectedOrTargetGate(1);
    });
    this.input.keyboard.on('keydown-Q', () => {
      if (this.isWon || this.isOutOfMoves) return;
      this.rotateSelectedOrTargetGate(-1);
    });
    this.input.keyboard.on('keydown-ESC', () => this.cleanupAndNavigate('LevelSelectScene'));
  }

  private createPlayer(): void {
    let startR = Math.floor(this.gridHeight / 2);
    let startC = Math.floor(this.gridWidth / 2);
    for (let r = 0; r < this.gridHeight; r++) {
      for (let c = 0; c < this.gridWidth; c++) {
        const cell = this.grid[r][c];
        if (cell && !cell.fixed && cell.type !== GateType.SOURCE && cell.type !== GateType.LED) {
          startR = r;
          startC = c;
          break;
        }
      }
    }
    const startX = this.boardOffsetX + startC * this.cellSize + this.cellSize / 2;
    const startY = this.boardOffsetY + startR * this.cellSize + this.cellSize / 2;

    this.player = this.add.sprite(startX, startY, 'player_plumber');
    this.player.setScale((this.cellSize / CELL_SIZE) * 0.85);
    this.player.setDepth(55);
    this.player.setAlpha(0.92);
    this.boardContainer.add(this.player);

    this.tweens.add({
      targets: this.player,
      scaleY: { from: (this.cellSize / CELL_SIZE) * 0.82, to: (this.cellSize / CELL_SIZE) * 0.88 },
      duration: 650,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.selectedCell = { row: startR, col: startC };
    this.activeHoveredCell = { row: startR, col: startC };
  }

  private setupDynamicFloatingJoystick(): void {
    const isPort = OrientationManager.isPortrait(this);
    const startX = isPort ? 130 : 160;
    const startY = isPort ? 690 : 540;

    // 1. Create Joystick Container at high depth (above everything)
    this.joystickContainer = this.add.container(startX, startY);
    this.joystickContainer.setDepth(250);

    // 2. Base Graphics (Outer Cyber Ring, Direction Arrows, & Crosshairs)
    const baseG = this.add.graphics();
    baseG.fillStyle(0x06152b, 0.65);
    baseG.lineStyle(2, COLORS.CYBER_CYAN, 0.85);
    baseG.fillCircle(0, 0, this.JOYSTICK_MAX_RADIUS);
    baseG.strokeCircle(0, 0, this.JOYSTICK_MAX_RADIUS);

    // Outer glow ring
    baseG.lineStyle(1, COLORS.CYBER_CYAN, 0.35);
    baseG.strokeCircle(0, 0, this.JOYSTICK_MAX_RADIUS + 8);

    // 4 Directional Arrows on Base
    const arrowDist = 42;
    baseG.fillStyle(COLORS.CYBER_CYAN, 0.9);
    // Up ▲
    baseG.fillTriangle(0, -arrowDist - 6, -6, -arrowDist + 4, 6, -arrowDist + 4);
    // Down ▼
    baseG.fillTriangle(0, arrowDist + 6, -6, arrowDist - 4, 6, arrowDist - 4);
    // Left ◀
    baseG.fillTriangle(-arrowDist - 6, 0, -arrowDist + 4, -6, -arrowDist + 4, 6);
    // Right ▶
    baseG.fillTriangle(arrowDist + 6, 0, arrowDist - 4, -6, arrowDist - 4, 6);

    // 3. Knob Graphics (Inner Stick with Core Glow)
    this.joystickKnob = this.add.graphics();
    this.joystickKnob.fillStyle(0x0e2e54, 0.95);
    this.joystickKnob.lineStyle(2.5, COLORS.SIGNAL_ON, 1);
    this.joystickKnob.fillCircle(0, 0, 24);
    this.joystickKnob.strokeCircle(0, 0, 24);

    // Core neon glow
    this.joystickKnob.fillStyle(COLORS.SIGNAL_ON, 0.85);
    this.joystickKnob.fillCircle(0, 0, 10);

    // Label on base
    const hintText = this.add.text(0, this.JOYSTICK_MAX_RADIUS + 16, i18n.getLanguage() === 'vi' ? '🕹️ CẦN LINH ĐỘNG' : '🕹️ DYNAMIC JOYSTICK', {
      fontSize: '10px',
      fontFamily: FONTS.TITLE,
      color: '#00f0ff',
      fontStyle: 'bold',
    });
    hintText.setOrigin(0.5);

    this.joystickContainer.add([baseG, this.joystickKnob, hintText]);

    // Idle pulse animation so player immediately notices it on screen
    this.joystickContainer.setAlpha(0.65);
    this.tweens.add({
      targets: this.joystickContainer,
      alpha: { from: 0.45, to: 0.8 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    let touchDownTime = 0;
    let touchDownPos = { x: 0, y: 0 };

    // 4. Global Dynamic Pointer Handlers
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isWon || this.isTimeOver || this.isOutOfMoves) return;

      // Ignore touches on top header bar
      if (pointer.y < 64) return;

      // Ignore touches on bottom action buttons
      const isPortraitNow = OrientationManager.isPortrait(this);
      const botLimit = isPortraitNow ? 1160 : 640;
      if (pointer.y > botLimit && pointer.x > (isPortraitNow ? 200 : 980)) return;

      // LINH ĐỘNG: Di chuyển cần gạt đến chính xác vị trí ngón tay chạm vào!
      this.tweens.killTweensOf(this.joystickContainer);
      this.joystickContainer.setPosition(pointer.x, pointer.y);
      this.joystickContainer.setVisible(true);
      this.joystickContainer.setAlpha(1);
      this.joystickKnob.setPosition(0, 0);

      this.isJoystickActive = true;
      this.activePointerId = pointer.id;
      this.joystickOrigin = { x: pointer.x, y: pointer.y };
      this.dynamicMoveVector = { x: 0, y: 0 };

      touchDownTime = Date.now();
      touchDownPos = { x: pointer.x, y: pointer.y };
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isJoystickActive || pointer.id !== this.activePointerId) return;

      const dx = pointer.x - this.joystickOrigin.x;
      const dy = pointer.y - this.joystickOrigin.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 6) {
        const angle = Math.atan2(dy, dx);
        const clampedDist = Math.min(dist, this.JOYSTICK_MAX_RADIUS);
        this.joystickKnob.setPosition(Math.cos(angle) * clampedDist, Math.sin(angle) * clampedDist);

        const power = clampedDist / this.JOYSTICK_MAX_RADIUS;
        this.dynamicMoveVector.x = Math.cos(angle) * power;
        this.dynamicMoveVector.y = Math.sin(angle) * power;
      } else {
        this.dynamicMoveVector.x = 0;
        this.dynamicMoveVector.y = 0;
        this.joystickKnob.setPosition(0, 0);
      }
    });

    const onPointerRelease = (pointer: Phaser.Input.Pointer) => {
      if (!this.isJoystickActive || pointer.id !== this.activePointerId) return;

      this.isJoystickActive = false;
      this.activePointerId = null;
      this.dynamicMoveVector = { x: 0, y: 0 };

      const totalDist = Math.hypot(pointer.x - touchDownPos.x, pointer.y - touchDownPos.y);
      const dt = Date.now() - touchDownTime;

      // Fade joystick back to gentle idle state
      this.tweens.add({
        targets: this.joystickContainer,
        alpha: 0.45,
        duration: 220,
        onComplete: () => {
          this.joystickKnob.setPosition(0, 0);
        },
      });

      if (totalDist > 16) {
        // Drag release: Snap player to center of current cell smoothly
        const col = Phaser.Math.Clamp(Math.floor((this.player.x - this.boardOffsetX) / this.cellSize), 0, this.gridWidth - 1);
        const row = Phaser.Math.Clamp(Math.floor((this.player.y - this.boardOffsetY) / this.cellSize), 0, this.gridHeight - 1);
        const targetX = this.boardOffsetX + col * this.cellSize + this.cellSize / 2;
        const targetY = this.boardOffsetY + row * this.cellSize + this.cellSize / 2;

        this.tweens.add({
          targets: this.player,
          x: targetX,
          y: targetY,
          duration: 90,
          ease: 'Sine.easeOut',
        });

        this.selectedCell = { row, col };
        this.activeHoveredCell = { row, col };
        const cell = this.grid[row]?.[col];
        if (cell) this.renderGateInspector(cell, row, col);
      } else if (dt < 320) {
        // Quick TAP: Check if tapped on a cell on the board
        const col = Math.floor((pointer.x - this.boardOffsetX) / this.cellSize);
        const row = Math.floor((pointer.y - this.boardOffsetY) / this.cellSize);
        if (row >= 0 && row < this.gridHeight && col >= 0 && col < this.gridWidth) {
          const cellDef = this.grid[row]?.[col];
          this.selectedCell = { row, col };
          this.activeHoveredCell = { row, col };
          if (cellDef) this.renderGateInspector(cellDef, row, col);

          this.movePlayerToCell(row, col, () => {
            if (cellDef && !cellDef.fixed && !cellDef.locked && cellDef.type !== GateType.SOURCE && cellDef.type !== GateType.LED) {
              this.handleCellTap(row, col, 1);
            }
          });
        }
      }
    };

    this.input.on('pointerup', onPointerRelease);
    this.input.on('pointerout', onPointerRelease);
  }

  private movePlayerToCell(row: number, col: number, onArrival?: () => void): void {
    if (!this.player) {
      onArrival?.();
      return;
    }

    const targetX = this.boardOffsetX + col * this.cellSize + this.cellSize / 2;
    const targetY = this.boardOffsetY + row * this.cellSize + this.cellSize / 2;

    const currentX = this.player.x;
    const currentY = this.player.y;

    // Flip towards movement direction
    if (targetX < currentX - 2) {
      this.player.setFlipX(true);
    } else if (targetX > currentX + 2) {
      this.player.setFlipX(false);
    }

    const dist = Phaser.Math.Distance.Between(currentX, currentY, targetX, targetY);
    if (dist < 4) {
      onArrival?.();
      return;
    }

    this.tweens.killTweensOf(this.player);

    const duration = Math.min(240, Math.max(80, (dist / (this.playerSpeed * 1.5)) * 1000));
    this.isPlayerWalking = true;

    this.tweens.add({
      targets: this.player,
      x: targetX,
      y: targetY,
      duration: duration,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.isPlayerWalking = false;
        this.tweens.add({
          targets: this.player,
          scaleY: { from: (this.cellSize / CELL_SIZE) * 0.82, to: (this.cellSize / CELL_SIZE) * 0.88 },
          duration: 650,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
        onArrival?.();
      },
    });

    audio.playButtonClick();
  }

  private movePlayerDirection(dRow: number, dCol: number): void {
    if (!this.player || this.isWon || this.isTimeOver || this.isOutOfMoves) return;

    let currCol = Math.round((this.player.x - this.boardOffsetX - this.cellSize / 2) / this.cellSize);
    let currRow = Math.round((this.player.y - this.boardOffsetY - this.cellSize / 2) / this.cellSize);

    currCol = Phaser.Math.Clamp(currCol, 0, this.gridWidth - 1);
    currRow = Phaser.Math.Clamp(currRow, 0, this.gridHeight - 1);

    const nextRow = Phaser.Math.Clamp(currRow + dRow, 0, this.gridHeight - 1);
    const nextCol = Phaser.Math.Clamp(currCol + dCol, 0, this.gridWidth - 1);

    if (nextRow === currRow && nextCol === currCol) return;

    this.selectedCell = { row: nextRow, col: nextCol };
    this.activeHoveredCell = { row: nextRow, col: nextCol };

    const targetCell = this.grid[nextRow]?.[nextCol];
    if (targetCell) {
      this.renderGateInspector(targetCell, nextRow, nextCol);
    }

    this.movePlayerToCell(nextRow, nextCol);
  }

  private propagateSignals(): void {
    this.signalEngine.updateGrid(this.grid);
    const states = this.signalEngine.propagate(this.sources);

    this.updateShortCircuitVisuals();

    // Update LED sprites
    for (let r = 0; r < this.gridHeight; r++) {
      for (let c = 0; c < this.gridWidth; c++) {
        const state = states[r][c];
        const sprite = this.cellSprites[r]?.[c];
        const gate = this.grid[r][c];

        if (!sprite || !gate) continue;

        if (gate.type === GateType.LED) {
          const ledDef = this.leds.find((l) => l.row === r && l.col === c);
          const target = ledDef?.targetSignal ?? 1;

          let isSatisfied = false;
          if (target === 1) {
            isSatisfied = state.connected && state.inputSignals.includes(1);
          } else {
            isSatisfied = state.connected && state.inputSignals.length > 0 && !state.inputSignals.includes(1);
          }

          sprite.gateGraphics.clear();
          const halfSize = this.cellSize / 2 - 4;
          const s = halfSize * 0.75;

          if (isSatisfied) {
            sprite.gateGraphics.fillStyle(target === 1 ? COLORS.LED_GLOW : 0x00f5d4, 0.25);
            sprite.gateGraphics.fillCircle(0, 0, s + 12);
            sprite.gateGraphics.fillStyle(target === 1 ? COLORS.LED_ON : 0x0096c7, 1);
            sprite.gateGraphics.lineStyle(2.5, target === 1 ? 0x00ff88 : 0x00f5d4, 1);
            sprite.gateGraphics.fillCircle(0, 0, s);
            sprite.gateGraphics.strokeCircle(0, 0, s);
          } else {
            sprite.gateGraphics.fillStyle(target === 1 ? COLORS.LED_OFF : 0x111e30, 1);
            sprite.gateGraphics.lineStyle(2.5, target === 1 ? 0x334a60 : 0x0077b6, 1);
            sprite.gateGraphics.fillCircle(0, 0, s);
            sprite.gateGraphics.strokeCircle(0, 0, s);
          }

          sprite.gateGraphics.lineStyle(3, isSatisfied ? COLORS.SIGNAL_ON : COLORS.SIGNAL_OFF, 1);
          sprite.gateGraphics.beginPath();
          sprite.gateGraphics.moveTo(-halfSize, 0);
          sprite.gateGraphics.lineTo(-s, 0);
          sprite.gateGraphics.strokePath();
        } else if (gate.type !== GateType.SOURCE && sprite.signalIndicator) {
          sprite.signalIndicator.clear();
          if (state && state.connected) {
            const halfSize = this.cellSize / 2 - 4;
            const isOne = state.outputSignal === 1;
            sprite.signalIndicator.fillStyle(isOne ? 0x00ff88 : 0x0088cc, 0.95);
            sprite.signalIndicator.lineStyle(1.5, 0xffffff, 0.9);
            sprite.signalIndicator.fillCircle(halfSize - 6, 0, 4);
            sprite.signalIndicator.strokeCircle(halfSize - 6, 0, 4);
          }
        }
      }
    }

    this.updateLedStatus();

    // Check Win Condition
    let isWin = false;
    if (this.testCases && this.testCases.length > 0) {
      const res = this.signalEngine.evaluateAllTestCases(this.testCases);
      isWin = res.allPassed;
    } else {
      isWin = this.signalEngine.checkWin(this.leds);
    }

    if (isWin && !this.isWon) {
      this.isWon = true;
      this.celebrateWinAndShowModal();
    } else if (!isWin && !this.isWon && this.movesCount >= this.maxMoves && !this.isOutOfMoves) {
      this.triggerOutOfMoves();
    }
  }

  private updateLedStatus(): void {
    if (!this.ledStatusText) return;

    let satisfied = 0;
    const states = this.signalEngine.getCellStates();

    for (const led of this.leds) {
      const st = states[led.row]?.[led.col];
      const target = led.targetSignal ?? 1;
      if (st && st.connected && st.inputSignals.length > 0) {
        if (target === 1 && st.inputSignals.includes(1)) {
          satisfied++;
        } else if (target === 0 && !st.inputSignals.includes(1)) {
          satisfied++;
        }
      }
    }

    this.ledStatusText.setText(`${i18n.t('led_outputs')}: ${satisfied}/${this.leds.length}`);
  }

  private celebrateWinAndShowModal(): void {
    crazyGames.happytime();
    audio.playWin();

    let starsCount = 1;
    if (this.movesCount <= this.parMoves) {
      starsCount = 3;
    } else if (this.movesCount <= this.twoStarMoves) {
      starsCount = 2;
    }

    const winData = {
      levelId: this.levelId,
      moves: this.movesCount,
      parMoves: this.parMoves,
      stars: starsCount,
      isEndless: this.isEndless,
    };

    let timer: Phaser.Time.TimerEvent | null = this.time.delayedCall(ANIM.WIN_DELAY, () => {
      timer = null;
      this.cleanupAndNavigate('WinScene', winData);
    });

    const skipDirectlyToWin = () => {
      if (timer) {
        timer.remove();
        timer = null;
      }
      this.cleanupAndNavigate('WinScene', winData);
    };

    this.input.keyboard?.once('keydown-ENTER', skipDirectlyToWin);
    this.input.keyboard?.once('keydown-SPACE', skipDirectlyToWin);
  }

  private triggerOutOfMoves(): void {
    this.isOutOfMoves = true;
    audio.playFail();

    const width = this.scale.width;
    const height = this.scale.height;

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.85);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(500);

    const pw = Math.min(520, width - 40);
    const ph = 320;
    const px = (width - pw) / 2;
    const py = (height - ph) / 2;

    const modal = this.add.graphics();
    modal.fillStyle(0x0e1b2e, 0.98);
    modal.lineStyle(2, 0xff2a55, 0.95);
    modal.fillRoundedRect(px, py, pw, ph, 14);
    modal.strokeRoundedRect(px, py, pw, ph, 14);
    modal.setDepth(501);

    const title = this.add.text(width / 2, py + 34, i18n.t('out_of_moves_title'), {
      fontSize: '22px',
      fontFamily: FONTS.TITLE,
      color: '#ff2a55',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);
    title.setDepth(502);

    const desc = this.add.text(
      width / 2,
      py + 90,
      i18n.t('out_of_moves_desc', {
        moves: this.movesCount,
        max: this.maxMoves,
        par: this.parMoves,
      }),
      {
        fontSize: '14px',
        fontFamily: FONTS.UI,
        color: '#d0e0f0',
        align: 'center',
        lineSpacing: 6,
      }
    );
    desc.setOrigin(0.5, 0);
    desc.setDepth(502);

    // Retry Button
    const retryBtn = this.createModalActionBtn(width / 2 - 95, py + ph - 48, 175, 40, `${i18n.t('btn_retry')} [ENTER]`, COLORS.SIGNAL_ON, () => {
      this.restartCurrentLevel();
    });
    retryBtn.setDepth(503);

    // Levels List Button
    const levelsBtn = this.createModalActionBtn(width / 2 + 95, py + ph - 48, 175, 40, `${i18n.t('btn_levels_list')} [ESC]`, COLORS.CYBER_CYAN, () => {
      this.cleanupAndNavigate('LevelSelectScene');
    });
    levelsBtn.setDepth(503);

    const onRetryKey = () => {
      this.restartCurrentLevel();
    };
    this.input.keyboard?.once('keydown-ENTER', onRetryKey);
    this.input.keyboard?.once('keydown-SPACE', onRetryKey);
    this.input.keyboard?.once('keydown-R', onRetryKey);
  }

  private createModalActionBtn(
    x: number,
    y: number,
    w: number,
    h: number,
    text: string,
    strokeCol: number,
    callback: () => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(0x0e243c, 1);
    bg.lineStyle(1.5, strokeCol, 0.9);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 6);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 6);

    const label = this.add.text(0, 0, text, {
      fontSize: '13px',
      fontFamily: FONTS.TITLE,
      color: '#ffffff',
      fontStyle: 'bold',
    });
    label.setOrigin(0.5);

    const hit = this.add.zone(0, 0, w, h);
    hit.setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => {
      audio.playButtonClick();
      callback();
    });

    container.add([bg, label, hit]);
    return container;
  }

  private updateMovesDisplay(): void {
    if (!this.movesText) return;
    this.movesText.setText(`${i18n.t('moves_label')}: ${this.movesCount} / ${this.maxMoves}`);

    let starsStr = '⭐⭐⭐';
    if (this.movesCount > this.twoStarMoves) {
      starsStr = '⭐☆☆';
    } else if (this.movesCount > this.parMoves) {
      starsStr = '⭐⭐☆';
    }
    if (this.starsPreviewText) {
      this.starsPreviewText.setText(starsStr);
    }
  }

  private updateShortCircuitVisuals(): void {
    if (!this.shortCircuitGraphics) return;

    this.shortCircuitGraphics.clear();
    const shorts = this.signalEngine.getShortCircuits();

    if (shorts.length > 0) {
      for (const sc of shorts) {
        const x1 = this.boardOffsetX + sc.c1 * this.cellSize + this.cellSize / 2;
        const y1 = this.boardOffsetY + sc.r1 * this.cellSize + this.cellSize / 2;
        const x2 = this.boardOffsetX + sc.c2 * this.cellSize + this.cellSize / 2;
        const y2 = this.boardOffsetY + sc.r2 * this.cellSize + this.cellSize / 2;

        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;

        this.shortCircuitGraphics.fillStyle(COLORS.SHORT_CIRCUIT_GLOW, 0.4);
        this.shortCircuitGraphics.fillCircle(midX, midY, 18);
        this.shortCircuitGraphics.fillStyle(COLORS.SHORT_CIRCUIT_RED, 0.9);
        this.shortCircuitGraphics.fillCircle(midX, midY, 10);
      }
      this.showToast(i18n.t('toast_short_circuit'));
    }
  }

  private updateElectricPulseEffect(): void {
    if (!this.electricPulseGraphics) return;

    this.electricPulseGraphics.clear();
    const states = this.signalEngine.getCellStates();
    this.pulseOffset = (this.pulseOffset + 0.05) % 1;

    for (let r = 0; r < this.gridHeight; r++) {
      for (let c = 0; c < this.gridWidth; c++) {
        const state = states[r][c];
        const gate = this.grid[r][c];
        if (!state || !state.connected || state.activeFlowDirections.length === 0 || !gate) continue;

        const cx = this.boardOffsetX + c * this.cellSize + this.cellSize / 2;
        const cy = this.boardOffsetY + r * this.cellSize + this.cellSize / 2;
        const halfSize = this.cellSize / 2;

        for (const dir of state.activeFlowDirections) {
          let ex = cx;
          let ey = cy;

          switch (dir) {
            case Direction.UP: ey = cy - halfSize; break;
            case Direction.RIGHT: ex = cx + halfSize; break;
            case Direction.DOWN: ey = cy + halfSize; break;
            case Direction.LEFT: ex = cx - halfSize; break;
          }

          this.electricPulseGraphics.lineStyle(5, COLORS.SIGNAL_ON, 0.45);
          this.electricPulseGraphics.beginPath();
          this.electricPulseGraphics.moveTo(cx, cy);
          this.electricPulseGraphics.lineTo(ex, ey);
          this.electricPulseGraphics.strokePath();

          const px = Phaser.Math.Linear(cx, ex, this.pulseOffset);
          const py = Phaser.Math.Linear(cy, ey, this.pulseOffset);

          this.electricPulseGraphics.fillStyle(0x00ffff, 0.95);
          this.electricPulseGraphics.fillCircle(px, py, 3);
          this.electricPulseGraphics.fillStyle(0xffffff, 1);
          this.electricPulseGraphics.fillCircle(px, py, 1.5);
        }
      }
    }
  }

  private updateTargetHighlight(): void {
    if (!this.targetCellHighlight) return;

    this.targetCellHighlight.clear();
    const target = this.activeHoveredCell || this.selectedCell;
    if (!target || this.isWon || this.isTimeOver || this.isOutOfMoves) return;

    const { row, col } = target;
    const x = this.boardOffsetX + col * this.cellSize + this.cellSize / 2;
    const y = this.boardOffsetY + row * this.cellSize + this.cellSize / 2;
    const half = this.cellSize / 2;

    this.targetCellHighlight.lineStyle(2, COLORS.CYBER_CYAN, 0.95);
    this.targetCellHighlight.strokeRoundedRect(x - half + 1, y - half + 1, this.cellSize - 2, this.cellSize - 2, 7);

    // Corner brackets
    const arm = Math.min(14, this.cellSize * 0.25);
    this.targetCellHighlight.lineStyle(3, COLORS.CYBER_YELLOW, 1);
    this.targetCellHighlight.beginPath();
    this.targetCellHighlight.moveTo(x - half, y - half + arm);
    this.targetCellHighlight.lineTo(x - half, y - half);
    this.targetCellHighlight.lineTo(x - half + arm, y - half);
    this.targetCellHighlight.strokePath();

    this.targetCellHighlight.beginPath();
    this.targetCellHighlight.moveTo(x + half - arm, y - half);
    this.targetCellHighlight.lineTo(x + half, y - half);
    this.targetCellHighlight.lineTo(x + half, y - half + arm);
    this.targetCellHighlight.strokePath();
  }

  private useHint(): void {
    if (this.availableHints <= 0 || this.isWon || this.isTimeOver || this.isOutOfMoves) return;

    let target: { r: number; c: number; correctRotation: number } | null = null;
    for (let r = 0; r < this.gridHeight; r++) {
      for (let c = 0; c < this.gridWidth; c++) {
        const cell = this.grid[r][c];
        if (cell && !cell.fixed && !cell.locked && cell.type !== GateType.SOURCE && cell.type !== GateType.LED) {
          const mod = cell.type === GateType.WIRE || cell.type === GateType.CROSSOVER ? 2 : 4;
          if (cell.rotation % mod !== cell.correctRotation % mod) {
            target = { r, c, correctRotation: cell.correctRotation };
            break;
          }
        }
      }
      if (target) break;
    }

    if (!target) {
      this.showToast(i18n.t('toast_all_correct'));
      return;
    }

    this.availableHints--;
    if (this.hintBtnText) {
      this.hintBtnText.setText(`💡 ${i18n.t('btn_hint')} (${this.availableHints})`);
    }

    audio.playHint();
    const cell = this.grid[target.r][target.c]!;
    cell.rotation = target.correctRotation;
    cell.locked = true;

    this.drawGateInCell(target.r, target.c);
    this.propagateSignals();
    this.showToast(i18n.t('toast_hint_used'));
  }

  private toggleCheatSheet(): void {
    if (this.cheatSheetGroup) {
      this.cheatSheetGroup.destroy();
      this.cheatSheetGroup = null;
      return;
    }

    const width = this.scale.width;
    const height = this.scale.height;
    const isPort = OrientationManager.isPortrait(this);

    const container = this.add.container(0, 0);
    container.setDepth(400);

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.85);
    overlay.fillRect(0, 0, width, height);
    overlay.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);
    overlay.on('pointerdown', () => this.toggleCheatSheet());

    const pw = Math.min(720, width - 30);
    const ph = Math.min(600, height - 60);
    const px = (width - pw) / 2;
    const py = (height - ph) / 2;

    const panel = this.add.graphics();
    panel.fillStyle(0x0a1c32, 0.98);
    panel.lineStyle(2, COLORS.CYBER_CYAN, 0.9);
    panel.fillRoundedRect(px, py, pw, ph, 14);
    panel.strokeRoundedRect(px, py, pw, ph, 14);

    const title = this.add.text(width / 2, py + 26, i18n.t('cheat_sheet_title'), {
      fontSize: isPort ? '18px' : '22px',
      fontFamily: FONTS.TITLE,
      color: '#00ff9d',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    const cheatItems = [
      { name: i18n.t('cheat_not_name'), rule: i18n.t('cheat_not_desc'), color: '#00f0ff' },
      { name: i18n.t('cheat_and_name'), rule: i18n.t('cheat_and_desc'), color: '#ffd000' },
      { name: i18n.t('cheat_nand_name'), rule: i18n.t('cheat_nand_desc'), color: '#ffb703' },
      { name: i18n.t('cheat_or_name'), rule: i18n.t('cheat_or_desc'), color: '#00ff88' },
      { name: i18n.t('cheat_nor_name'), rule: i18n.t('cheat_nor_desc'), color: '#06d6a0' },
      { name: i18n.t('cheat_xor_name'), rule: i18n.t('cheat_xor_desc'), color: '#ff007f' },
      { name: i18n.t('cheat_xnor_name'), rule: i18n.t('cheat_xnor_desc'), color: '#b5179e' },
      { name: i18n.t('cheat_diode_name'), rule: i18n.t('cheat_diode_desc'), color: '#00f5d4' },
      { name: i18n.t('cheat_bridge_name'), rule: i18n.t('cheat_bridge_desc'), color: '#4cc9f0' },
    ];

    cheatItems.forEach((item, idx) => {
      const itemY = py + (isPort ? 56 : 66) + idx * (isPort ? 42 : 48);
      const nm = this.add.text(px + (isPort ? 20 : 36), itemY, item.name, {
        fontSize: isPort ? '13px' : '15px',
        fontFamily: FONTS.TITLE,
        color: item.color,
        fontStyle: 'bold',
      });
      const rl = this.add.text(px + (isPort ? 160 : 230), itemY + 1, item.rule, {
        fontSize: isPort ? '12px' : '14px',
        fontFamily: FONTS.UI,
        color: '#e0efff',
      });
      container.add([nm, rl]);
    });

    const closeLabel = this.add.text(width / 2, py + ph - 24, i18n.t('btn_close'), {
      fontSize: '15px',
      fontFamily: FONTS.TITLE,
      color: '#ffd000',
      fontStyle: 'bold',
    });
    closeLabel.setOrigin(0.5);

    container.add([overlay, panel, title, closeLabel]);
    this.cheatSheetGroup = container;
  }

  private showToast(message: string): void {
    const width = this.scale.width;
    const isPort = OrientationManager.isPortrait(this);
    const toast = this.add.container(width / 2, isPort ? 140 : 90);
    toast.setDepth(300);

    const text = this.add.text(0, 0, message, {
      fontSize: '14px',
      fontFamily: FONTS.TITLE,
      color: '#ffffff',
      backgroundColor: '#071526',
      padding: { x: 16, y: 8 },
    });
    text.setOrigin(0.5);

    toast.add(text);

    this.tweens.add({
      targets: toast,
      y: isPort ? 160 : 110,
      alpha: { from: 1, to: 0 },
      duration: 2200,
      ease: 'Quad.easeOut',
      onComplete: () => toast.destroy(),
    });
  }

  private updateTimerBar(): void {
    if (!this.timerBarGraphics) return;

    const width = this.scale.width;
    this.timerBarGraphics.clear();
    const ratio = Math.max(0, this.timeRemaining / this.totalTimeLimit);

    this.timerBarGraphics.fillStyle(0x112233, 1);
    this.timerBarGraphics.fillRect(0, 0, width, 4);

    let barColor = COLORS.SIGNAL_ON;
    if (this.timeRemaining <= 15) {
      barColor = 0xff0055;
    } else if (ratio < 0.4) {
      barColor = COLORS.CYBER_YELLOW;
    }

    this.timerBarGraphics.fillStyle(barColor, 1);
    this.timerBarGraphics.fillRect(0, 0, width * ratio, 4);
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const mStr = mins < 10 ? `0${mins}` : `${mins}`;
    const sStr = secs < 10 ? `0${secs}` : `${secs}`;
    return `⏱️ ${mStr}:${sStr}`;
  }

  private restartCurrentLevel(): void {
    this.cleanupAndNavigate('GameScene', {
      levelId: this.levelId,
      isEndless: this.isEndless,
    });
  }

  private cleanupAndNavigate(sceneKey: string, data?: any): void {
    crazyGames.gameplayStop();
    if (this.input.keyboard) {
      this.input.keyboard.removeAllListeners();
    }
    this.cameras.main.resetFX();
    this.scene.start(sceneKey, data);
  }

  private calculateExactMinMoves(cells: (GateDefinition | null)[][]): number {
    let minMoves = 0;
    for (let r = 0; r < this.gridHeight; r++) {
      for (let c = 0; c < this.gridWidth; c++) {
        const cell = cells[r]?.[c];
        if (cell && !cell.fixed && !cell.locked && cell.type !== GateType.SOURCE && cell.type !== GateType.LED) {
          if (cell.type === GateType.WIRE || cell.type === GateType.CROSSOVER) {
            if (cell.rotation % 2 !== cell.correctRotation % 2) {
              minMoves += 1;
            }
          } else {
            const diffCw = (cell.correctRotation - cell.rotation + 4) % 4;
            const diffCcw = (cell.rotation - cell.correctRotation + 4) % 4;
            minMoves += Math.min(diffCw, diffCcw);
          }
        }
      }
    }
    return Math.max(minMoves, 1);
  }

  update(_time: number, delta: number): void {
    if (this.isWon) return;

    // Timer countdown
    if (!this.isTimeOver && this.totalTimeLimit > 0) {
      this.timeRemaining -= delta / 1000;
      if (this.timeRemaining <= 0) {
        this.timeRemaining = 0;
        this.isTimeOver = true;
        this.showToast(i18n.t('toast_timeout'));
      }
      this.timerText.setText(this.formatTime(this.timeRemaining));
      this.updateTimerBar();
    }

    // Arrow keys & WASD player movement OR Dynamic Floating Joystick
    let vx = 0;
    let vy = 0;

    if (this.cursors?.left.isDown || this.wasdKeys?.A.isDown) vx -= 1;
    if (this.cursors?.right.isDown || this.wasdKeys?.D.isDown) vx += 1;
    if (this.cursors?.up.isDown || this.wasdKeys?.W.isDown) vy -= 1;
    if (this.cursors?.down.isDown || this.wasdKeys?.S.isDown) vy += 1;

    // Add dynamic floating joystick vector
    if (this.dynamicMoveVector.x !== 0 || this.dynamicMoveVector.y !== 0) {
      vx += this.dynamicMoveVector.x;
      vy += this.dynamicMoveVector.y;
    }

    if (this.player && (vx !== 0 || vy !== 0) && !this.isWon && !this.isTimeOver && !this.isOutOfMoves) {
      this.tweens.killTweensOf(this.player);
      this.isPlayerWalking = false;
      const len = Math.hypot(vx, vy);
      const normX = vx / len;
      const normY = vy / len;

      const tiltPower = (this.dynamicMoveVector.x !== 0 || this.dynamicMoveVector.y !== 0)
        ? Math.min(1.2, Math.max(0.4, Math.hypot(this.dynamicMoveVector.x, this.dynamicMoveVector.y)))
        : 1;

      const moveDist = (this.playerSpeed * tiltPower * delta) / 1000;
      this.player.x += normX * moveDist;
      this.player.y += normY * moveDist;

      if (vx !== 0) {
        this.player.setFlipX(vx < 0);
      }

      // Clamp inside board bounds
      const minX = this.boardOffsetX + this.cellSize / 2;
      const maxX = this.boardOffsetX + this.gridWidth * this.cellSize - this.cellSize / 2;
      const minY = this.boardOffsetY + this.cellSize / 2;
      const maxY = this.boardOffsetY + this.gridHeight * this.cellSize - this.cellSize / 2;

      this.player.x = Phaser.Math.Clamp(this.player.x, minX, maxX);
      this.player.y = Phaser.Math.Clamp(this.player.y, minY, maxY);

      // Select the cell under the player
      const col = Math.floor((this.player.x - this.boardOffsetX) / this.cellSize);
      const row = Math.floor((this.player.y - this.boardOffsetY) / this.cellSize);

      if (row >= 0 && row < this.gridHeight && col >= 0 && col < this.gridWidth) {
        const cell = this.grid[row]?.[col];
        if (cell && (this.selectedCell?.row !== row || this.selectedCell?.col !== col)) {
          this.selectedCell = { row, col };
          this.activeHoveredCell = { row, col };
          this.renderGateInspector(cell, row, col);
        }
      }
    }

    // Update target reticle & electric pulses
    this.updateTargetHighlight();
    this.updateElectricPulseEffect();
  }
}
