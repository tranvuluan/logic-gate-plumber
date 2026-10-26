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
} from '../utils/Constants';
import { TouchControls } from '../utils/TouchControls';
import { ProceduralGraphics } from '../graphics/ProceduralGraphics';
import { SignalEngine } from '../logic/SignalEngine';
import { getLevels } from '../logic/LevelGenerator';
import { getRotatedPorts } from '../logic/GateTypes';
import { VirtualJoystick } from '../utils/VirtualJoystick';
import { ProgressManager } from '../utils/ProgressManager';

interface CellSprite {
  container: Phaser.GameObjects.Container;
  gateGraphics: Phaser.GameObjects.Graphics;
  label: Phaser.GameObjects.Text;
  signalIndicator: Phaser.GameObjects.Graphics;
  lockIcon?: Phaser.GameObjects.Sprite;
}

export class GameScene extends Phaser.Scene {
  private levelId: number = 1;
  private levelName: string = '';
  private levelSubtitle: string = '';
  private tutorialText: string = '';
  private grid: (GateDefinition | null)[][] = [];
  private gridWidth: number = 3;
  private gridHeight: number = 3;
  private cellSprites: (CellSprite | null)[][] = [];
  private signalEngine!: SignalEngine;
  private touchControls!: TouchControls;
  private boardOffsetX: number = 0;
  private boardOffsetY: number = 0;
  private sources: { row: number; col: number; value: number }[] = [];
  private leds: { row: number; col: number }[] = [];
  private boardContainer!: Phaser.GameObjects.Container;
  private isAnimating: boolean = false;
  private isWon: boolean = false;
  private isTimeOver: boolean = false;
  private cheatSheetGroup: Phaser.GameObjects.Container | null = null;
  private modalGroup: Phaser.GameObjects.Container | null = null;
  private headerHeight: number = 110;
  private availableHints: number = 3;

  // Level Countdown Timer
  private totalTimeLimit: number = 60;
  private timeRemaining: number = 60;
  private timerText!: Phaser.GameObjects.Text;
  private timerBarGraphics!: Phaser.GameObjects.Graphics;

  // Real-time electric pulse effect layer
  private electricPulseGraphics!: Phaser.GameObjects.Graphics;
  private pulseOffset: number = 0;

  // Plumber character and controls
  private player!: Phaser.GameObjects.Sprite;
  private playerSpeed: number = 260;
  private virtualJoystick!: VirtualJoystick;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys?: { [key: string]: Phaser.Input.Keyboard.Key };
  private activeTargetCell: { row: number; col: number } | null = null;
  private targetCellHighlight!: Phaser.GameObjects.Graphics;
  private actionButtonContainer!: Phaser.GameObjects.Container;
  private actionButtonBg!: Phaser.GameObjects.Arc;
  private hintBtnText!: Phaser.GameObjects.Text;

