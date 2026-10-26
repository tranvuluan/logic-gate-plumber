import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/Constants';
import { ProceduralGraphics } from '../graphics/ProceduralGraphics';
import { getLevels } from '../logic/LevelGenerator';
import { ProgressManager } from '../utils/ProgressManager';

export class LevelSelectScene extends Phaser.Scene {
  private toastContainer: Phaser.GameObjects.Container | null = null;

  constructor() {
    super({ key: 'LevelSelectScene' });
  }

  create(): void {
    // Reset camera effects
    this.cameras.main.resetFX();
    this.cameras.main.setAlpha(1);

    // Cyberpunk background
    const bg = this.add.graphics();
    const procGraphics = new ProceduralGraphics(this);
    procGraphics.drawBackground(bg, GAME_WIDTH, GAME_HEIGHT);

    // Retrieve highest unlocked level (defaults to 1)
    const unlockedLevel = ProgressManager.getUnlockedLevel();

    // Top Header
    const header = this.add.text(GAME_WIDTH / 2, 50, 'CHỌN MÀN CHƠI', {
      fontSize: '26px',
      fontFamily: 'monospace',
      color: '#00ff88',
      fontStyle: 'bold',
    });
    header.setOrigin(0.5);

    // Subheader: Progress indicator
    const progressText = this.add.text(
      GAME_WIDTH / 2,
      82,
      `TIẾN ĐỘ: ĐÃ MỞ KHÓA MÀN ${unlockedLevel} / 20`,
      {
        fontSize: '13px',
        fontFamily: 'monospace',
        color: '#00f0ff',
        fontStyle: 'bold',
      }
    );
    progressText.setOrigin(0.5);

    // Back to Menu button
    const backBtn = this.add.text(35, 50, '← MENU', {
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

    // 20 Level Cards: 4 columns x 5 rows
    const levels = getLevels();
    const cols = 4;
    const cardWidth = 146;
    const cardHeight = 152;
    const gapX = 20;
    const gapY = 20;

    const totalGridWidth = cols * cardWidth + (cols - 1) * gapX;
    const startX = (GAME_WIDTH - totalGridWidth) / 2 + cardWidth / 2;
    const startY = 150 + cardHeight / 2;

    levels.forEach((level, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = startX + col * (cardWidth + gapX);
      const y = startY + row * (cardHeight + gapY);

      const isUnlocked = level.id <= unlockedLevel;
      const isCurrent = level.id === unlockedLevel;
      const stars = ProgressManager.getStars(level.id);

      this.createLevelCard(
        x,
        y,
        cardWidth,
        cardHeight,
        level.id,
        level.name,
        level.subtitle,
        isUnlocked,
        isCurrent,
        stars
      );
    });

    // Bottom Action: Reset Progress button
    const resetBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 38, '🔄 ĐẶT LẠI TIẾN TRÌNH VỀ MÀN 1', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#ff4466',
    });
    resetBtn.setOrigin(0.5);
    resetBtn.setInteractive({ useHandCursor: true });
    resetBtn.on('pointerdown', () => {
      if (confirm('Bạn có chắc chắn muốn khóa lại toàn bộ các màn và chơi lại từ Màn 1?')) {
        ProgressManager.resetProgress();
        this.cameras.main.resetFX();
        this.scene.restart();
      }
    });
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
  ): void {
    const cardContainer = this.add.container(x, y);

    const g = this.add.graphics();
    const circleY = -h / 2 + 40;
    const numStr = levelId < 10 ? `0${levelId}` : `${levelId}`;

    if (isUnlocked) {
      // UNLOCKED STATE
      const borderColor = isCurrent ? 0x00ff88 : 0x00a8cc;
      const bgColor = isCurrent ? 0x122b49 : 0x0e223a;

      g.fillStyle(bgColor, 0.95);
      g.lineStyle(isCurrent ? 2.5 : 2, borderColor, 0.85);
      g.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
      g.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);

      // Circle icon
      g.fillStyle(isCurrent ? 0x00ff88 : 0x00f0ff, 0.18);
      g.fillCircle(0, circleY, 22);
      g.lineStyle(2, isCurrent ? 0x00ff88 : 0x00f0ff, 0.9);
      g.strokeCircle(0, circleY, 22);

      const numText = this.add.text(0, circleY, numStr, {
        fontSize: '18px',
        fontFamily: 'monospace',
        color: isCurrent ? '#00ff88' : '#00f0ff',
        fontStyle: 'bold',
      });
      numText.setOrigin(0.5);

      // Short Name
      const shortName = levelName.split(':')[1]?.trim() || levelName;
      const nameText = this.add.text(0, circleY + 34, shortName, {
        fontSize: '12px',
        fontFamily: 'monospace',
        color: '#ffffff',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: w - 16 },
      });
      nameText.setOrigin(0.5, 0);

      // Stars rating or subtitle
      let statusStr = subtitle;
      if (stars > 0) {
        statusStr = '⭐'.repeat(stars);
      } else if (isCurrent) {
        statusStr = '▶ ĐANG CHƠI';
      }

