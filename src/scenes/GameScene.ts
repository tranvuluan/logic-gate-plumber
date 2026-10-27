import Phaser from 'phaser';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  CELL_SIZE,
  COLORS,
  GateType,
  Direction,
  GateDefinition,
  ANIM,
  TOUCH,
  TestCase,
} from '../utils/Constants';
import { ProceduralGraphics } from '../graphics/ProceduralGraphics';
import { SignalEngine, CellState, ShortCircuitEdge } from '../logic/SignalEngine';
import { TouchControls } from '../utils/TouchControls';
import { VirtualJoystick } from '../utils/VirtualJoystick';
import { getLevels, generateEndlessLevel } from '../logic/LevelGenerator';
import { ProgressManager, MAX_LEVELS } from '../utils/ProgressManager';
import { i18n } from '../utils/i18n';

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
  private touchControls!: TouchControls;
  private boardOffsetX: number = 0;
  private boardOffsetY: number = 0;
  private sources: { row: number; col: number; value: number }[] = [];
  private leds: { row: number; col: number; targetSignal?: number }[] = [];
  private testCases?: TestCase[];
  private boardContainer!: Phaser.GameObjects.Container;
  private isAnimating: boolean = false;
  private isWon: boolean = false;
  private isTimeOver: boolean = false;
  private cheatSheetGroup: Phaser.GameObjects.Container | null = null;
  private modalGroup: Phaser.GameObjects.Container | null = null;
  private headerHeight: number = 110;
  private availableHints: number = 3;

  // Move Limit & Par Moves (3-Star Rating)
  private movesCount: number = 0;
  private parMoves: number = 5;
  private twoStarMoves: number = 7;
  private maxMoves: number = 12;
  private isOutOfMoves: boolean = false;
  private movesText!: Phaser.GameObjects.Text;

  // Level Countdown Timer
  private totalTimeLimit: number = 60;
  private timeRemaining: number = 60;
  private timerText!: Phaser.GameObjects.Text;
  private timerBarGraphics!: Phaser.GameObjects.Graphics;

  // Real-time electric pulse effect layer
  private electricPulseGraphics!: Phaser.GameObjects.Graphics;
  private pulseOffset: number = 0;

  // Short-circuit warning graphics
  private shortCircuitGraphics!: Phaser.GameObjects.Graphics;
  private shortCircuitText?: Phaser.GameObjects.Text;

  // Plumber character and controls
  private player!: Phaser.GameObjects.Sprite;
  private playerSpeed: number = 260;
  private virtualJoystick!: VirtualJoystick;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys?: { [key: string]: Phaser.Input.Keyboard.Key };
  private activeTargetCell: { row: number; col: number } | null = null;
  private targetCellHighlight!: Phaser.GameObjects.Graphics;
  private leftActionButtonContainer!: Phaser.GameObjects.Container;
  private rightActionButtonContainer!: Phaser.GameObjects.Container;
  private hintBtnText!: Phaser.GameObjects.Text;

  // Zoom & Pan state
  private boardScale: number = 1.0;
  private initialPinchDistance: number = 0;
  private initialScale: number = 1.0;
  private isPanDragging: boolean = false;
  private panStartPos: { x: number; y: number } = { x: 0, y: 0 };
  private containerStartPos: { x: number; y: number } = { x: 0, y: 0 };

  // In-Game Next Level HUD & Header buttons
  private ledStatusText?: Phaser.GameObjects.Text;
  private clockStatusText?: Phaser.GameObjects.Text;
  private nextLevelHudContainer: Phaser.GameObjects.Container | null = null;
  private headerNextBtn: Phaser.GameObjects.Container | null = null;

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
    this.boardScale = 1.0;
    this.nextLevelHudContainer = null;
    this.headerNextBtn = null;
    this.modalGroup = null;
    this.cheatSheetGroup = null;
  }

  create(): void {
    this.cameras.main.resetFX();
    this.cameras.main.setAlpha(1);

    // 1. Load level data (from predefined 100 levels or procedural endless)
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
    this.totalTimeLimit = level.timeLimit || 60;
    this.timeRemaining = this.totalTimeLimit;

    this.gridWidth = level.gridWidth;
    this.gridHeight = level.gridHeight;
    this.sources = level.sources;
    this.leds = level.leds;
    this.testCases = level.testCases;

    // Calculate dynamic cell size so large boards (8x8 to 10x10) fit screens comfortably
    const maxDim = Math.max(this.gridWidth, this.gridHeight);
    this.cellSize = maxDim > 6 ? Math.min(CELL_SIZE, Math.floor(660 / maxDim)) : CELL_SIZE;

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

    // Accurate Par moves & tight tactical move limit
    this.parMoves = level.parMoves || this.calculateExactMinMoves(this.grid);
    this.twoStarMoves = this.parMoves + 1; // 2 Stars: strictly within 1 move of optimal par!
    this.maxMoves = level.maxMoves || (this.parMoves + (this.parMoves <= 3 ? 2 : this.parMoves <= 7 ? 3 : 4));

    // Disable browser right-click context menu so right clicking rotates counter-clockwise
    this.input.mouse?.disableContextMenu();

    // Initialize BFS signal engine
    this.signalEngine = new SignalEngine(this.grid, this.gridHeight, this.gridWidth);

    // Draw Cyberpunk Background
    const bg = this.add.graphics();
    const procGraphics = new ProceduralGraphics(this);
    procGraphics.drawBackground(bg, GAME_WIDTH, GAME_HEIGHT);

    // Draw Header with Timer & Moves
    this.drawHeader();

    // Draw Tutorial Banner
    this.drawTutorialBanner();

    // Calculate Board Layout
    const boardWidth = this.gridWidth * this.cellSize;
    const boardHeight = this.gridHeight * this.cellSize;
    this.boardOffsetX = (GAME_WIDTH - boardWidth) / 2;
    this.boardOffsetY = 210 + (GAME_HEIGHT - 210 - 270 - boardHeight) / 2;

    // Board container (Supports Pinch-to-Zoom & Pan)
    this.boardContainer = this.add.container(0, 0);

    // Board background frame
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

    // Target gate reticle
    this.targetCellHighlight = this.add.graphics();
    this.targetCellHighlight.setDepth(45);
    this.boardContainer.add(this.targetCellHighlight);

    // Create Plumber character
    this.createPlayer();

    // Setup input schemes
    this.setupTouchControls();
    this.setupVirtualControls();
    this.setupKeyboardControls();
    this.setupZoomAndPanControls();

    // Bottom UI Bar (created before signal propagation)
    this.drawBottomUI();

    // Floating Reset Zoom Button (for large grids)
    this.createResetZoomButton();

    // Initial signal propagation
    this.propagateSignals();
  }

  private drawHeader(): void {
    const headerBg = this.add.graphics();
    headerBg.fillStyle(COLORS.BG_DARK, 0.94);
    headerBg.fillRect(0, 0, GAME_WIDTH, this.headerHeight);
    headerBg.lineStyle(1.5, COLORS.CYBER_CYAN, 0.4);
    headerBg.beginPath();
    headerBg.moveTo(0, this.headerHeight);
    headerBg.lineTo(GAME_WIDTH, this.headerHeight);
    headerBg.strokePath();
    headerBg.setDepth(999);

    // Timer Bar at top edge of screen
    this.timerBarGraphics = this.add.graphics();
    this.timerBarGraphics.setDepth(1001);
    this.updateTimerBar();

    // Back to Level Select
    const backBtnContainer = this.add.container(78, 38);
    backBtnContainer.setDepth(1002);
    const backBg = this.add.rectangle(0, 0, 116, 36, 0x112740, 0.92);
    backBg.setStrokeStyle(1.5, 0x00f0ff, 0.8);
    backBg.setInteractive({ useHandCursor: true });
    const backBtnText = this.add.text(0, 0, i18n.t('btn_back_levels'), {
      fontSize: '13px',
      fontFamily: 'monospace',
      color: '#00f0ff',
      fontStyle: 'bold',
    });
    backBtnText.setOrigin(0.5);
    backBtnContainer.add([backBg, backBtnText]);

    backBg.on('pointerdown', () => {
      this.cleanupAndNavigate('LevelSelectScene');
    });

    // Level Title
    const title = this.add.text(GAME_WIDTH / 2, 18, this.levelName, {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: '#00ff88',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5, 0);
    title.setDepth(1000);

    // Moves & Par Rating HUD
    this.movesText = this.add.text(
      GAME_WIDTH / 2,
      44,
      '',
      {
        fontSize: '12px',
        fontFamily: 'monospace',
        color: '#ffd000',
        fontStyle: 'bold',
      }
    );
    this.movesText.setOrigin(0.5, 0);
    this.movesText.setDepth(1000);
    this.updateMovesDisplay();

    // Subtitle
    const subtitle = this.add.text(GAME_WIDTH / 2, 66, this.levelSubtitle, {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#88b0d0',
    });
    subtitle.setOrigin(0.5, 0);
    subtitle.setDepth(1000);

    // Header Next Level Button (shown when level is solved)
    this.headerNextBtn = this.add.container(GAME_WIDTH / 2, 92);
    this.headerNextBtn.setDepth(1002);
    const nextHdrBg = this.add.rectangle(0, 0, 220, 28, 0x00ff88, 1);
    nextHdrBg.setStrokeStyle(1.5, 0xffffff, 1);
    nextHdrBg.setInteractive({ useHandCursor: true });
    const nextHdrText = this.add.text(
      0,
      0,
      this.isEndless ? i18n.t('btn_next_endless') : i18n.t('btn_next_level', { next: this.levelId + 1 }),
      {
        fontSize: '13px',
        fontFamily: 'monospace',
        color: '#061a12',
        fontStyle: 'bold',
      }
    );
    nextHdrText.setOrigin(0.5);
    this.headerNextBtn.add([nextHdrBg, nextHdrText]);
    this.headerNextBtn.setVisible(false);

    nextHdrBg.on('pointerdown', () => {
      this.loadNextLevel(this.levelId + 1);
    });

    // Digital Countdown Timer Display
    this.timerText = this.add.text(GAME_WIDTH - 25, 24, this.formatTime(this.timeRemaining), {
      fontSize: '15px',
      fontFamily: 'monospace',
      color: '#ffd000',
      fontStyle: 'bold',
    });
    this.timerText.setOrigin(1, 0);
    this.timerText.setDepth(1000);

    // Restart button
    const restartContainer = this.add.container(GAME_WIDTH - 65, 66);
    restartContainer.setDepth(1002);
    const restartBg = this.add.rectangle(0, 0, 96, 30, 0x301525, 0.92);
    restartBg.setStrokeStyle(1.5, 0xff6688, 0.85);
    restartBg.setInteractive({ useHandCursor: true });
    const restartText = this.add.text(0, 0, `↻ ${i18n.getLanguage() === 'vi' ? 'LÀM LẠI' : 'RETRY'}`, {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#ff88aa',
      fontStyle: 'bold',
    });
    restartText.setOrigin(0.5);
    restartContainer.add([restartBg, restartText]);

    restartBg.on('pointerdown', () => {
      this.restartCurrentLevel();
    });
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const mStr = mins < 10 ? `0${mins}` : `${mins}`;
    const sStr = secs < 10 ? `0${secs}` : `${secs}`;
    return `⏱️ ${mStr}:${sStr}`;
  }

  private updateTimerBar(): void {
    if (!this.timerBarGraphics) return;

    this.timerBarGraphics.clear();
    const ratio = Math.max(0, this.timeRemaining / this.totalTimeLimit);

    this.timerBarGraphics.fillStyle(0x112233, 1);
    this.timerBarGraphics.fillRect(0, 0, GAME_WIDTH, 4);

    let barColor = COLORS.SIGNAL_ON;
    if (this.timeRemaining <= 15) {
      barColor = 0xff0055;
    } else if (ratio < 0.4) {
      barColor = COLORS.CYBER_YELLOW;
    }

    this.timerBarGraphics.fillStyle(barColor, 1);
    this.timerBarGraphics.fillRect(0, 0, GAME_WIDTH * ratio, 4);
  }

  private drawTutorialBanner(): void {
    const bannerY = 114;
    const bannerH = 68;
    const bannerW = GAME_WIDTH - 40;

    const bannerBg = this.add.graphics();
    bannerBg.fillStyle(0x0c2036, 0.88);
    bannerBg.lineStyle(1.5, COLORS.CYBER_CYAN, 0.6);
    bannerBg.fillRoundedRect(20, bannerY, bannerW, bannerH, 10);
    bannerBg.strokeRoundedRect(20, bannerY, bannerW, bannerH, 10);
    bannerBg.setDepth(90);

    const guideIcon = this.add.text(36, bannerY + bannerH / 2, '💡', {
      fontSize: '22px',
    });
    guideIcon.setOrigin(0, 0.5);
    guideIcon.setDepth(91);

    const guideText = this.add.text(72, bannerY + 12, this.tutorialText, {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#d0e8ff',
      wordWrap: { width: bannerW - 84 },
      lineSpacing: 4,
    });
    guideText.setDepth(91);
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
          // Render industrial locked metal pad under the gate
          metalPad = this.add.graphics();
          const halfSize = this.cellSize / 2 - 2;
          metalPad.fillStyle(COLORS.GATE_BODY_LOCKED, 1);
          metalPad.lineStyle(2, COLORS.GATE_BORDER_LOCKED, 1);
          metalPad.fillRoundedRect(-halfSize, -halfSize, halfSize * 2, halfSize * 2, 6);
          metalPad.strokeRoundedRect(-halfSize, -halfSize, halfSize * 2, halfSize * 2, 6);

          // Corner metal rivets
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
          fontSize: `${Math.round(this.cellSize * 0.2)}px`,
          fontFamily: 'monospace',
          color: '#ffffff',
          fontStyle: 'bold',
        });
        label.setOrigin(0.5);

        const lockIcon = this.add.sprite(this.cellSize / 2 - 12, -this.cellSize / 2 + 12, 'icon_padlock');
        lockIcon.setScale((this.cellSize / CELL_SIZE) * 0.75);
        lockIcon.setVisible(!!gate.locked);

        container.add([gateGraphics, signalIndicator, label, lockIcon]);
        this.boardContainer.add(container);

        // Direct interactive hit area for instant cell tapping
        const hitArea = new Phaser.Geom.Rectangle(-this.cellSize / 2, -this.cellSize / 2, this.cellSize, this.cellSize);
        container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
        const cellR = r;
        const cellC = c;
        container.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
          if (this.isWon || this.isTimeOver || this.isOutOfMoves || this.isAnimating) return;

          const cellDef = this.grid[cellR]?.[cellC];
          if (!cellDef || cellDef.fixed || cellDef.locked || cellDef.type === GateType.SOURCE || cellDef.type === GateType.LED) {
            return;
          }

          // 1. Select and highlight this active target cell
          this.selectCell(cellR, cellC);

          // 2. Right click on PC / mouse -> Rotate Left (-1)
          if (pointer.rightButtonDown() || pointer.button === 2) {
            this.handleCellTap(cellR, cellC, -1);
            return;
          }

          // 3. Screen horizontal coordinate test (Immune to container / gate rotation!):
          // Center of this cell in screen coordinates
          const cellCenterScreenX = this.boardOffsetX + this.boardContainer.x + (cellC * this.cellSize + this.cellSize / 2) * this.boardScale;
          const direction: 1 | -1 = pointer.x < cellCenterScreenX ? -1 : 1;
          this.handleCellTap(cellR, cellC, direction);
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
    sprite.label.setFontSize(Math.round(this.cellSize * 0.18));

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
        // Horizontal Wire
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

        // Insulating jumper ring
        g.fillStyle(0x050c18, 0.95);
        g.fillCircle(0, 0, 10);
        g.lineStyle(1.5, 0x142844, 1);
        g.strokeCircle(0, 0, 10);

        // Vertical jumper arch over horizontal
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
    this.player.setDepth(50);
    this.boardContainer.add(this.player);

    this.tweens.add({
      targets: this.player,
      scaleY: { from: (this.cellSize / CELL_SIZE) * 0.85, to: (this.cellSize / CELL_SIZE) * 0.9 },
      scaleX: { from: (this.cellSize / CELL_SIZE) * 0.85, to: (this.cellSize / CELL_SIZE) * 0.82 },
      duration: 650,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private setupVirtualControls(): void {
    const bottomControlsY = GAME_HEIGHT - 120;

    // 1. Virtual Joystick
    this.virtualJoystick = new VirtualJoystick(this, 115, bottomControlsY, 52);

    const joyLabel = this.add.text(115, bottomControlsY + 70, `🎮 ${i18n.getLanguage() === 'vi' ? 'DI CHUYỂN' : 'MOVE'}`, {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#00f0ff',
    });
    joyLabel.setOrigin(0.5);
    joyLabel.setDepth(150);

    // 2. Action Buttons: ROTATE LEFT (↺) and ROTATE RIGHT (↻)
    const btnLeftX = 515;
    const btnRightX = 635;
    const btnY = bottomControlsY;

    // LEFT ROTATE BUTTON (↺ TRÁI)
    this.leftActionButtonContainer = this.add.container(btnLeftX, btnY);
    this.leftActionButtonContainer.setDepth(150);

    const leftOuter = this.add.circle(0, 0, 42, 0x00f0ff, 0.12);
    leftOuter.setStrokeStyle(1.5, 0x00f0ff, 0.5);

    const leftBg = this.add.circle(0, 0, 36, 0x10253f, 0.95);
    leftBg.setStrokeStyle(2.5, 0x00f0ff, 0.9);

    const leftIconText = this.add.text(0, -6, '↺', {
      fontSize: '32px',
      fontStyle: 'bold',
      color: '#00f0ff',
    });
    leftIconText.setOrigin(0.5);

    const leftLabel = this.add.text(0, 46, i18n.t('btn_rotate_left'), {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#00f0ff',
      fontStyle: 'bold',
    });
    leftLabel.setOrigin(0.5);

    this.leftActionButtonContainer.add([leftOuter, leftBg, leftIconText, leftLabel]);

    const leftZone = this.add.zone(btnLeftX, btnY, 80, 80);
    leftZone.setInteractive({ useHandCursor: true });
    leftZone.setDepth(151);
    leftZone.on('pointerdown', () => {
      this.tweens.add({
        targets: this.leftActionButtonContainer,
        scaleX: 0.88,
        scaleY: 0.88,
        duration: 70,
        yoyo: true,
      });
      this.rotateCurrentOrTargetGate(-1);
    });

    // RIGHT ROTATE BUTTON (↻ PHẢI)
    this.rightActionButtonContainer = this.add.container(btnRightX, btnY);
    this.rightActionButtonContainer.setDepth(150);

    const rightOuter = this.add.circle(0, 0, 46, 0xffd000, 0.15);
    rightOuter.setStrokeStyle(2, 0xffd000, 0.6);

    const rightBg = this.add.circle(0, 0, 40, 0x10253f, 0.95);
    rightBg.setStrokeStyle(3, 0xffd000, 0.95);

    const rightIconText = this.add.text(0, -6, '↻', {
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#ffd000',
    });
    rightIconText.setOrigin(0.5);

    const rightLabel = this.add.text(0, 46, i18n.t('btn_rotate_right'), {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#ffd000',
      fontStyle: 'bold',
    });
    rightLabel.setOrigin(0.5);

    this.rightActionButtonContainer.add([rightOuter, rightBg, rightIconText, rightLabel]);

    const rightZone = this.add.zone(btnRightX, btnY, 86, 86);
    rightZone.setInteractive({ useHandCursor: true });
    rightZone.setDepth(151);
    rightZone.on('pointerdown', () => {
      this.tweens.add({
        targets: this.rightActionButtonContainer,
        scaleX: 0.88,
        scaleY: 0.88,
        duration: 70,
        yoyo: true,
      });
      this.rotateCurrentOrTargetGate(1);
    });

    // 3. Middle Helper Buttons: Hint & Cheat Sheet
    const midY = bottomControlsY - 6;
    this.createAuxiliaryButtons(midY);
  }

  private createAuxiliaryButtons(y: number): void {
    const hintX = 265;
    const cheatX = 365;

    // Hint Button
    const hintContainer = this.add.container(hintX, y);
    hintContainer.setDepth(150);

    const hintBg = this.add.graphics();
    hintBg.fillStyle(0x112744, 0.9);
    hintBg.lineStyle(2, COLORS.CYBER_YELLOW, 0.85);
    hintBg.fillRoundedRect(-45, -35, 90, 70, 10);
    hintBg.strokeRoundedRect(-45, -35, 90, 70, 10);

    const hintIcon = this.add.text(0, -10, '💡', { fontSize: '24px' });
    hintIcon.setOrigin(0.5);

    this.hintBtnText = this.add.text(0, 18, `${i18n.t('btn_hint')} (${this.availableHints})`, {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#ffd000',
      fontStyle: 'bold',
    });
    this.hintBtnText.setOrigin(0.5);

    hintContainer.add([hintBg, hintIcon, this.hintBtnText]);

    const hintZone = this.add.zone(hintX, y, 90, 70);
    hintZone.setInteractive({ useHandCursor: true });
    hintZone.setDepth(151);
    hintZone.on('pointerdown', () => {
      this.useHint();
    });

    // Cheat Sheet Button
    const cheatContainer = this.add.container(cheatX, y);
    cheatContainer.setDepth(150);

    const cheatBg = this.add.graphics();
    cheatBg.fillStyle(0x112744, 0.9);
    cheatBg.lineStyle(2, COLORS.CYBER_CYAN, 0.85);
    cheatBg.fillRoundedRect(-45, -35, 90, 70, 10);
    cheatBg.strokeRoundedRect(-45, -35, 90, 70, 10);

    const cheatIcon = this.add.text(0, -10, '📖', { fontSize: '24px' });
    cheatIcon.setOrigin(0.5);

    const cheatText = this.add.text(0, 18, i18n.t('btn_cheat_sheet'), {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#00f0ff',
      fontStyle: 'bold',
    });
    cheatText.setOrigin(0.5);

    cheatContainer.add([cheatBg, cheatIcon, cheatText]);

    const cheatZone = this.add.zone(cheatX, y, 90, 70);
    cheatZone.setInteractive({ useHandCursor: true });
    cheatZone.setDepth(151);
    cheatZone.on('pointerdown', () => {
      this.toggleCheatSheet();
    });
    cheatZone.setDepth(151);
    cheatZone.on('pointerdown', () => {
      this.toggleCheatSheet();
    });
  }

  private setupZoomAndPanControls(): void {
    // Desktop Mouse Wheel Zoom
    this.input.on('wheel', (_pointer: any, _gameObjects: any, _deltaX: number, deltaY: number) => {
      const zoomFactor = deltaY > 0 ? 0.92 : 1.08;
      this.setBoardZoom(this.boardScale * zoomFactor);
    });

    // Mobile Pinch-to-Zoom & 2-Finger Pan
    this.input.on('pointermove', () => {
      const pointer1 = this.input.pointer1;
      const pointer2 = this.input.pointer2;

      if (pointer1.isDown && pointer2.isDown) {
        const dist = Phaser.Math.Distance.Between(pointer1.x, pointer1.y, pointer2.x, pointer2.y);
        if (this.initialPinchDistance === 0) {
          this.initialPinchDistance = dist;
          this.initialScale = this.boardScale;
        } else {
          const factor = dist / this.initialPinchDistance;
          this.setBoardZoom(this.initialScale * factor);
        }
      } else {
        this.initialPinchDistance = 0;
      }
    });

    // Drag-to-Pan (when dragged on background area)
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.y > 190 && pointer.y < GAME_HEIGHT - 220) {
        this.isPanDragging = true;
        this.panStartPos = { x: pointer.x, y: pointer.y };
        this.containerStartPos = { x: this.boardContainer.x, y: this.boardContainer.y };
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isPanDragging && (!this.input.pointer2.isDown)) {
        const dx = pointer.x - this.panStartPos.x;
        const dy = pointer.y - this.panStartPos.y;
        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
          this.boardContainer.x = this.containerStartPos.x + dx;
          this.boardContainer.y = this.containerStartPos.y + dy;
        }
      }
    });

    this.input.on('pointerup', () => {
      this.isPanDragging = false;
      this.initialPinchDistance = 0;
    });
  }

  private setBoardZoom(scale: number): void {
    this.boardScale = Phaser.Math.Clamp(scale, 0.65, 2.2);
    this.boardContainer.setScale(this.boardScale);
  }

  private createResetZoomButton(): void {
    const btnContainer = this.add.container(GAME_WIDTH - 65, 175);
    btnContainer.setDepth(150);

    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x10253f, 0.88);
    btnBg.lineStyle(1.5, COLORS.CYBER_CYAN, 0.8);
    btnBg.fillRoundedRect(-46, -16, 92, 32, 6);
    btnBg.strokeRoundedRect(-46, -16, 92, 32, 6);

    const btnText = this.add.text(0, 0, i18n.t('btn_fit_screen'), {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#00f0ff',
      fontStyle: 'bold',
    });
    btnText.setOrigin(0.5);

    btnContainer.add([btnBg, btnText]);

    const zone = this.add.zone(0, 0, 92, 32);
    zone.setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => {
      this.tweens.add({
        targets: this.boardContainer,
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        duration: 250,
        ease: 'Quad.easeOut',
      });
      this.boardScale = 1.0;
    });
    btnContainer.add(zone);
  }

  private drawBottomUI(): void {
    const bottomBarY = GAME_HEIGHT - 230;

    // Status Panel for LEDs & Multi-Test-Cases
    const statusPanel = this.add.graphics();
    statusPanel.fillStyle(0x0a1c32, 0.92);
    statusPanel.lineStyle(1.5, COLORS.CYBER_CYAN, 0.6);
    statusPanel.fillRoundedRect(20, bottomBarY, GAME_WIDTH - 40, 42, 8);
    statusPanel.strokeRoundedRect(20, bottomBarY, GAME_WIDTH - 40, 42, 8);
    statusPanel.setDepth(120);

    this.ledStatusText = this.add.text(45, bottomBarY + 21, `${i18n.t('led_outputs')}: 0/0`, {
      fontSize: '13px',
      fontFamily: 'monospace',
      color: '#00ff88',
      fontStyle: 'bold',
    });
    this.ledStatusText.setOrigin(0, 0.5);
    this.ledStatusText.setDepth(121);

    if (this.testCases && this.testCases.length > 0) {
      this.clockStatusText = this.add.text(GAME_WIDTH - 45, bottomBarY + 21, `${i18n.t('clock_cycle')}: [1/${this.testCases.length}]`, {
        fontSize: '12px',
        fontFamily: 'monospace',
        color: '#ffd000',
        fontStyle: 'bold',
      });
      this.clockStatusText.setOrigin(1, 0.5);
      this.clockStatusText.setDepth(121);
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
        if (target === 1 && st.inputSignals.some((v) => v === 1)) {
          satisfied++;
        } else if (target === 0 && !st.inputSignals.some((v) => v === 1)) {
          satisfied++;
        }
      }
    }

    const isAll = satisfied === this.leds.length;
    this.ledStatusText.setText(`${i18n.t('led_outputs')}: ${satisfied}/${this.leds.length} ${isAll ? i18n.t('led_complete') : '⏳'}`);
    this.ledStatusText.setColor(isAll ? '#00ff88' : '#ffd000');
  }

  private useHint(): void {
    if (this.isWon || this.isTimeOver || this.isAnimating) return;

    const wrongGates: { r: number; c: number; cell: GateDefinition }[] = [];

    for (let r = 0; r < this.gridHeight; r++) {
      for (let c = 0; c < this.gridWidth; c++) {
        const cell = this.grid[r][c];
        if (
          cell &&
          !cell.fixed &&
          !cell.locked &&
          cell.type !== GateType.SOURCE &&
          cell.type !== GateType.LED &&
          cell.rotation !== cell.correctRotation
        ) {
          wrongGates.push({ r, c, cell });
        }
      }
    }

    if (wrongGates.length === 0) {
      this.showToast(i18n.t('toast_all_correct'));
      return;
    }

    const target = wrongGates[0];
    target.cell.rotation = target.cell.correctRotation;
    target.cell.locked = true;

    this.availableHints--;
    if (this.hintBtnText) {
      this.hintBtnText.setText(`${i18n.t('btn_hint')} (${Math.max(0, this.availableHints)})`);
    }

    const sprite = this.cellSprites[target.r]?.[target.c];
    const targetX = this.boardOffsetX + target.c * this.cellSize + this.cellSize / 2;
    const targetY = this.boardOffsetY + target.r * this.cellSize + this.cellSize / 2;

    if (this.player) {
      this.tweens.add({
        targets: this.player,
        x: targetX,
        y: targetY,
        duration: 200,
        ease: 'Sine.easeOut',
      });
    }

    if (sprite) {
      this.tweens.add({
        targets: sprite.container,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 150,
        yoyo: true,
        ease: 'Back.easeOut',
        onComplete: () => {
          this.drawGateInCell(target.r, target.c);
          this.createSparkEffect(targetX, targetY, true);
          this.propagateSignals();
        },
      });
    } else {
      this.propagateSignals();
    }

    this.showToast(i18n.t('toast_hint_used'));
  }

  private toggleCheatSheet(): void {
    if (this.cheatSheetGroup) {
      this.cheatSheetGroup.destroy();
      this.cheatSheetGroup = null;
      return;
    }

    const container = this.add.container(0, 0);
    container.setDepth(300);

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.85);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    overlay.setInteractive(new Phaser.Geom.Rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT), Phaser.Geom.Rectangle.Contains);
    overlay.on('pointerdown', () => this.toggleCheatSheet());

    const pw = 640;
    const ph = 800;
    const px = (GAME_WIDTH - pw) / 2;
    const py = (GAME_HEIGHT - ph) / 2 - 10;

    const panel = this.add.graphics();
    panel.fillStyle(0x0a1c32, 0.98);
    panel.lineStyle(2, COLORS.CYBER_CYAN, 0.9);
    panel.fillRoundedRect(px, py, pw, ph, 14);
    panel.strokeRoundedRect(px, py, pw, ph, 14);

    const title = this.add.text(GAME_WIDTH / 2, py + 26, i18n.t('cheat_sheet_title'), {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: '#00ff88',
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
      { name: i18n.t('cheat_diode_name'), rule: i18n.t('cheat_diode_desc'), color: '#4cc9f0' },
      { name: i18n.t('cheat_bridge_name'), rule: i18n.t('cheat_bridge_desc'), color: '#7209b7' },
      { name: i18n.t('cheat_split_name'), rule: i18n.t('cheat_split_desc'), color: '#f72585' },
    ];

    let itemY = py + 62;
    container.add([overlay, panel, title]);

    for (const item of cheatItems) {
      const card = this.add.graphics();
      card.fillStyle(0x10253e, 0.85);
      card.lineStyle(1.5, Phaser.Display.Color.HexStringToColor(item.color).color, 0.7);
      card.fillRoundedRect(px + 20, itemY, pw - 40, 58, 6);
      card.strokeRoundedRect(px + 20, itemY, pw - 40, 58, 6);

      const header = this.add.text(px + 36, itemY + 10, item.name, {
        fontSize: '14px',
        fontFamily: 'monospace',
        color: item.color,
        fontStyle: 'bold',
      });

      const rule = this.add.text(px + 36, itemY + 32, item.rule, {
        fontSize: '11px',
        fontFamily: 'monospace',
        color: '#cbe4ff',
      });

      container.add([card, header, rule]);
      itemY += 66;
    }

    const closeBtn = this.add.text(GAME_WIDTH / 2, py + ph - 25, i18n.t('btn_close'), {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#00f0ff',
      fontStyle: 'bold',
    });
    closeBtn.setOrigin(0.5);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.toggleCheatSheet());

    container.add(closeBtn);
    this.cheatSheetGroup = container;
  }

  private showToast(message: string): void {
    const toast = this.add.text(GAME_WIDTH / 2, 200, message, {
      fontSize: '13px',
      fontFamily: 'monospace',
      color: '#ffffff',
      backgroundColor: '#004433',
      padding: { x: 16, y: 8 },
    });
    toast.setOrigin(0.5);
    toast.setDepth(250);

    this.tweens.add({
      targets: toast,
      alpha: { from: 1, to: 0 },
      y: 180,
      duration: 1800,
      onComplete: () => toast.destroy(),
    });
  }

  private setupKeyboardControls(): void {
    if (!this.input.keyboard) return;

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      q: Phaser.Input.Keyboard.KeyCodes.Q,
      e: Phaser.Input.Keyboard.KeyCodes.E,
      z: Phaser.Input.Keyboard.KeyCodes.Z,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      enter: Phaser.Input.Keyboard.KeyCodes.ENTER,
    }) as { [key: string]: Phaser.Input.Keyboard.Key };

    // Rotate Right (Clockwise): SPACE, E, ENTER
    this.input.keyboard.on('keydown-SPACE', () => {
      this.rotateCurrentOrTargetGate(1);
    });
    this.input.keyboard.on('keydown-E', () => {
      this.rotateCurrentOrTargetGate(1);
    });
    this.input.keyboard.on('keydown-ENTER', () => {
      this.rotateCurrentOrTargetGate(1);
    });

    // Rotate Left (Counter-Clockwise): Q, Z
    this.input.keyboard.on('keydown-Q', () => {
      this.rotateCurrentOrTargetGate(-1);
    });
    this.input.keyboard.on('keydown-Z', () => {
      this.rotateCurrentOrTargetGate(-1);
    });

    this.input.keyboard.on('keydown-H', () => {
      this.useHint();
    });

    this.input.keyboard.on('keydown-C', () => {
      this.toggleCheatSheet();
    });
  }

  private selectCell(row: number, col: number): void {
    const cell = this.grid[row]?.[col];
    if (!cell || cell.fixed || cell.locked || cell.type === GateType.SOURCE || cell.type === GateType.LED) {
      return;
    }
    this.activeTargetCell = { row, col };
    this.updateTargetHighlight();

    const targetX = this.boardOffsetX + col * this.cellSize + this.cellSize / 2;
    const targetY = this.boardOffsetY + row * this.cellSize + this.cellSize / 2;
    if (this.player) {
      this.player.setFlipX(targetX < this.player.x);
      this.tweens.add({
        targets: this.player,
        x: targetX,
        y: targetY,
        duration: 120,
        ease: 'Quad.easeOut',
      });
    }
  }

  private rotateCurrentOrTargetGate(direction: 1 | -1 = 1): void {
    if (this.isWon || this.isTimeOver || this.isOutOfMoves) return;

    if (!this.activeTargetCell) {
      const closest = this.findClosestRotatableGate();
      if (closest) {
        this.selectCell(closest.row, closest.col);
      }
    }

    if (this.activeTargetCell) {
      const { row, col } = this.activeTargetCell;
      this.handleCellTap(row, col, direction);
    }
  }

  private findClosestRotatableGate(): { row: number; col: number } | null {
    let bestDist = Infinity;
    let bestCell: { row: number; col: number } | null = null;

    for (let r = 0; r < this.gridHeight; r++) {
      for (let c = 0; c < this.gridWidth; c++) {
        const cell = this.grid[r][c];
        if (cell && !cell.fixed && !cell.locked && cell.type !== GateType.SOURCE && cell.type !== GateType.LED) {
          const cx = this.boardOffsetX + c * this.cellSize + this.cellSize / 2;
          const cy = this.boardOffsetY + r * this.cellSize + this.cellSize / 2;
          const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, cx, cy);
          if (dist < bestDist) {
            bestDist = dist;
            bestCell = { row: r, col: c };
          }
        }
      }
    }

    return bestCell;
  }

  private createSparkEffect(x: number, y: number, golden: boolean = false): void {
    for (let i = 0; i < 12; i++) {
      const spark = this.add.sprite(x, y, 'particle_spark');
      spark.setDepth(60);
      spark.setScale(Phaser.Math.FloatBetween(0.6, 1.4));
      if (golden) {
        spark.setTint(0xffd700);
      }

      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speed = Phaser.Math.Between(50, 160);

      this.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0.1,
        duration: Phaser.Math.Between(260, 480),
        onComplete: () => spark.destroy(),
      });
    }
  }

  private calculateExactMinMoves(grid: (GateDefinition | null)[][]): number {
    let minMoves = 0;
    for (let r = 0; r < this.gridHeight; r++) {
      for (let c = 0; c < this.gridWidth; c++) {
        const cell = grid[r]?.[c];
        if (cell && !cell.fixed && !cell.locked && cell.type !== GateType.SOURCE && cell.type !== GateType.LED) {
          if (cell.type === GateType.WIRE) {
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
    return Math.max(minMoves, 2);
  }

  private updateMovesDisplay(): void {
    if (!this.movesText) return;
    const remaining = Math.max(0, this.maxMoves - this.movesCount);
    let starColor = '#ffd000';
    let starIcon = '⭐⭐⭐';

    if (this.movesCount <= this.parMoves) {
      starColor = '#ffd000';
      starIcon = '⭐⭐⭐';
    } else if (this.movesCount <= this.twoStarMoves) {
      starColor = '#00f0ff';
      starIcon = '⭐⭐☆';
    } else if (this.movesCount <= this.maxMoves) {
      starColor = '#ffaa44';
      starIcon = '⭐☆☆';
    }

    const turnsWarning = remaining <= 3 ? ` ${i18n.t('moves_warning', { rem: remaining })}` : '';
    this.movesText.setText(`${i18n.t('moves_label')}: ${this.movesCount}/${this.maxMoves} (${remaining} ${i18n.t('moves_rem_label')})${turnsWarning} | ${i18n.t('par_label')}: ${this.parMoves} ${starIcon}`);
    this.movesText.setColor(remaining <= 3 ? '#ff3344' : starColor);
  }

  private spawnRotationIndicator(x: number, y: number, direction: 1 | -1): void {
    const iconText = direction === 1 ? i18n.t('badge_rotate_right') : i18n.t('badge_rotate_left');
    const iconColor = direction === 1 ? '#ffd000' : '#00f0ff';
    const tag = this.add.text(x, y - 25, iconText, {
      fontSize: '13px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: iconColor,
      backgroundColor: '#0a192f',
      padding: { x: 5, y: 2 },
    });
    tag.setOrigin(0.5);
    tag.setDepth(200);

    this.tweens.add({
      targets: tag,
      y: y - 55,
      alpha: 0,
      duration: 400,
      ease: 'Quad.easeOut',
      onComplete: () => tag.destroy(),
    });
  }

  private triggerOutOfMoves(): void {
    if (this.isOutOfMoves || this.isWon) return;
    this.isOutOfMoves = true;
    this.cameras.main.shake(250, 0.012);
    this.showToast(i18n.getLanguage() === 'vi' ? '🚫 HẾT LƯỢT XOAY! MẠCH CHƯA ĐẠT YÊU CẦU.' : '🚫 OUT OF MOVES! CIRCUIT INCOMPLETE.');
    this.showOutOfMovesModal();
  }

  private showOutOfMovesModal(): void {
    if (this.modalGroup) return;

    const modal = this.add.container(0, 0);
    modal.setDepth(2000);

    const backdrop = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0.85
    );
    backdrop.setInteractive(new Phaser.Geom.Rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT), Phaser.Geom.Rectangle.Contains);
    backdrop.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.stopPropagation?.();
    });

    const py = GAME_HEIGHT / 2 - 20;
    const panelW = 480;
    const panelH = 380;

    const panel = this.add.graphics();
    panel.fillStyle(0x0e1b2e, 0.98);
    panel.lineStyle(2, 0xff2a55, 1);
    panel.fillRoundedRect(GAME_WIDTH / 2 - panelW / 2, py - panelH / 2, panelW, panelH, 16);
    panel.strokeRoundedRect(GAME_WIDTH / 2 - panelW / 2, py - panelH / 2, panelW, panelH, 16);

    const icon = this.add.text(GAME_WIDTH / 2, py - 120, '🚫', {
      fontSize: '52px',
    });
    icon.setOrigin(0.5);

    const title = this.add.text(GAME_WIDTH / 2, py - 55, i18n.t('out_of_moves_title'), {
      fontSize: '24px',
      fontFamily: 'monospace',
      color: '#ff2a55',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    const info = this.add.text(
      GAME_WIDTH / 2,
      py + 10,
      i18n.t('out_of_moves_desc', { moves: this.maxMoves, max: this.maxMoves, par: this.parMoves }),
      {
        fontSize: '13px',
        fontFamily: 'monospace',
        color: '#c0c8e0',
        align: 'center',
        lineSpacing: 6,
      }
    );
    info.setOrigin(0.5);

    const btnW = 340;
    const btnH = 46;

    const retryBtn = this.add.container(GAME_WIDTH / 2, py + 85);
    const retryBg = this.add.graphics();
    retryBg.fillStyle(0xff2a55, 1);
    retryBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 10);
    const retryText = this.add.text(0, 0, i18n.t('btn_retry'), {
      fontSize: '15px',
      fontFamily: 'monospace',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    retryText.setOrigin(0.5);
    retryBtn.add([retryBg, retryText]);

    const retryZone = this.add.zone(0, 0, btnW, btnH);
    retryZone.setInteractive({ useHandCursor: true });
    retryZone.on('pointerdown', () => {
      this.restartCurrentLevel();
    });
    retryBtn.add(retryZone);

    const selectBtn = this.add.container(GAME_WIDTH / 2, py + 145);
    const selectBg = this.add.graphics();
    selectBg.fillStyle(0x162a45, 1);
    selectBg.lineStyle(1.5, 0x00f0ff, 0.7);
    selectBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 10);
    selectBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 10);
    const selectText = this.add.text(0, 0, i18n.t('btn_levels_list'), {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#00f0ff',
      fontStyle: 'bold',
    });
    selectText.setOrigin(0.5);
    selectBtn.add([selectBg, selectText]);

    const selectZone = this.add.zone(0, 0, btnW, btnH);
    selectZone.setInteractive({ useHandCursor: true });
    selectZone.on('pointerdown', () => {
      this.cleanupAndNavigate('LevelSelectScene');
    });
    selectBtn.add(selectZone);

    modal.add([backdrop, panel, icon, title, info, retryBtn, selectBtn]);
    this.modalGroup = modal;
  }

  private setupTouchControls(): void {
    this.touchControls = new TouchControls(this);

    // Long press on any cell to open logic gate cheat sheet
    this.touchControls.setLongPressHandler((x: number, y: number) => {
      const { row, col } = this.screenToGrid(x, y);
      if (row >= 0 && row < this.gridHeight && col >= 0 && col < this.gridWidth) {
        this.toggleCheatSheet();
      }
    });
  }

  private screenToGrid(screenX: number, screenY: number): { row: number; col: number } {
    const col = Math.floor((screenX - this.boardOffsetX - this.boardContainer.x) / (this.cellSize * this.boardScale));
    const row = Math.floor((screenY - this.boardOffsetY - this.boardContainer.y) / (this.cellSize * this.boardScale));
    return { row, col };
  }

  private handleCellTap(row: number, col: number, direction: 1 | -1 = 1): void {
    const cell = this.grid[row][col];
    if (!cell || cell.fixed || cell.locked || this.isAnimating || this.isWon || this.isTimeOver || this.isOutOfMoves) return;

    // Track Moves and update HUD
    this.movesCount++;
    this.updateMovesDisplay();

    const targetX = this.boardOffsetX + col * this.cellSize + this.cellSize / 2;
    const targetY = this.boardOffsetY + row * this.cellSize + this.cellSize / 2;

    if (this.player) {
      this.player.setFlipX(targetX < this.player.x);
      this.tweens.add({
        targets: this.player,
        x: targetX,
        y: targetY,
        duration: 150,
        ease: 'Quad.easeOut',
      });
    }

    this.isAnimating = true;

    // Apply rotation
    if (cell.type === GateType.WIRE) {
      cell.rotation = (cell.rotation + 1) % 2;
    } else {
      if (direction === 1) {
        cell.rotation = (cell.rotation + 1) % 4;
      } else {
        cell.rotation = (cell.rotation + 3) % 4;
      }
    }

    // Spawn floating rotation indicator badge
    this.spawnRotationIndicator(targetX, targetY, direction);
    this.createSparkEffect(targetX, targetY);

    const onCompleteRotation = () => {
      this.drawGateInCell(row, col);
      this.propagateSignals();
      this.isAnimating = false;

      // Check Out of Moves: If not won and moves >= maxMoves, trigger Game Over!
      if (!this.isWon && this.movesCount >= this.maxMoves && !this.isOutOfMoves) {
        this.triggerOutOfMoves();
      }
    };

    const sprite = this.cellSprites[row]?.[col];
    if (sprite) {
      this.tweens.add({
        targets: sprite.container,
        scaleX: 1.14,
        scaleY: 1.14,
        duration: ANIM.ROTATE_DURATION / 2,
        yoyo: true,
        ease: 'Sine.easeOut',
        onComplete: onCompleteRotation,
      });
    } else {
      onCompleteRotation();
    }
  }

  private propagateSignals(): void {
    this.signalEngine.updateGrid(this.grid);
    const states = this.signalEngine.propagate(this.sources);

    // Update Short-Circuit Warnings
    this.updateShortCircuitVisuals();

    // Update LEDs graphics
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
            sprite.gateGraphics.fillStyle(target === 1 ? COLORS.LED_GLOW : 0x00f5d4, 0.2);
            sprite.gateGraphics.fillCircle(0, 0, s + 10);
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

          // Contact wire
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
            // Draw output pin signal dot
            sprite.signalIndicator.fillStyle(isOne ? 0x00ff88 : 0x0088cc, 0.95);
            sprite.signalIndicator.lineStyle(1.5, 0xffffff, 0.9);
            sprite.signalIndicator.fillCircle(halfSize - 6, 0, 4);
            sprite.signalIndicator.strokeCircle(halfSize - 6, 0, 4);
          }
        }
      }
    }

    this.updateLedStatus();

    // Check Win Condition:
    // If multi-test-cases exist, evaluate all of them
    let isWin = false;
    if (this.testCases && this.testCases.length > 0) {
      const res = this.signalEngine.evaluateAllTestCases(this.testCases);
      isWin = res.allPassed;
      if (this.clockStatusText) {
        const passedCount = res.results.filter(Boolean).length;
        this.clockStatusText.setText(`⏱️ CHU KỲ: [${passedCount}/${this.testCases.length}] ${isWin ? '✅' : '⏳'}`);
      }
    } else {
      isWin = this.signalEngine.checkWin(this.leds);
    }

    if (isWin && !this.isWon) {
      this.isWon = true;
      this.updateLedStatus();
      this.celebrateWinAndShowModal();
    } else if (!isWin && !this.isWon && this.movesCount >= this.maxMoves && !this.isOutOfMoves) {
      this.triggerOutOfMoves();
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

  private celebrateWinAndShowModal(): void {
    try {
      let starsCount = 1;
      if (this.movesCount <= this.parMoves) {
        starsCount = 3;
      } else if (this.movesCount <= this.twoStarMoves) {
        starsCount = 2;
      }

      if (!this.isEndless) {
        ProgressManager.unlockNextLevel(this.levelId);
        ProgressManager.saveStars(this.levelId, starsCount);
      } else {
        const streak = ProgressManager.getEndlessStreak();
        ProgressManager.saveEndlessStreak(Math.max(streak, this.levelId - 100));
      }

      this.showNextLevelHudButton();

      // Fireworks
      const colors = [0x00ff88, 0x00f0ff, 0xff007f, 0xffd000, 0x8b00ff];
      for (let burst = 0; burst < 3; burst++) {
        this.time.delayedCall(burst * 180, () => {
          try {
            const bx = Phaser.Math.Between(100, GAME_WIDTH - 100);
            const by = Phaser.Math.Between(220, GAME_HEIGHT - 380);

            for (let i = 0; i < 20; i++) {
              const color = Phaser.Math.RND.pick(colors);
              const colorRgba = Phaser.Display.Color.IntegerToColor(color).rgba;
              const star = this.add.text(bx, by, '✦', {
                fontSize: `${Phaser.Math.Between(14, 24)}px`,
                color: colorRgba,
              });
              star.setOrigin(0.5);
              star.setDepth(700);

              const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
              const dist = Phaser.Math.Between(40, 180);

              this.tweens.add({
                targets: star,
                x: bx + Math.cos(angle) * dist,
                y: by + Math.sin(angle) * dist,
                alpha: { from: 1, to: 0 },
                scale: { from: 1.4, to: 0.2 },
                duration: Phaser.Math.Between(600, 1100),
                ease: 'Quad.easeOut',
                onComplete: () => star.destroy(),
              });
            }
          } catch (e) {}
        });
      }

      this.time.delayedCall(ANIM.WIN_DELAY, () => {
        this.openVictoryModal(starsCount);
      });
    } catch (err) {
      console.warn('celebrateWin error:', err);
    }
  }

  private showNextLevelHudButton(): void {
    if (this.headerNextBtn) {
      this.headerNextBtn.setVisible(true);
      const txt = this.headerNextBtn.list[1] as Phaser.GameObjects.Text;
      if (txt) {
        txt.setText(this.isEndless ? i18n.t('btn_next_endless') : i18n.t('btn_next_level', { next: this.levelId + 1 }));
      }
    }

    if (this.nextLevelHudContainer) return;

    const hudY = GAME_HEIGHT - 230;
    this.nextLevelHudContainer = this.add.container(GAME_WIDTH / 2, hudY);
    this.nextLevelHudContainer.setDepth(750);

    const btnWidth = 320;
    const btnHeight = 44;

    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x00ff88, 1);
    btnBg.lineStyle(2, 0xffffff, 1);
    btnBg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 10);
    btnBg.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 10);

    const btnLabel = this.add.text(
      0,
      0,
      this.isEndless ? i18n.t('btn_next_endless') : i18n.t('btn_next_level', { next: this.levelId + 1 }),
      {
        fontSize: '16px',
        fontFamily: 'monospace',
        color: '#061a12',
        fontStyle: 'bold',
      }
    );
    btnLabel.setOrigin(0.5);

    this.nextLevelHudContainer.add([btnBg, btnLabel]);

    const zone = this.add.zone(0, 0, btnWidth, btnHeight);
    zone.setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => {
      this.loadNextLevel(this.levelId + 1);
    });
    this.nextLevelHudContainer.add(zone);

    this.tweens.add({
      targets: this.nextLevelHudContainer,
      scaleX: { from: 0.95, to: 1.05 },
      scaleY: { from: 0.95, to: 1.05 },
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private openVictoryModal(starsCount: number): void {
    if (this.modalGroup) {
      this.modalGroup.destroy();
      this.modalGroup = null;
    }

    const container = this.add.container(0, 0);
    container.setDepth(800);

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.8);
    overlay.fillRect(0, this.headerHeight, GAME_WIDTH, GAME_HEIGHT - this.headerHeight);
    container.add(overlay);

    const pw = 580;
    const ph = 520;
    const px = (GAME_WIDTH - pw) / 2;
    const py = (GAME_HEIGHT - ph) / 2 - 20;

    const panel = this.add.graphics();
    panel.fillStyle(0x0a1d35, 0.98);
    panel.lineStyle(2.5, COLORS.SIGNAL_ON, 1);
    panel.fillRoundedRect(px, py, pw, ph, 16);
    panel.strokeRoundedRect(px, py, pw, ph, 16);
    container.add(panel);

    const closeBtn = this.add.text(px + pw - 28, py + 26, '✕', {
      fontSize: '22px',
      fontFamily: 'monospace',
      color: '#88aacc',
      fontStyle: 'bold',
    });
    closeBtn.setOrigin(0.5);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => {
      if (this.modalGroup) {
        this.modalGroup.destroy();
        this.modalGroup = null;
      }
    });
    container.add(closeBtn);

    const trophy = this.add.text(GAME_WIDTH / 2, py + 48, '🎉', { fontSize: '48px' });
    trophy.setOrigin(0.5);

    const winTitle = this.isEndless
      ? i18n.t('win_endless_title', { level: this.levelId - 100 })
      : i18n.t('win_title', { level: this.levelId });
    const title = this.add.text(GAME_WIDTH / 2, py + 104, winTitle, {
      fontSize: '24px',
      fontFamily: 'monospace',
      color: '#00ff88',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    const starIcons = starsCount === 3 ? '⭐⭐⭐' : starsCount === 2 ? '⭐⭐☆' : '⭐☆☆';
    const starsText = this.add.text(GAME_WIDTH / 2, py + 145, starIcons, { fontSize: '34px' });
    starsText.setOrigin(0.5);

    const ratingText = starsCount === 3 ? i18n.t('rating_3_stars') : starsCount === 2 ? i18n.t('rating_2_stars') : i18n.t('rating_1_star');
    const statsText = this.add.text(
      GAME_WIDTH / 2,
      py + 195,
      `${i18n.t('win_moves_stat', { moves: this.movesCount, max: this.maxMoves, par: this.parMoves })}\n${ratingText}`,
      {
        fontSize: '13px',
        fontFamily: 'monospace',
        color: '#00f0ff',
        align: 'center',
        lineSpacing: 6,
      }
    );
    statsText.setOrigin(0.5);

    // Modal Action Buttons
    const btnW = 380;
    const btnH = 46;

    // Button 1: Next Level
    const nextBtnContainer = this.add.container(GAME_WIDTH / 2, py + 265);
    const nextBg = this.add.graphics();
    nextBg.fillStyle(0x00ff88, 1);
    nextBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 8);
    const nextText = this.add.text(
      0,
      0,
      this.isEndless
        ? i18n.t('btn_next_endless')
        : i18n.t('btn_continue_next', { next: this.levelId + 1 }),
      {
        fontSize: '15px',
        fontFamily: 'monospace',
        color: '#05111f',
        fontStyle: 'bold',
      }
    );
    nextText.setOrigin(0.5);
    nextBtnContainer.add([nextBg, nextText]);

    const nextZone = this.add.zone(0, 0, btnW, btnH);
    nextZone.setInteractive({ useHandCursor: true });
    nextZone.on('pointerdown', () => {
      this.loadNextLevel(this.levelId + 1);
    });
    nextBtnContainer.add(nextZone);

    // Button 2: Replay
    const replayBtnContainer = this.add.container(GAME_WIDTH / 2, py + 325);
    const replayBg = this.add.graphics();
    replayBg.fillStyle(0x112740, 1);
    replayBg.lineStyle(1.5, 0x00a8cc, 0.9);
    replayBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 8);
    replayBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 8);
    const replayText = this.add.text(0, 0, i18n.t('btn_replay'), {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#00f0ff',
      fontStyle: 'bold',
    });
    replayText.setOrigin(0.5);
    replayBtnContainer.add([replayBg, replayText]);

    const replayZone = this.add.zone(0, 0, btnW, btnH);
    replayZone.setInteractive({ useHandCursor: true });
    replayZone.on('pointerdown', () => {
      this.restartCurrentLevel();
    });
    replayBtnContainer.add(replayZone);

    // Button 3: Choose Level
    const selectBtnContainer = this.add.container(GAME_WIDTH / 2, py + 385);
    const selectBg = this.add.graphics();
    selectBg.fillStyle(0x112740, 1);
    selectBg.lineStyle(1.5, 0x8888cc, 0.7);
    selectBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 8);
    selectBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 8);
    const selectText = this.add.text(0, 0, i18n.t('btn_levels_list'), {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#c0c8e0',
      fontStyle: 'bold',
    });
    selectText.setOrigin(0.5);
    selectBtnContainer.add([selectBg, selectText]);

    const selectZone = this.add.zone(0, 0, btnW, btnH);
    selectZone.setInteractive({ useHandCursor: true });
    selectZone.on('pointerdown', () => {
      this.cleanupAndNavigate('LevelSelectScene');
    });
    selectBtnContainer.add(selectZone);

    container.add([
      trophy,
      title,
      starsText,
      statsText,
      nextBtnContainer,
      replayBtnContainer,
      selectBtnContainer,
    ]);

    this.modalGroup = container;
  }

  private loadNextLevel(nextLevelId: number): void {
    this.cleanupInputHandlers();
    this.cameras.main.resetFX();
    this.cameras.main.setAlpha(1);

    if (this.isEndless) {
      this.scene.start('GameScene', { levelId: nextLevelId, isEndless: true });
    } else if (nextLevelId > MAX_LEVELS) {
      this.scene.start('LevelSelectScene');
    } else {
      this.scene.start('GameScene', { levelId: nextLevelId });
    }
  }

  private restartCurrentLevel(): void {
    this.cleanupInputHandlers();
    this.cameras.main.resetFX();
    this.cameras.main.setAlpha(1);
    this.scene.start('GameScene', {
      levelId: this.levelId,
      isEndless: this.isEndless,
    });
  }

  private cleanupAndNavigate(sceneKey: string): void {
    this.cleanupInputHandlers();
    this.cameras.main.resetFX();
    this.cameras.main.setAlpha(1);
    this.scene.start(sceneKey);
  }

  private cleanupInputHandlers(): void {
    if (this.virtualJoystick) {
      this.virtualJoystick.destroy();
    }
    if (this.touchControls) {
      this.touchControls.destroy();
    }
    this.input.off('pointerdown');
    this.input.off('pointermove');
    this.input.off('pointerup');
    this.input.off('wheel');
    if (this.input.keyboard) {
      this.input.keyboard.removeAllListeners();
    }
  }

  update(_time: number, delta: number): void {
    if (this.isWon) return;

    // Timer countdown
    if (!this.isTimeOver && this.totalTimeLimit > 0) {
      this.timeRemaining -= delta / 1000;
      if (this.timeRemaining <= 0) {
        this.timeRemaining = 0;
        this.isTimeOver = true;
        this.showToast('⏱️ HẾT GIỜ! HÃY BẤM LÀM LẠI ĐỂ THỬ LẠI.');
      }
      this.timerText.setText(this.formatTime(this.timeRemaining));
      this.updateTimerBar();
    }

    // Joystick and Player movement
    if (this.player && this.virtualJoystick) {
      const joy = this.virtualJoystick.getValue();
      let vx = joy.x;
      let vy = joy.y;

      // Keyboard overrides
      if (this.cursors || this.keys) {
        if (this.cursors?.left.isDown || this.keys?.a.isDown) vx = -1;
        if (this.cursors?.right.isDown || this.keys?.d.isDown) vx = 1;
        if (this.cursors?.up.isDown || this.keys?.w.isDown) vy = -1;
        if (this.cursors?.down.isDown || this.keys?.s.isDown) vy = 1;
      }

      if (vx !== 0 || vy !== 0) {
        const len = Math.hypot(vx, vy);
        const normX = vx / len;
        const normY = vy / len;

        const moveSpeed = (this.playerSpeed * delta) / 1000;
        this.player.x += normX * moveSpeed;
        this.player.y += normY * moveSpeed;

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

        // Update active target cell
        this.activeTargetCell = this.findClosestRotatableGate();
      }
    }

    // Highlight target cell under or closest to player
    this.updateTargetHighlight();

    // Pulse animation on active wires
    this.updateElectricPulseEffect();
  }

  private updateTargetHighlight(): void {
    if (!this.targetCellHighlight) return;

    this.targetCellHighlight.clear();
    if (!this.activeTargetCell || this.isWon || this.isTimeOver || this.isOutOfMoves) return;

    const { row, col } = this.activeTargetCell;
    const x = this.boardOffsetX + col * this.cellSize + this.cellSize / 2;
    const y = this.boardOffsetY + row * this.cellSize + this.cellSize / 2;
    const half = this.cellSize / 2;

    // Glowing Cyberpunk Outer Box
    this.targetCellHighlight.lineStyle(2.5, 0x00f0ff, 0.95);
    this.targetCellHighlight.strokeRoundedRect(x - half + 1, y - half + 1, this.cellSize - 2, this.cellSize - 2, 8);

    // Left half indicator tint: Subtle cyan glow for Left Rotation ↺
    this.targetCellHighlight.fillStyle(0x00f0ff, 0.09);
    this.targetCellHighlight.fillRect(x - half + 3, y - half + 3, half - 3, this.cellSize - 6);

    // Right half indicator tint: Subtle yellow glow for Right Rotation ↻
    this.targetCellHighlight.fillStyle(0xffd000, 0.09);
    this.targetCellHighlight.fillRect(x, y - half + 3, half - 3, this.cellSize - 6);

    // Center divider line
    this.targetCellHighlight.lineStyle(1.5, 0x3a5a7a, 0.7);
    this.targetCellHighlight.beginPath();
    this.targetCellHighlight.moveTo(x, y - half + 4);
    this.targetCellHighlight.lineTo(x, y + half - 4);
    this.targetCellHighlight.strokePath();

    // Corner accents
    const arm = Math.min(16, this.cellSize * 0.25);
    this.targetCellHighlight.lineStyle(3, 0xffd000, 1);
    // Top-Left
    this.targetCellHighlight.beginPath();
    this.targetCellHighlight.moveTo(x - half, y - half + arm);
    this.targetCellHighlight.lineTo(x - half, y - half);
    this.targetCellHighlight.lineTo(x - half + arm, y - half);
    // Top-Right
    this.targetCellHighlight.moveTo(x + half - arm, y - half);
    this.targetCellHighlight.lineTo(x + half, y - half);
    this.targetCellHighlight.lineTo(x + half, y - half + arm);
    // Bottom-Left
    this.targetCellHighlight.moveTo(x - half, y + half - arm);
    this.targetCellHighlight.lineTo(x - half, y + half);
    this.targetCellHighlight.lineTo(x - half + arm, y + half);
    // Bottom-Right
    this.targetCellHighlight.moveTo(x + half - arm, y + half);
    this.targetCellHighlight.lineTo(x + half, y + half);
    this.targetCellHighlight.lineTo(x + half, y + half - arm);
    this.targetCellHighlight.strokePath();
  }
}