  // In-Game Next Level HUD & Header buttons
  private ledStatusText?: Phaser.GameObjects.Text;
  private nextLevelHudContainer: Phaser.GameObjects.Container | null = null;
  private headerNextBtn: Phaser.GameObjects.Container | null = null;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { levelId: number }): void {
    this.levelId = data.levelId || 1;
    this.isWon = false;
    this.isTimeOver = false;
    this.isAnimating = false;
    this.pulseOffset = 0;
    this.availableHints = 3;
    this.nextLevelHudContainer = null;
    this.headerNextBtn = null;
    this.modalGroup = null;
    this.cheatSheetGroup = null;
  }

  create(): void {
    // CRITICAL: Reset camera effects to guarantee no black screen
    this.cameras.main.resetFX();
    this.cameras.main.setAlpha(1);

    // Load level data
    const levels = getLevels();
    const level = levels.find((l) => l.id === this.levelId) || levels[0];

    this.levelId = level.id;
    this.levelName = level.name;
    this.levelSubtitle = level.subtitle;
    this.tutorialText = level.tutorialText;
    this.totalTimeLimit = level.timeLimit || 60;
    this.timeRemaining = this.totalTimeLimit;

    this.gridWidth = level.gridWidth;
    this.gridHeight = level.gridHeight;
    this.sources = level.sources;
    this.leds = level.leds;

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

    // Randomize initial rotation for puzzle
    this.randomizeRotations();

    // Initialize BFS signal engine
    this.signalEngine = new SignalEngine(this.grid, this.gridHeight, this.gridWidth);

    // Draw Cyberpunk Background
    const bg = this.add.graphics();
    const procGraphics = new ProceduralGraphics(this);
    procGraphics.drawBackground(bg, GAME_WIDTH, GAME_HEIGHT);

    // Draw Header with Timer
    this.drawHeader();

    // Draw Tutorial Banner
    this.drawTutorialBanner();

    // Calculate Board Layout
    const boardWidth = this.gridWidth * CELL_SIZE;
    const boardHeight = this.gridHeight * CELL_SIZE;
    this.boardOffsetX = (GAME_WIDTH - boardWidth) / 2;
    this.boardOffsetY = 240 + (GAME_HEIGHT - 240 - 290 - boardHeight) / 2;

    // Board container
    this.boardContainer = this.add.container(0, 0);

    // Board background frame
    const gridBg = this.add.graphics();
    procGraphics.drawGridBackground(
      gridBg,
      this.boardOffsetX,
      this.boardOffsetY,
      this.gridWidth,
      this.gridHeight,
      CELL_SIZE
    );
    this.boardContainer.add(gridBg);

    // Create cell sprites
    this.createCellSprites();

    // Electric pulse layer
    this.electricPulseGraphics = this.add.graphics();
    this.electricPulseGraphics.setDepth(35);
    this.boardContainer.add(this.electricPulseGraphics);

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

    // Bottom UI Bar (created before signal propagation)
    this.drawBottomUI();

    // Initial signal propagation
    this.propagateSignals();
  }

  private randomizeRotations(): void {
    for (let r = 0; r < this.gridHeight; r++) {
      for (let c = 0; c < this.gridWidth; c++) {
        const cell = this.grid[r][c];
        if (cell && !cell.fixed && cell.type !== GateType.SOURCE && cell.type !== GateType.LED) {
          if (cell.type === GateType.WIRE) {
            // Straight wire: ensure initial orientation is perpendicular to correctRotation
            cell.rotation = (cell.correctRotation + 1) % 2;
          } else if (cell.rotation === cell.correctRotation) {
            cell.rotation = (cell.correctRotation + Phaser.Math.Between(1, 3)) % 4;
          }
        }
      }
    }
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

    // Back to Level Select with touch-friendly container (always above modal)
    const backBtnContainer = this.add.container(78, 38);
    backBtnContainer.setDepth(1002);
    const backBg = this.add.rectangle(0, 0, 116, 36, 0x112740, 0.92);
    backBg.setStrokeStyle(1.5, 0x00f0ff, 0.8);
    backBg.setInteractive({ useHandCursor: true });
    const backBtnText = this.add.text(0, 0, '← CHỌN MÀN', {
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
    const title = this.add.text(GAME_WIDTH / 2, 20, this.levelName, {
      fontSize: '22px',
      fontFamily: 'monospace',
      color: '#00ff88',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5, 0);
    title.setDepth(1000);

    // Subtitle
    const subtitle = this.add.text(GAME_WIDTH / 2, 48, this.levelSubtitle, {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#88b0d0',
    });
    subtitle.setOrigin(0.5, 0);
    subtitle.setDepth(1000);

    // Header Next Level Button (shown when level is solved)
    this.headerNextBtn = this.add.container(GAME_WIDTH / 2, 82);
    this.headerNextBtn.setDepth(1002);
    const nextHdrBg = this.add.rectangle(0, 0, 200, 30, 0x00ff88, 1);
    nextHdrBg.setStrokeStyle(1.5, 0xffffff, 1);
    nextHdrBg.setInteractive({ useHandCursor: true });
    const nextHdrText = this.add.text(0, 0, `⏩ QUA MÀN ${this.levelId + 1} ➔`, {
      fontSize: '13px',
      fontFamily: 'monospace',
      color: '#061a12',
      fontStyle: 'bold',
    });
    nextHdrText.setOrigin(0.5);
    this.headerNextBtn.add([nextHdrBg, nextHdrText]);
    this.headerNextBtn.setVisible(false);

    nextHdrBg.on('pointerdown', () => {
      if (this.levelId >= 20) {
        this.cleanupAndNavigate('LevelSelectScene');
      } else {
        this.loadNextLevel(this.levelId + 1);
      }
    });

    // Digital Countdown Timer Display
    this.timerText = this.add.text(GAME_WIDTH - 25, 24, this.formatTime(this.timeRemaining), {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#ffd000',
      fontStyle: 'bold',
    });
    this.timerText.setOrigin(1, 0);
    this.timerText.setDepth(1000);

    // Restart button with touch-friendly container (always above modal)
    const restartContainer = this.add.container(GAME_WIDTH - 65, 68);
    restartContainer.setDepth(1002);
    const restartBg = this.add.rectangle(0, 0, 96, 30, 0x301525, 0.92);
    restartBg.setStrokeStyle(1.5, 0xff6688, 0.85);
    restartBg.setInteractive({ useHandCursor: true });
    const restartText = this.add.text(0, 0, '↻ LÀM LẠI', {
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

    // Background track
    this.timerBarGraphics.fillStyle(0x112233, 1);
    this.timerBarGraphics.fillRect(0, 0, GAME_WIDTH, 4);

    // Filled progress bar
    let barColor = COLORS.SIGNAL_ON;
    if (this.timeRemaining <= 15) {
      barColor = 0xff0055; // Warning red
    } else if (ratio < 0.4) {
      barColor = COLORS.CYBER_YELLOW;
    }

    this.timerBarGraphics.fillStyle(barColor, 1);
    this.timerBarGraphics.fillRect(0, 0, GAME_WIDTH * ratio, 4);
  }

  private drawTutorialBanner(): void {
    const bannerY = 116;
    const bannerH = 74;
    const bannerW = GAME_WIDTH - 40;

    const bannerBg = this.add.graphics();
    bannerBg.fillStyle(0x0c2036, 0.88);
    bannerBg.lineStyle(1.5, COLORS.CYBER_CYAN, 0.6);
    bannerBg.fillRoundedRect(20, bannerY, bannerW, bannerH, 10);
    bannerBg.strokeRoundedRect(20, bannerY, bannerW, bannerH, 10);
    bannerBg.setDepth(90);

    const guideIcon = this.add.text(38, bannerY + bannerH / 2, '💡', {
      fontSize: '24px',
    });
    guideIcon.setOrigin(0, 0.5);
    guideIcon.setDepth(91);

    const guideText = this.add.text(78, bannerY + 12, this.tutorialText, {
      fontSize: '13px',
      fontFamily: 'monospace',
      color: '#d0e8ff',
      wordWrap: { width: bannerW - 90 },
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
        const x = this.boardOffsetX + c * CELL_SIZE + CELL_SIZE / 2;
        const y = this.boardOffsetY + r * CELL_SIZE + CELL_SIZE / 2;

        if (!gate) {
          const emptyG = this.add.sprite(x, y, 'cell_empty');
          emptyG.setDepth(15);
          this.boardContainer.add(emptyG);
          this.cellSprites[r][c] = null;
          continue;
        }

        const container = this.add.container(x, y);
        container.setDepth(20);

        const gateGraphics = this.add.graphics();
        const signalIndicator = this.add.graphics();
        const label = this.add.text(0, 0, '', {
          fontSize: '18px',
          fontFamily: 'monospace',
          color: '#ffffff',
          fontStyle: 'bold',
        });
        label.setOrigin(0.5);

        const lockIcon = this.add.sprite(CELL_SIZE / 2 - 14, -CELL_SIZE / 2 + 14, 'icon_padlock');
        lockIcon.setScale(0.8);
        lockIcon.setVisible(!!gate.locked);

        container.add([gateGraphics, signalIndicator, label, lockIcon]);
        this.boardContainer.add(container);

        // Direct interactive hit area for instant, bulletproof cell tapping
        const hitArea = new Phaser.Geom.Rectangle(-CELL_SIZE / 2, -CELL_SIZE / 2, CELL_SIZE, CELL_SIZE);
        container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
        const cellR = r;
        const cellC = c;
        container.on('pointerdown', () => {
          this.handleCellTap(cellR, cellC);
        });

        this.cellSprites[r][c] = {
          container,
          gateGraphics,
          label,
          signalIndicator,
          lockIcon,
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

    const halfSize = CELL_SIZE / 2 - 5;

    if (cell.locked) {
      g.fillStyle(COLORS.GATE_BODY_LOCKED, 0.95);
      g.lineStyle(2.5, COLORS.GATE_BORDER_LOCKED, 1);
    } else if (cell.fixed) {
      g.fillStyle(0x0a1828, 0.85);
      g.lineStyle(1.5, 0x1f3c5a, 0.7);
    } else {
      g.fillStyle(COLORS.GATE_BODY, 0.95);
      g.lineStyle(2, COLORS.GATE_BORDER, 0.85);
    }
    g.fillRoundedRect(-halfSize, -halfSize, halfSize * 2, halfSize * 2, 8);
    g.strokeRoundedRect(-halfSize, -halfSize, halfSize * 2, halfSize * 2, 8);

    this.drawGateInner(g, cell.type, halfSize);

    sprite.container.setAngle(cell.rotation * 90);
    sprite.label.setAngle(-cell.rotation * 90);
    sprite.label.setText(this.getGateLabel(cell.type));
    sprite.label.setFontSize(this.getGateFontSize(cell.type));

    if (sprite.lockIcon) {
      sprite.lockIcon.setVisible(!!cell.locked);
      sprite.lockIcon.setAngle(-cell.rotation * 90);
    }
  }

  private drawGateInner(g: Phaser.GameObjects.Graphics, type: GateType, halfSize: number): void {
    const s = halfSize * 0.65;

    switch (type) {
      case GateType.WIRE:
        g.lineStyle(10, COLORS.SIGNAL_OFF, 1);
        g.beginPath();
        g.moveTo(-halfSize - 4, 0);
        g.lineTo(halfSize + 4, 0);
        g.strokePath();

        g.lineStyle(4, COLORS.WIRE_COPPER, 1);
        g.beginPath();
        g.moveTo(-halfSize - 4, 0);
        g.lineTo(halfSize + 4, 0);
        g.strokePath();

        g.fillStyle(COLORS.CYBER_YELLOW, 1);
        g.fillCircle(0, 0, 5);
        break;

      case GateType.WIRE_CORNER:
        g.lineStyle(10, COLORS.SIGNAL_OFF, 1);
        g.beginPath();
        g.moveTo(-halfSize - 4, 0);
        g.lineTo(0, 0);
        g.lineTo(0, halfSize + 4);
        g.strokePath();

        g.lineStyle(4, COLORS.WIRE_COPPER, 1);
        g.beginPath();
        g.moveTo(-halfSize - 4, 0);
        g.lineTo(0, 0);
        g.lineTo(0, halfSize + 4);
        g.strokePath();

        g.fillStyle(COLORS.CYBER_YELLOW, 1);
        g.fillCircle(0, 0, 6);
        break;

      case GateType.SPLIT:
        g.lineStyle(10, COLORS.SIGNAL_OFF, 1);
        g.beginPath();
        g.moveTo(-halfSize - 4, 0);
        g.lineTo(halfSize + 4, 0);
        g.moveTo(0, 0);
        g.lineTo(0, halfSize + 4);
        g.strokePath();

        g.lineStyle(4, COLORS.WIRE_COPPER, 1);
        g.beginPath();
        g.moveTo(-halfSize - 4, 0);
        g.lineTo(halfSize + 4, 0);
        g.moveTo(0, 0);
        g.lineTo(0, halfSize + 4);
        g.strokePath();

        g.fillStyle(COLORS.CYBER_YELLOW, 1);
        g.fillCircle(0, 0, 7);
        break;

      case GateType.AND:
        g.lineStyle(3, COLORS.CYBER_CYAN, 1);
        g.beginPath();
        g.moveTo(-s * 0.7, -s * 0.85);
        g.lineTo(0, -s * 0.85);
        g.arc(0, 0, s * 0.85, -Math.PI / 2, Math.PI / 2, false);
        g.lineTo(-s * 0.7, s * 0.85);
        g.closePath();
        g.strokePath();

        g.lineStyle(3, COLORS.CYBER_YELLOW, 0.9);
        g.beginPath();
        g.moveTo(0, -halfSize);
        g.lineTo(0, -s * 0.85);
        g.moveTo(0, s * 0.85);
        g.lineTo(0, halfSize);
        g.strokePath();

        g.lineStyle(3, COLORS.SIGNAL_ON, 1);
        g.beginPath();
        g.moveTo(s * 0.85, 0);
        g.lineTo(halfSize, 0);
        g.strokePath();
        break;

      case GateType.OR:
        g.lineStyle(3, COLORS.CYBER_CYAN, 1);
        g.beginPath();
        g.moveTo(-s * 0.7, -s * 0.85);
        g.lineTo(s * 0.2, -s * 0.7);
        g.lineTo(s * 0.9, 0);
        g.lineTo(s * 0.2, s * 0.7);
        g.lineTo(-s * 0.7, s * 0.85);
        g.lineTo(-s * 0.3, 0);
        g.closePath();
        g.strokePath();

        g.lineStyle(3, COLORS.CYBER_YELLOW, 0.9);
        g.beginPath();
        g.moveTo(0, -halfSize);
        g.lineTo(0, -s * 0.7);
        g.moveTo(0, s * 0.7);
        g.lineTo(0, halfSize);
        g.strokePath();

        g.lineStyle(3, COLORS.SIGNAL_ON, 1);
        g.beginPath();
        g.moveTo(s * 0.9, 0);
        g.lineTo(halfSize, 0);
        g.strokePath();
        break;

      case GateType.XOR:
        g.lineStyle(3, COLORS.CYBER_CYAN, 1);
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

        g.lineStyle(3, COLORS.CYBER_YELLOW, 0.9);
        g.beginPath();
        g.moveTo(0, -halfSize);
        g.lineTo(0, -s * 0.7);
        g.moveTo(0, s * 0.7);
        g.lineTo(0, halfSize);
        g.strokePath();

        g.lineStyle(3, COLORS.SIGNAL_ON, 1);
        g.beginPath();
        g.moveTo(s * 0.9, 0);
        g.lineTo(halfSize, 0);
        g.strokePath();
        break;

      case GateType.NOT:
        g.lineStyle(3, COLORS.CYBER_CYAN, 1);
        g.beginPath();
        g.moveTo(-s * 0.8, -s * 0.7);
        g.lineTo(s * 0.3, 0);
        g.lineTo(-s * 0.8, s * 0.7);
        g.closePath();
        g.strokePath();

        g.fillStyle(COLORS.BG_DARK, 1);
        g.fillCircle(s * 0.65, 0, 5);
        g.strokeCircle(s * 0.65, 0, 5);

        g.lineStyle(3, COLORS.CYBER_YELLOW, 0.9);
        g.beginPath();
        g.moveTo(-halfSize, 0);
        g.lineTo(-s * 0.8, 0);
        g.strokePath();

        g.lineStyle(3, COLORS.SIGNAL_ON, 1);
        g.beginPath();
        g.moveTo(s * 0.65 + 5, 0);
        g.lineTo(halfSize, 0);
        g.strokePath();
        break;

      case GateType.SOURCE:
        g.fillStyle(0x0e243c, 1);
        g.lineStyle(3, COLORS.SIGNAL_ON, 1);
        g.fillCircle(0, 0, s * 0.9);
        g.strokeCircle(0, 0, s * 0.9);

        g.lineStyle(4, COLORS.SIGNAL_ON, 1);
        g.beginPath();
        g.moveTo(s * 0.9, 0);
        g.lineTo(halfSize, 0);
        g.strokePath();
        break;

      case GateType.LED:
        g.fillStyle(COLORS.LED_OFF, 1);
        g.lineStyle(3, 0x334a60, 1);
        g.fillCircle(0, 0, s * 0.85);
        g.strokeCircle(0, 0, s * 0.85);

        g.lineStyle(4, COLORS.SIGNAL_OFF, 1);
        g.beginPath();
        g.moveTo(-halfSize, 0);
        g.lineTo(-s * 0.85, 0);
        g.strokePath();
        break;
    }
  }

  private getGateLabel(type: GateType): string {
    switch (type) {
      case GateType.AND: return '&';
      case GateType.OR: return '≥1';
      case GateType.XOR: return '=1';
      case GateType.NOT: return '1';
      default: return '';
    }
  }

  private getGateFontSize(type: GateType): number {
    switch (type) {
      case GateType.AND: return 22;
      case GateType.OR: return 16;
      case GateType.XOR: return 16;
      case GateType.NOT: return 18;
      default: return 16;
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

    const startX = this.boardOffsetX + startC * CELL_SIZE + CELL_SIZE / 2;
    const startY = this.boardOffsetY + startR * CELL_SIZE + CELL_SIZE / 2;

    this.player = this.add.sprite(startX, startY, 'player_plumber');
    this.player.setDepth(50);
    this.boardContainer.add(this.player);

    this.tweens.add({
      targets: this.player,
      scaleY: { from: 1, to: 1.05 },
      scaleX: { from: 1, to: 0.97 },
      duration: 650,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private setupVirtualControls(): void {
    const bottomControlsY = GAME_HEIGHT - 120;

    // 1. Virtual Joystick (Bottom Left)
    this.virtualJoystick = new VirtualJoystick(this, 115, bottomControlsY, 52);

    const joyLabel = this.add.text(115, bottomControlsY + 70, '🎮 DI CHUYỂN', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#00f0ff',
    });
    joyLabel.setOrigin(0.5);
    joyLabel.setDepth(150);

    // 2. Action Wrench Button (Bottom Right)
    const btnX = GAME_WIDTH - 115;
    const btnY = bottomControlsY;
    this.actionButtonContainer = this.add.container(btnX, btnY);
    this.actionButtonContainer.setDepth(150);

    const actionOuter = this.add.circle(0, 0, 48, 0x00f0ff, 0.15);
    actionOuter.setStrokeStyle(2, 0x00f0ff, 0.6);

    this.actionButtonBg = this.add.circle(0, 0, 42, 0x10253f, 0.9);
    this.actionButtonBg.setStrokeStyle(3, COLORS.CYBER_YELLOW, 0.95);

    const wrenchSprite = this.add.sprite(0, 0, 'btn_wrench');
    wrenchSprite.setScale(0.85);

    const actionPromptText = this.add.text(0, 68, '⚡ XOAY (SPACE)', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#ffd000',
    });
    actionPromptText.setOrigin(0.5);

    this.actionButtonContainer.add([actionOuter, this.actionButtonBg, wrenchSprite, actionPromptText]);

    const actionZone = this.add.zone(btnX, btnY, 96, 96);
    actionZone.setInteractive({ useHandCursor: true });
    actionZone.setDepth(151);

    actionZone.on('pointerdown', () => {
      this.tweens.add({
        targets: this.actionButtonContainer,
        scaleX: 0.9,
        scaleY: 0.9,
        duration: 70,
        yoyo: true,
      });
      this.rotateCurrentOrTargetGate();
    });

    // 3. Middle Helper Buttons: Hint & Cheat Sheet
    const midY = bottomControlsY - 10;
    this.createAuxiliaryButtons(midY);
  }

  private createAuxiliaryButtons(y: number): void {
    const hintX = GAME_WIDTH / 2 - 65;
    const cheatX = GAME_WIDTH / 2 + 65;

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

    this.hintBtnText = this.add.text(0, 18, `GỢI Ý (${this.availableHints})`, {
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

    const cheatText = this.add.text(0, 18, 'TRA CỨU', {
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
      this.showToast('✅ Mọi cổng đã đúng chiều!');
      return;
    }

    const target = wrongGates[0];
    target.cell.rotation = target.cell.correctRotation;
    target.cell.locked = true;

    this.availableHints--;
    if (this.hintBtnText) {
      this.hintBtnText.setText(`GỢI Ý (${Math.max(0, this.availableHints)})`);
    }

    const sprite = this.cellSprites[target.r]?.[target.c];
    const targetX = this.boardOffsetX + target.c * CELL_SIZE + CELL_SIZE / 2;
    const targetY = this.boardOffsetY + target.r * CELL_SIZE + CELL_SIZE / 2;

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

    this.showToast('✨ Đã sửa đúng & khóa 1 cổng!');
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
    overlay.fillStyle(0x000000, 0.78);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    overlay.setInteractive(new Phaser.Geom.Rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT), Phaser.Geom.Rectangle.Contains);
    overlay.on('pointerdown', () => this.toggleCheatSheet());

    const pw = 620;
    const ph = 760;
    const px = (GAME_WIDTH - pw) / 2;
    const py = (GAME_HEIGHT - ph) / 2 - 20;

    const panel = this.add.graphics();
    panel.fillStyle(0x0a1c32, 0.98);
    panel.lineStyle(2, COLORS.CYBER_CYAN, 0.9);
    panel.fillRoundedRect(px, py, pw, ph, 14);
    panel.strokeRoundedRect(px, py, pw, ph, 14);

    const title = this.add.text(GAME_WIDTH / 2, py + 26, '📖 BẢNG TRA CỨU CỔNG LOGIC', {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: '#00ff88',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    const cheatItems = [
      {
        name: 'CỔNG NOT (▷○)',
        rule: 'ĐẢO TÍN HIỆU: 0 ➜ 1  |  1 ➜ 0',
        table: 'Vào 0 ➜ Ra 1 ★\nVào 1 ➜ Ra 0',
        color: '#00f0ff',
      },
      {
        name: 'CỔNG OR (≥1)',
        rule: 'CHỈ CẦN CÓ 1: Bất kỳ đầu nào có 1 là sáng!',
        table: '0 + 0 ➜ 0\n0 + 1 ➜ 1 ★\n1 + 0 ➜ 1 ★\n1 + 1 ➜ 1 ★',
        color: '#00ff88',
      },
      {
        name: 'CỔNG AND (&)',
        rule: 'BẮT BUỘC CẢ HAI: Phải cả hai là 1 mới sáng!',
        table: '0 + 0 ➜ 0\n0 + 1 ➜ 0\n1 + 0 ➜ 0\n1 + 1 ➜ 1 ★',
        color: '#ffd000',
      },
      {
        name: 'CỔNG XOR (=1)',
        rule: 'KHÁC NHAU: Hai đầu khác nhau thì sáng (1 và 0)',
        table: '0 + 0 ➜ 0\n0 + 1 ➜ 1 ★\n1 + 0 ➜ 1 ★\n1 + 1 ➜ 0',
        color: '#ff007f',
      },
    ];

    let itemY = py + 65;
    container.add([overlay, panel, title]);

    for (const item of cheatItems) {
      const card = this.add.graphics();
      card.fillStyle(0x10253e, 0.85);
      card.lineStyle(1.5, Phaser.Display.Color.HexStringToColor(item.color).color, 0.7);
      card.fillRoundedRect(px + 20, itemY, pw - 40, 130, 8);
      card.strokeRoundedRect(px + 20, itemY, pw - 40, 130, 8);

      const header = this.add.text(px + 36, itemY + 12, item.name, {
        fontSize: '16px',
        fontFamily: 'monospace',
        color: item.color,
        fontStyle: 'bold',
      });

      const rule = this.add.text(px + 36, itemY + 36, item.rule, {
        fontSize: '12px',
        fontFamily: 'monospace',
        color: '#cbe4ff',
      });

      const table = this.add.text(px + 36, itemY + 58, item.table, {
        fontSize: '12px',
        fontFamily: 'monospace',
        color: '#88aacc',
        lineSpacing: 3,
      });

      container.add([card, header, rule, table]);
      itemY += 144;
    }

    const closeBtn = this.add.text(GAME_WIDTH / 2, py + ph - 30, '[ ✕ ĐÓNG ]', {
      fontSize: '18px',
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
    const toast = this.add.text(GAME_WIDTH / 2, 210, message, {
      fontSize: '14px',
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
      y: 190,
      duration: 1800,
      onComplete: () => toast.destroy(),
    });
  }

  private setupKeyboardControls(): void {
    if (!this.input.keyboard) return;

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,SPACE,H,C') as { [key: string]: Phaser.Input.Keyboard.Key };

    this.input.keyboard.on('keydown-SPACE', () => {
      this.rotateCurrentOrTargetGate();
    });

    this.input.keyboard.on('keydown-H', () => {
      this.useHint();
    });

    this.input.keyboard.on('keydown-C', () => {
      this.toggleCheatSheet();
    });
  }

  private rotateCurrentOrTargetGate(): void {
    if (this.isWon || this.isTimeOver) return;

    if (!this.activeTargetCell) {
      const closest = this.findClosestRotatableGate();
      if (closest) {
        this.activeTargetCell = closest;
      }
    }

    if (this.activeTargetCell) {
      const { row, col } = this.activeTargetCell;
      this.handleCellTap(row, col);
    }
  }

  private findClosestRotatableGate(): { row: number; col: number } | null {
    let bestDist = Infinity;
    let bestCell: { row: number; col: number } | null = null;

    for (let r = 0; r < this.gridHeight; r++) {
      for (let c = 0; c < this.gridWidth; c++) {
        const cell = this.grid[r][c];
        if (cell && !cell.fixed && !cell.locked && cell.type !== GateType.SOURCE && cell.type !== GateType.LED) {
          const cx = this.boardOffsetX + c * CELL_SIZE + CELL_SIZE / 2;
          const cy = this.boardOffsetY + r * CELL_SIZE + CELL_SIZE / 2;
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

  private setupTouchControls(): void {
    this.touchControls = new TouchControls(this);

    this.touchControls.setTapHandler((x: number, y: number) => {
      const { row, col } = this.screenToGrid(x, y);
      if (row >= 0 && row < this.gridHeight && col >= 0 && col < this.gridWidth) {
        this.handleCellTap(row, col);
      }
    });

    this.touchControls.setLongPressHandler((x: number, y: number) => {
      const { row, col } = this.screenToGrid(x, y);
      if (row >= 0 && row < this.gridHeight && col >= 0 && col < this.gridWidth) {
        this.toggleCheatSheet();
      }
    });
  }

  private screenToGrid(screenX: number, screenY: number): { row: number; col: number } {
    const col = Math.floor((screenX - this.boardOffsetX) / CELL_SIZE);
    const row = Math.floor((screenY - this.boardOffsetY) / CELL_SIZE);
    return { row, col };
  }

  private handleCellTap(row: number, col: number): void {
    const cell = this.grid[row][col];
    if (!cell || cell.fixed || cell.locked || this.isAnimating || this.isWon || this.isTimeOver) return;

    const targetX = this.boardOffsetX + col * CELL_SIZE + CELL_SIZE / 2;
    const targetY = this.boardOffsetY + row * CELL_SIZE + CELL_SIZE / 2;

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
    cell.rotation = (cell.rotation + 1) % 4;

    this.createSparkEffect(targetX, targetY);

    const sprite = this.cellSprites[row]?.[col];
    if (sprite) {
      this.tweens.add({
        targets: sprite.container,
        scaleX: 1.14,
        scaleY: 1.14,
        duration: ANIM.ROTATE_DURATION / 2,
        yoyo: true,
        ease: 'Sine.easeOut',
        onComplete: () => {
          this.drawGateInCell(row, col);
          this.propagateSignals();
          this.isAnimating = false;
        },
      });
    } else {
      this.propagateSignals();
      this.isAnimating = false;
    }
  }

  private propagateSignals(): void {
    this.signalEngine.updateGrid(this.grid);
    const states = this.signalEngine.propagate(this.sources);

    for (let r = 0; r < this.gridHeight; r++) {
      for (let c = 0; c < this.gridWidth; c++) {
        const state = states[r][c];
        const sprite = this.cellSprites[r]?.[c];
        const gate = this.grid[r][c];

        if (!sprite || !gate) continue;

        if (gate.type === GateType.LED) {
          const isOn = state.connected && state.inputSignals.includes(1);
          sprite.gateGraphics.clear();

          const halfSize = CELL_SIZE / 2 - 5;
          const s = halfSize * 0.7;

          if (isOn) {
            sprite.gateGraphics.fillStyle(COLORS.LED_GLOW, 0.15);
            sprite.gateGraphics.fillCircle(0, 0, s + 16);
            sprite.gateGraphics.fillStyle(COLORS.LED_GLOW, 0.35);
            sprite.gateGraphics.fillCircle(0, 0, s + 8);
            sprite.gateGraphics.fillStyle(COLORS.LED_ON, 1);
            sprite.gateGraphics.fillCircle(0, 0, s);
            sprite.gateGraphics.lineStyle(2.5, 0x00ff88, 1);
            sprite.gateGraphics.strokeCircle(0, 0, s);
            sprite.label.setText('💡');
          } else {
            sprite.gateGraphics.fillStyle(COLORS.LED_OFF, 1);
            sprite.gateGraphics.lineStyle(2, 0x334a60, 1);
            sprite.gateGraphics.fillCircle(0, 0, s);
            sprite.gateGraphics.strokeCircle(0, 0, s);
            sprite.label.setText('○');
            sprite.label.setColor('#667788');
          }
        }
      }
    }

    // Update bottom UI LED indicator
    this.updateLedStatus();

    // Check Win Condition
    const isWin = this.signalEngine.checkWin(this.leds);
    if (isWin && !this.isWon) {
      this.isWon = true;
      this.updateLedStatus();
      this.celebrateWinAndShowModal();
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

        const cx = this.boardOffsetX + c * CELL_SIZE + CELL_SIZE / 2;
        const cy = this.boardOffsetY + r * CELL_SIZE + CELL_SIZE / 2;
        const halfSize = CELL_SIZE / 2;

        for (const dir of state.activeFlowDirections) {
          let ex = cx;
          let ey = cy;

          switch (dir) {
            case Direction.UP: ey = cy - halfSize; break;
            case Direction.RIGHT: ex = cx + halfSize; break;
            case Direction.DOWN: ey = cy + halfSize; break;
            case Direction.LEFT: ex = cx - halfSize; break;
          }

          this.electricPulseGraphics.lineStyle(6, COLORS.SIGNAL_ON, 0.45);
          this.electricPulseGraphics.beginPath();
          this.electricPulseGraphics.moveTo(cx, cy);
          this.electricPulseGraphics.lineTo(ex, ey);
          this.electricPulseGraphics.strokePath();

          this.electricPulseGraphics.lineStyle(2.5, 0xffffff, 0.9);
          this.electricPulseGraphics.beginPath();
          this.electricPulseGraphics.moveTo(cx, cy);
          this.electricPulseGraphics.lineTo(ex, ey);
          this.electricPulseGraphics.strokePath();

          const px = Phaser.Math.Linear(cx, ex, this.pulseOffset);
          const py = Phaser.Math.Linear(cy, ey, this.pulseOffset);

          this.electricPulseGraphics.fillStyle(0x00ffff, 0.95);
          this.electricPulseGraphics.fillCircle(px, py, 4);
          this.electricPulseGraphics.fillStyle(0xffffff, 1);
          this.electricPulseGraphics.fillCircle(px, py, 2);
        }
      }
    }
  }

  /**
   * Celebrate win with fireworks, update HUD Next Level button, and show Victory Modal.
   * Progression is automatically persisted in localStorage.
   */
  private celebrateWinAndShowModal(): void {
    try {
      // 1. Calculate stars and persist progression
      const timeRatio = this.totalTimeLimit > 0 ? this.timeRemaining / this.totalTimeLimit : 1;
      let starsCount = 3;
      if (timeRatio < 0.25) {
        starsCount = 1;
      } else if (timeRatio < 0.5) {
        starsCount = 2;
      }

      ProgressManager.unlockNextLevel(this.levelId);
      ProgressManager.saveStars(this.levelId, starsCount);

      // Show in-game HUD "QUA MÀN" button immediately on the playing screen
      this.showNextLevelHudButton();

      // 2. Safe fireworks celebration
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
                duration: Phaser.Math.Between(500, 900),
                ease: 'Power2',
                onComplete: () => star.destroy(),
              });
            }
          } catch (err) {
            console.warn('Firework particle warning:', err);
          }
        });
      }

      // Display Victory Modal after 400ms
      this.time.delayedCall(400, () => {
        try {
          this.showVictoryModal();
        } catch (e) {
          console.error('Failed to show victory modal:', e);
        }
      });
    } catch (e) {
      console.error('celebrateWin error:', e);
      ProgressManager.unlockNextLevel(this.levelId);
      this.showNextLevelHudButton();
    }
  }

  private showVictoryModal(): void {
    if (this.modalGroup) {
      this.modalGroup.destroy();
      this.modalGroup = null;
    }

    const container = this.add.container(0, 0);
    container.setDepth(800);

    // Dim overlay covering area below top header (so header exit buttons remain unblocked)
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.78);
    overlay.fillRect(0, this.headerHeight, GAME_WIDTH, GAME_HEIGHT - this.headerHeight);
    container.add(overlay);

    const pw = 580;
    const ph = 530;
    const px = (GAME_WIDTH - pw) / 2;
    const py = (GAME_HEIGHT - ph) / 2 - 20;

    // Card frame with glowing neon border
    const panel = this.add.graphics();
    panel.fillStyle(0x0a1d35, 0.98);
    panel.lineStyle(2.5, COLORS.SIGNAL_ON, 1);
    panel.fillRoundedRect(px, py, pw, ph, 16);
    panel.strokeRoundedRect(px, py, pw, ph, 16);
    container.add(panel);

    // Close button [✕] at top-right of panel
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

    // Trophy / Celebration Icon
    const trophy = this.add.text(GAME_WIDTH / 2, py + 48, '🎉', {
      fontSize: '48px',
    });
    trophy.setOrigin(0.5);

    // Title
    const title = this.add.text(GAME_WIDTH / 2, py + 108, `HOÀN THÀNH MÀN ${this.levelId}!`, {
      fontSize: '26px',
      fontFamily: 'monospace',
      color: '#00ff88',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    // Star Rating
    const timeRatio = this.timeRemaining / this.totalTimeLimit;
    let stars = '⭐⭐⭐';
    if (timeRatio < 0.25) {
      stars = '⭐';
    } else if (timeRatio < 0.5) {
      stars = '⭐⭐';
    }

    const starsText = this.add.text(GAME_WIDTH / 2, py + 152, stars, {
      fontSize: '32px',
    });
    starsText.setOrigin(0.5);

    // Unlock Notification Subtitle
    const isLastLevel = this.levelId >= 20;
    const unlockSub = this.add.text(
      GAME_WIDTH / 2,
      py + 195,
      isLastLevel
        ? '👑 BẠN ĐÃ PHÁ ĐẢO TOÀN BỘ 20 MÀN! 👑'
        : `⚡ ĐÃ MỞ KHÓA MÀN ${this.levelId + 1} THÀNH CÔNG! ⚡`,
      {
        fontSize: '15px',
        fontFamily: 'monospace',
        color: isLastLevel ? '#ffd000' : '#00f0ff',
        fontStyle: 'bold',
      }
    );
    unlockSub.setOrigin(0.5);

    // Stats
    const statsText = this.add.text(
      GAME_WIDTH / 2,
      py + 238,
      `Thời gian còn lại: ${this.formatTime(this.timeRemaining)}  •  LEDs: ${this.leds.length}/${this.leds.length} ĐÃ SÁNG`,
      {
        fontSize: '13px',
        fontFamily: 'monospace',
        color: '#c0e0ff',
        align: 'center',
      }
    );
    statsText.setOrigin(0.5);

    container.add([trophy, title, starsText, unlockSub, statsText]);

    // Button 1: NEXT LEVEL (Nút qua màn)
    const nextBtnY = py + 305;

    if (!isLastLevel) {
      const nextBtn = this.createModalButton(
        GAME_WIDTH / 2,
        nextBtnY,
        440,
        60,
        `⏩  QUA MÀN ${this.levelId + 1} TIẾP THEO`,
        COLORS.SIGNAL_ON,
        () => {
          this.loadNextLevel(this.levelId + 1);
        }
      );
      container.add(nextBtn);

      this.tweens.add({
        targets: nextBtn,
        scaleX: 1.04,
        scaleY: 1.04,
        duration: 650,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    } else {
      const champText = this.add.text(GAME_WIDTH / 2, nextBtnY, '🏆 CHÚC MỪNG BẠN ĐÃ LÀ BẬC THẦY KỸ THUẬT SỐ! 🏆', {
        fontSize: '16px',
        fontFamily: 'monospace',
        color: '#ffd000',
        fontStyle: 'bold',
      });
      champText.setOrigin(0.5);
      container.add(champText);
    }

    // Button 2: RETRY (Chơi lại)
    const retryBtn = this.createModalButton(
      GAME_WIDTH / 2,
      nextBtnY + 76,
      440,
      48,
      '🔄  CHƠI LẠI MÀN NÀY',
      COLORS.CYBER_CYAN,
      () => {
        this.restartCurrentLevel();
      }
    );
    container.add(retryBtn);

    // Button 3: LEVEL SELECT (Chọn màn)
    const selectBtn = this.createModalButton(
      GAME_WIDTH / 2,
      nextBtnY + 138,
      440,
      46,
      '📋  DANH SÁCH MÀN CHƠI',
      0x8899aa,
      () => {
        this.cleanupAndNavigate('LevelSelectScene');
      }
    );
    container.add(selectBtn);

    this.modalGroup = container;
  }

  private showTimeOverModal(): void {
    if (this.modalGroup) return;

    this.isTimeOver = true;

    const container = this.add.container(0, 0);
    container.setDepth(800);

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.8);
    overlay.fillRect(0, this.headerHeight, GAME_WIDTH, GAME_HEIGHT - this.headerHeight);
    container.add(overlay);

    const pw = 540;
    const ph = 400;
    const px = (GAME_WIDTH - pw) / 2;
    const py = (GAME_HEIGHT - ph) / 2 - 20;

    const panel = this.add.graphics();
    panel.fillStyle(0x180d1e, 0.98);
    panel.lineStyle(2.5, 0xff0055, 1);
    panel.fillRoundedRect(px, py, pw, ph, 14);
    panel.strokeRoundedRect(px, py, pw, ph, 14);
    container.add(panel);

    const warnIcon = this.add.text(GAME_WIDTH / 2, py + 55, '⏰', {
      fontSize: '52px',
    });
    warnIcon.setOrigin(0.5);

    const title = this.add.text(GAME_WIDTH / 2, py + 120, 'HẾT GIỜ!', {
      fontSize: '30px',
      fontFamily: 'monospace',
      color: '#ff2255',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    const desc = this.add.text(
      GAME_WIDTH / 2,
      py + 170,
      'Mạch điện chưa kịp hoàn thành trước khi hết thời gian.\nHãy thử lại một lần nữa!',
      {
        fontSize: '14px',
        fontFamily: 'monospace',
        color: '#d0b0c0',
        align: 'center',
        lineSpacing: 6,
      }
    );
    desc.setOrigin(0.5);

    const retryBtn = this.createModalButton(
      GAME_WIDTH / 2,
      py + 250,
      380,
      56,
      '🔄  THỬ LẠI NGAY',
      0xff2255,
      () => {
        this.restartCurrentLevel();
      }
    );

    const backBtn = this.createModalButton(
      GAME_WIDTH / 2,
      py + 325,
      380,
      50,
      '📋  CHỌN MÀN KHÁC',
      0x8899aa,
      () => {
        this.cleanupAndNavigate('LevelSelectScene');
      }
    );

    container.add([warnIcon, title, desc, retryBtn, backBtn]);
    this.modalGroup = container;
  }

  private createModalButton(
    x: number,
    y: number,
    w: number,
    h: number,
    text: string,
    colorNum: number,
    callback: () => void
  ): Phaser.GameObjects.Container {
    const btnContainer = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, w, h, 0x0e243c, 0.96);
    bg.setStrokeStyle(2.5, colorNum, 0.9);
    bg.setInteractive({ useHandCursor: true });

    const colorHex = Phaser.Display.Color.IntegerToColor(colorNum).rgba;
    const label = this.add.text(0, 0, text, {
      fontSize: '17px',
      fontFamily: 'monospace',
      color: colorHex,
      fontStyle: 'bold',
    });
    label.setOrigin(0.5);

    btnContainer.add([bg, label]);

    bg.on('pointerdown', () => {
      this.tweens.add({
        targets: btnContainer,
        scaleX: 0.92,
        scaleY: 0.92,
        duration: 70,
        yoyo: true,
        onComplete: () => {
          try {
            callback();
          } catch (e) {
            console.error('Modal button callback error:', e);
          }
        },
      });
    });

    return btnContainer;
  }

  /**
   * Smoothly load next level without camera fade black screen glitch or input freeze.
   */
  private loadNextLevel(nextLevelId: number): void {
    if (nextLevelId > 20) {
      this.cleanupAndNavigate('LevelSelectScene');
      return;
    }
    this.cleanUpResources();
    this.cameras.main.resetFX();
    this.scene.start('GameScene', { levelId: nextLevelId });
  }

  private restartCurrentLevel(): void {
    this.cleanUpResources();
    this.cameras.main.resetFX();
    this.scene.start('GameScene', { levelId: this.levelId });
  }

  private cleanupAndNavigate(sceneKey: string): void {
    this.cleanUpResources();
    this.cameras.main.resetFX();
    this.scene.start(sceneKey);
  }

  private cleanUpResources(): void {
    this.tweens.killAll();
    if (this.touchControls) {
      this.touchControls.destroy();
    }
    if (this.virtualJoystick) {
      this.virtualJoystick.destroy();
    }
    if (this.cheatSheetGroup) {
      this.cheatSheetGroup.destroy();
      this.cheatSheetGroup = null;
    }
    if (this.modalGroup) {
      this.modalGroup.destroy();
      this.modalGroup = null;
    }
    if (this.nextLevelHudContainer) {
      this.nextLevelHudContainer.destroy();
      this.nextLevelHudContainer = null;
    }
    if (this.headerNextBtn) {
      this.headerNextBtn.destroy();
      this.headerNextBtn = null;
    }
  }

  private drawBottomUI(): void {
    const bottomY = GAME_HEIGHT - 215;

    const barBg = this.add.graphics();
    barBg.fillStyle(COLORS.BG_DARK, 0.88);
    barBg.fillRect(0, bottomY - 12, GAME_WIDTH, 56);
    barBg.lineStyle(1.5, COLORS.CYBER_CYAN, 0.35);
    barBg.beginPath();
    barBg.moveTo(0, bottomY - 12);
    barBg.lineTo(GAME_WIDTH, bottomY - 12);
    barBg.strokePath();
    barBg.setDepth(100);

    this.ledStatusText = this.add.text(GAME_WIDTH / 2, bottomY + 16, `💡 ĐÈN ĐÃ SÁNG: 0/${this.leds.length}`, {
      fontSize: '17px',
      fontFamily: 'monospace',
      color: '#88b5dd',
      fontStyle: 'bold',
    });
    this.ledStatusText.setOrigin(0.5);
    this.ledStatusText.setDepth(101);

    // In-Game HUD Next Level Button
    const isLastLevel = this.levelId >= 20;
    const hudBtnText = isLastLevel ? '👑 PHÁ ĐẢO TOÀN BỘ 20 MÀN! 👑' : `⏩ QUA MÀN ${this.levelId + 1} TIẾP THEO ➔`;

    this.nextLevelHudContainer = this.add.container(GAME_WIDTH / 2, bottomY + 16);
    this.nextLevelHudContainer.setDepth(102);

    const hudBg = this.add.rectangle(0, 0, 380, 46, 0x00ff88, 1);
    hudBg.setStrokeStyle(2, 0xffffff, 1);
    hudBg.setInteractive({ useHandCursor: true });

    const hudLabel = this.add.text(0, 0, hudBtnText, {
      fontSize: '15px',
      fontFamily: 'monospace',
      color: '#061d13',
      fontStyle: 'bold',
    });
    hudLabel.setOrigin(0.5);

    this.nextLevelHudContainer.add([hudBg, hudLabel]);
    this.nextLevelHudContainer.setVisible(false);

    hudBg.on('pointerdown', () => {
      if (isLastLevel) {
        this.cleanupAndNavigate('LevelSelectScene');
      } else {
        this.loadNextLevel(this.levelId + 1);
      }
    });

    // Initial update
    this.updateLedStatus();
  }

  private updateLedStatus(): void {
    if (!this.signalEngine || !this.ledStatusText) return;
    let litCount = 0;
    const states = this.signalEngine.getCellStates();
    for (const led of this.leds) {
      const state = states[led.row]?.[led.col];
      if (state && state.connected && state.inputSignals.includes(1)) {
        litCount++;
      }
    }

    if (this.isWon) {
      this.ledStatusText.setVisible(false);
      if (this.nextLevelHudContainer) {
        this.nextLevelHudContainer.setVisible(true);
      }
      if (this.headerNextBtn) {
        this.headerNextBtn.setVisible(true);
      }
    } else {
      this.ledStatusText.setVisible(true);
      this.ledStatusText.setText(`💡 ĐÈN ĐÃ SÁNG: ${litCount}/${this.leds.length}`);
      if (litCount === this.leds.length) {
        this.ledStatusText.setColor('#00ff88');
      } else {
        this.ledStatusText.setColor('#88b5dd');
      }
      if (this.nextLevelHudContainer) {
        this.nextLevelHudContainer.setVisible(false);
      }
      if (this.headerNextBtn) {
        this.headerNextBtn.setVisible(false);
      }
    }
  }

  private showNextLevelHudButton(): void {
    if (this.ledStatusText) {
      this.ledStatusText.setVisible(false);
    }
    if (this.nextLevelHudContainer) {
      this.nextLevelHudContainer.setVisible(true);
      this.tweens.add({
        targets: this.nextLevelHudContainer,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 550,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
    if (this.headerNextBtn) {
      this.headerNextBtn.setVisible(true);
      this.tweens.add({
        targets: this.headerNextBtn,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 550,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  update(_time: number, delta: number): void {
    const dt = delta / 1000;

    // Countdown Timer logic
    if (!this.isWon && !this.isTimeOver) {
      this.timeRemaining -= dt;
      if (this.timeRemaining <= 0) {
        this.timeRemaining = 0;
        this.showTimeOverModal();
      }

      if (this.timerText) {
        this.timerText.setText(this.formatTime(this.timeRemaining));
        if (this.timeRemaining <= 15) {
          this.timerText.setColor('#ff0055');
          // Pulse text
          this.timerText.setScale(1 + Math.sin(_time * 0.01) * 0.08);
        } else {
          this.timerText.setColor('#ffd000');
          this.timerText.setScale(1);
        }
      }

      this.updateTimerBar();
    }

    // Player Movement
    let moveX = 0;
    let moveY = 0;

    if (!this.isWon && !this.isTimeOver) {
      if (this.virtualJoystick && this.virtualJoystick.direction.isDown) {
        moveX += this.virtualJoystick.direction.x;
        moveY += this.virtualJoystick.direction.y;
      }

      if (this.cursors) {
        if (this.cursors.left.isDown || this.keys?.A?.isDown) moveX -= 1;
        if (this.cursors.right.isDown || this.keys?.D?.isDown) moveX += 1;
        if (this.cursors.up.isDown || this.keys?.W?.isDown) moveY -= 1;
        if (this.cursors.down.isDown || this.keys?.S?.isDown) moveY += 1;
      }
    }

    const len = Math.sqrt(moveX * moveX + moveY * moveY);
    if (len > 0.05 && this.player && !this.isWon && !this.isTimeOver) {
      const normX = moveX / Math.max(1, len);
      const normY = moveY / Math.max(1, len);

      this.player.x += normX * this.playerSpeed * dt;
      this.player.y += normY * this.playerSpeed * dt;

      const minX = this.boardOffsetX + CELL_SIZE * 0.4;
      const maxX = this.boardOffsetX + this.gridWidth * CELL_SIZE - CELL_SIZE * 0.4;
      const minY = this.boardOffsetY + CELL_SIZE * 0.4;
      const maxY = this.boardOffsetY + this.gridHeight * CELL_SIZE - CELL_SIZE * 0.4;

      this.player.x = Phaser.Math.Clamp(this.player.x, minX, maxX);
      this.player.y = Phaser.Math.Clamp(this.player.y, minY, maxY);

      if (Math.abs(normX) > 0.1) {
        this.player.setFlipX(normX < 0);
      }

      this.player.setAngle(Math.sin(_time * 0.015) * 8);
    } else if (this.player) {
      this.player.setAngle(0);
    }

    this.updateTargetGateHighlight();
    this.updateElectricPulseEffect();
  }

  private updateTargetGateHighlight(): void {
    if (!this.player || !this.targetCellHighlight || this.isWon || this.isTimeOver) {
      if (this.targetCellHighlight) this.targetCellHighlight.clear();
      return;
    }

    this.targetCellHighlight.clear();

    const col = Math.floor((this.player.x - this.boardOffsetX) / CELL_SIZE);
    const row = Math.floor((this.player.y - this.boardOffsetY) / CELL_SIZE);

    if (row >= 0 && row < this.gridHeight && col >= 0 && col < this.gridWidth) {
      const cell = this.grid[row][col];
      if (cell && !cell.fixed && !cell.locked && cell.type !== GateType.SOURCE && cell.type !== GateType.LED) {
        this.activeTargetCell = { row, col };

        const cx = this.boardOffsetX + col * CELL_SIZE;
        const cy = this.boardOffsetY + row * CELL_SIZE;

        this.targetCellHighlight.lineStyle(2, COLORS.CYBER_YELLOW, 0.9);
        this.targetCellHighlight.strokeRoundedRect(cx + 3, cy + 3, CELL_SIZE - 6, CELL_SIZE - 6, 8);

        const cornerLen = 14;
        this.targetCellHighlight.lineStyle(3, COLORS.CYBER_CYAN, 1);
        this.targetCellHighlight.beginPath();
        this.targetCellHighlight.moveTo(cx + 3, cy + 3 + cornerLen);
        this.targetCellHighlight.lineTo(cx + 3, cy + 3);
        this.targetCellHighlight.lineTo(cx + 3 + cornerLen, cy + 3);
        this.targetCellHighlight.strokePath();

        this.targetCellHighlight.beginPath();
        this.targetCellHighlight.moveTo(cx + CELL_SIZE - 3, cy + 3 + cornerLen);
        this.targetCellHighlight.lineTo(cx + CELL_SIZE - 3, cy + 3);
        this.targetCellHighlight.lineTo(cx + CELL_SIZE - 3 - cornerLen, cy + 3);
        this.targetCellHighlight.strokePath();

        this.targetCellHighlight.beginPath();
        this.targetCellHighlight.moveTo(cx + 3, cy + CELL_SIZE - 3 - cornerLen);
        this.targetCellHighlight.lineTo(cx + 3, cy + CELL_SIZE - 3);
        this.targetCellHighlight.lineTo(cx + 3 + cornerLen, cy + CELL_SIZE - 3);
        this.targetCellHighlight.strokePath();

        this.targetCellHighlight.beginPath();
        this.targetCellHighlight.moveTo(cx + CELL_SIZE - 3, cy + CELL_SIZE - 3 - cornerLen);
        this.targetCellHighlight.lineTo(cx + CELL_SIZE - 3, cy + CELL_SIZE - 3);
        this.targetCellHighlight.lineTo(cx + CELL_SIZE - 3 - cornerLen, cy + CELL_SIZE - 3);
        this.targetCellHighlight.strokePath();

        if (this.actionButtonBg) {
          this.actionButtonBg.setFillStyle(0x1a442a, 0.95);
          this.actionButtonBg.setStrokeStyle(3, 0x00ff88, 1);
        }
        return;
      }
    }

    this.activeTargetCell = null;
    if (this.actionButtonBg) {
      this.actionButtonBg.setFillStyle(0x10253f, 0.9);
      this.actionButtonBg.setStrokeStyle(3, COLORS.CYBER_YELLOW, 0.95);
    }
  }

  shutdown(): void {
    this.cleanUpResources();
  }
}