      const subText = this.add.text(0, h / 2 - 18, statusStr, {
        fontSize: stars > 0 ? '13px' : '10px',
        fontFamily: 'monospace',
        color: isCurrent ? '#00ff88' : '#7faac8',
        align: 'center',
        wordWrap: { width: w - 14 },
      });
      subText.setOrigin(0.5);

      cardContainer.add([g, numText, nameText, subText]);

      // Pulsing glow for current level to direct the player
      if (isCurrent) {
        this.tweens.add({
          targets: cardContainer,
          scaleX: 1.03,
          scaleY: 1.03,
          duration: 900,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }

      // Interactive zone
      const zone = this.add.zone(0, 0, w, h);
      zone.setInteractive({ useHandCursor: true });
      cardContainer.add(zone);

      zone.on('pointerover', () => {
        g.clear();
        g.fillStyle(0x193b64, 0.98);
        g.lineStyle(2.5, 0x00ff88, 1);
        g.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
        g.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
        g.fillStyle(0x00ff88, 0.3);
        g.fillCircle(0, circleY, 22);
        g.lineStyle(2, 0x00ff88, 1);
        g.strokeCircle(0, circleY, 22);
      });

      zone.on('pointerout', () => {
        g.clear();
        g.fillStyle(bgColor, 0.95);
        g.lineStyle(isCurrent ? 2.5 : 2, borderColor, 0.85);
        g.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
        g.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
        g.fillStyle(isCurrent ? 0x00ff88 : 0x00f0ff, 0.18);
        g.fillCircle(0, circleY, 22);
        g.lineStyle(2, isCurrent ? 0x00ff88 : 0x00f0ff, 0.9);
        g.strokeCircle(0, circleY, 22);
      });

      zone.on('pointerdown', () => {
        this.cameras.main.resetFX();
        this.scene.start('GameScene', { levelId });
      });
    } else {
      // LOCKED STATE
      g.fillStyle(0x08121f, 0.7);
      g.lineStyle(1.5, 0x1f2e42, 0.7);
      g.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
      g.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);

      // Lock icon in circle
      g.fillStyle(0x121c2b, 0.8);
      g.fillCircle(0, circleY, 20);
      g.lineStyle(1.5, 0x2a3d54, 0.8);
      g.strokeCircle(0, circleY, 20);

      const lockIcon = this.add.text(0, circleY, '🔒', {
        fontSize: '18px',
      });
      lockIcon.setOrigin(0.5);

      const lockLabel = this.add.text(0, circleY + 34, `MÀN ${numStr}`, {
        fontSize: '12px',
        fontFamily: 'monospace',
        color: '#4c627d',
        fontStyle: 'bold',
      });
      lockLabel.setOrigin(0.5, 0);

      const reqText = this.add.text(0, h / 2 - 18, `Vượt Màn ${levelId - 1}`, {
        fontSize: '9px',
        fontFamily: 'monospace',
        color: '#36495f',
      });
      reqText.setOrigin(0.5);

      cardContainer.add([g, lockIcon, lockLabel, reqText]);

      // Interactive zone with shake & warning on click
      const zone = this.add.zone(0, 0, w, h);
      zone.setInteractive({ useHandCursor: true });
      cardContainer.add(zone);

      zone.on('pointerdown', () => {
        // Shake tween
        this.tweens.add({
          targets: cardContainer,
          x: x + 6,
          duration: 50,
          yoyo: true,
          repeat: 3,
          onComplete: () => {
            cardContainer.x = x;
          },
        });

        // Show toast
        this.showLockedToast(levelId);
      });
    }
  }

  private showLockedToast(levelId: number): void {
    if (this.toastContainer) {
      this.toastContainer.destroy();
      this.toastContainer = null;
    }

    const container = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT * 0.45);
    container.setDepth(999);

    const toastBg = this.add.graphics();
    toastBg.fillStyle(0x140a1c, 0.95);
    toastBg.lineStyle(2, 0xff0055, 0.9);
    toastBg.fillRoundedRect(-240, -35, 480, 70, 12);
    toastBg.strokeRoundedRect(-240, -35, 480, 70, 12);

    const toastText = this.add.text(
      0,
      0,
      `🔒 MÀN ${levelId} ĐANG BỊ KHÓA!\nHãy vượt qua Màn ${levelId - 1} để mở khóa.`,
      {
        fontSize: '13px',
        fontFamily: 'monospace',
        color: '#ff88aa',
        fontStyle: 'bold',
        align: 'center',
        lineSpacing: 4,
      }
    );
    toastText.setOrigin(0.5);

    container.add([toastBg, toastText]);
    this.toastContainer = container;

    // Fade out and auto destroy
    this.tweens.add({
      targets: container,
      alpha: { from: 1, to: 0 },
      y: GAME_HEIGHT * 0.45 - 20,
      delay: 1500,
      duration: 500,
      onComplete: () => {
        container.destroy();
        if (this.toastContainer === container) {
          this.toastContainer = null;
        }
      },
    });
  }
}
