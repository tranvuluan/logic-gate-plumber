import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../utils/Constants';
import { ProceduralGraphics } from '../graphics/ProceduralGraphics';
import { ProgressManager } from '../utils/ProgressManager';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    this.cameras.main.resetFX();
    this.cameras.main.setAlpha(1);

    // Draw PCB background
    const bg = this.add.graphics();
    const procGraphics = new ProceduralGraphics(this);
    procGraphics.drawBackground(bg, GAME_WIDTH, GAME_HEIGHT);

    // Title group
    const titleY = GAME_HEIGHT * 0.25;

    // Circuit icon
    const icon = this.add.text(GAME_WIDTH / 2, titleY - 80, '🔌', {
      fontSize: '64px',
    });
    icon.setOrigin(0.5);

    // Game title
    const title = this.add.text(GAME_WIDTH / 2, titleY, 'LOGIC GATE', {
      fontSize: '48px',
      fontFamily: 'monospace',
      color: '#00ff88',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    const title2 = this.add.text(GAME_WIDTH / 2, titleY + 55, 'PLUMBER', {
      fontSize: '48px',
      fontFamily: 'monospace',
      color: '#00aaff',
      fontStyle: 'bold',
    });
    title2.setOrigin(0.5);

    // Subtitle
    const subtitle = this.add.text(
      GAME_WIDTH / 2,
      titleY + 110,
      '— Nối mạch Kỹ thuật số —',
      {
        fontSize: '16px',
        fontFamily: 'monospace',
        color: '#4488aa',
      }
    );
    subtitle.setOrigin(0.5);

    // Glow animation on titles
    this.tweens.add({
      targets: [title, title2],
      alpha: { from: 0.8, to: 1 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
    });

    // Retrieve unlocked level
    const unlockedLevel = ProgressManager.getUnlockedLevel();

    // Buttons
    const buttonY = GAME_HEIGHT * 0.53;
    const buttonSpacing = 82;

    this.createButton(
      GAME_WIDTH / 2,
      buttonY,
      `▶  CHƠI TIẾP (MÀN ${unlockedLevel})`,
      () => {
        this.cameras.main.resetFX();
        this.scene.start('GameScene', { levelId: unlockedLevel });
      }
    );

    this.createButton(
      GAME_WIDTH / 2,
      buttonY + buttonSpacing,
      '📋  CHỌN MÀN CHƠI',
      () => {
        this.cameras.main.resetFX();
        this.scene.start('LevelSelectScene');
      }
    );

    this.createButton(
      GAME_WIDTH / 2,
      buttonY + buttonSpacing * 2,
      '📖  HƯỚNG DẪN',
      () => {
        this.showTutorial();
      }
    );

    // Footer
    const footer = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT - 60,
      'v1.0.0 • Made with Phaser 3',
      {
        fontSize: '12px',
        fontFamily: 'monospace',
        color: '#334455',
      }
    );
    footer.setOrigin(0.5);

    // Decorative circuit elements
    this.drawDecorativeCircuit();
  }

  private createButton(x: number, y: number, text: string, callback: () => void): void {
    const btnWidth = 320;
    const btnHeight = 60;

    const bg = this.add.graphics();
    bg.fillStyle(COLORS.UI_BUTTON, 1);
    bg.lineStyle(2, COLORS.UI_PRIMARY, 0.6);
    bg.fillRoundedRect(x - btnWidth / 2, y - btnHeight / 2, btnWidth, btnHeight, 12);
    bg.strokeRoundedRect(x - btnWidth / 2, y - btnHeight / 2, btnWidth, btnHeight, 12);

    const label = this.add.text(x, y, text, {
      fontSize: '22px',
      fontFamily: 'monospace',
      color: '#ffffff',
    });
    label.setOrigin(0.5);

    // Interactive zone
    const hitZone = this.add.zone(x, y, btnWidth, btnHeight);
    hitZone.setInteractive({ useHandCursor: true });

    hitZone.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(COLORS.UI_BUTTON_HOVER, 1);
      bg.lineStyle(2, COLORS.UI_PRIMARY, 1);
      bg.fillRoundedRect(x - btnWidth / 2, y - btnHeight / 2, btnWidth, btnHeight, 12);
      bg.strokeRoundedRect(x - btnWidth / 2, y - btnHeight / 2, btnWidth, btnHeight, 12);
    });

    hitZone.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(COLORS.UI_BUTTON, 1);
      bg.lineStyle(2, COLORS.UI_PRIMARY, 0.6);
      bg.fillRoundedRect(x - btnWidth / 2, y - btnHeight / 2, btnWidth, btnHeight, 12);
      bg.strokeRoundedRect(x - btnWidth / 2, y - btnHeight / 2, btnWidth, btnHeight, 12);
    });

    hitZone.on('pointerdown', () => {
      this.tweens.add({
        targets: [bg, label],
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 100,
        yoyo: true,
        onComplete: callback,
      });
    });
  }

  private showTutorial(): void {
    // Dark overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.8);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    overlay.setDepth(100);

    // Tutorial panel
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.GATE_BODY, 0.95);
    panel.lineStyle(2, COLORS.UI_PRIMARY, 0.8);
    const pw = 600;
    const ph = 700;
    const px = (GAME_WIDTH - pw) / 2;
    const py = (GAME_HEIGHT - ph) / 2;
    panel.fillRoundedRect(px, py, pw, ph, 16);
    panel.strokeRoundedRect(px, py, pw, ph, 16);
    panel.setDepth(101);

    const tutorialText = this.add.text(
      GAME_WIDTH / 2,
      py + 40,
      '📖 HƯỚNG DẪN CHƠI',
      {
        fontSize: '24px',
        fontFamily: 'monospace',
        color: '#00ff88',
        fontStyle: 'bold',
      }
    );
    tutorialText.setOrigin(0.5, 0);
    tutorialText.setDepth(102);

    const instructions = [
      '🎯 MỤC TIÊU:',
      'Xoay các cổng logic để tín hiệu',
      'đi từ nguồn → cổng → đèn LED.',
      'Làm sáng TẤT CẢ đèn LED để thắng!',
      '',
      '👆 ĐIỀU KHIỂN:',
      '• Chạm (Tap): Xoay cổng 90°',
      '• Giữ lâu: Xem bảng chân trị',
      '',
      '⚡ CÁC CỔNG LOGIC:',
      '• AND (&): Ra 1 khi cả 2 vào = 1',
      '• OR (≥1): Ra 1 khi ít nhất 1 vào = 1',
      '• XOR (=1): Ra 1 khi 2 vào khác nhau',
      '• NOT (▷○): Đảo ngược tín hiệu',
      '',
      '💡 MẸO:',
      'Dây xanh = tín hiệu 1 (HIGH)',
      'Dây xám = tín hiệu 0 (LOW)',
    ];

    const content = this.add.text(
      GAME_WIDTH / 2,
      py + 90,
      instructions.join('\n'),
      {
        fontSize: '15px',
        fontFamily: 'monospace',
        color: '#ccddee',
        lineSpacing: 6,
        align: 'left',
        wordWrap: { width: pw - 60 },
      }
    );
    content.setOrigin(0.5, 0);
    content.setDepth(102);

    // Close button
    const closeBtn = this.add.text(
      GAME_WIDTH / 2,
      py + ph - 50,
      '[ ĐÓNG ]',
      {
        fontSize: '20px',
        fontFamily: 'monospace',
        color: '#00aaff',
      }
    );
    closeBtn.setOrigin(0.5);
    closeBtn.setDepth(102);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => {
      overlay.destroy();
      panel.destroy();
      tutorialText.destroy();
      content.destroy();
      closeBtn.destroy();
    });
  }

  private drawDecorativeCircuit(): void {
    const g = this.add.graphics();
    g.lineStyle(1, COLORS.PCB_TRACE, 0.15);

    // Random circuit traces
    const traces = [
      [50, 800, 200, 800, 200, 900, 350, 900],
      [GAME_WIDTH - 50, 750, GAME_WIDTH - 200, 750, GAME_WIDTH - 200, 850],
      [100, 1050, 250, 1050, 250, 1100, 400, 1100, 400, 1150],
      [GAME_WIDTH - 100, 1000, GAME_WIDTH - 300, 1000, GAME_WIDTH - 300, 1100],
    ];

    for (const trace of traces) {
      g.beginPath();
      g.moveTo(trace[0], trace[1]);
      for (let i = 2; i < trace.length; i += 2) {
        g.lineTo(trace[i], trace[i + 1]);
      }
      g.strokePath();
    }

    // Small component-like rectangles
    g.fillStyle(COLORS.GATE_BODY, 0.2);
    g.fillRect(60, 900, 30, 15);
    g.fillRect(GAME_WIDTH - 180, 850, 30, 15);
    g.fillRect(280, 1100, 25, 12);
  }
}
