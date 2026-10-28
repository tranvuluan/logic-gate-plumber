import Phaser from 'phaser';
import { COLORS, FONTS } from '../utils/Constants';
import { ProceduralGraphics } from '../graphics/ProceduralGraphics';
import { ProgressManager } from '../utils/ProgressManager';
import { i18n } from '../utils/i18n';
import { audio } from '../utils/AudioManager';
import { crazyGames } from '../utils/CrazyGamesManager';
import { OrientationManager } from '../utils/OrientationManager';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    crazyGames.gameplayStop();
    this.cameras.main.resetFX();
    this.cameras.main.setAlpha(1);

    const width = this.scale.width;
    const height = this.scale.height;
    const isPort = OrientationManager.isPortrait(this);

    // Draw PCB background
    const bg = this.add.graphics();
    const procGraphics = new ProceduralGraphics(this);
    procGraphics.drawBackground(bg, width, height);

    // Top Header Action Buttons: Language, Sound, Orientation, Fullscreen
    this.createHeaderControls(width, isPort);

    // Auto-resume audio & ambient BGM on first user touch/click
    audio.setChapterBGM(0);
    this.input.once('pointerdown', () => {
      audio.resume();
      audio.setChapterBGM(0);
    });

    // Title group
    const titleY = isPort ? 210 : height * 0.26;

    // Circuit icon
    const icon = this.add.text(width / 2, titleY - (isPort ? 70 : 70), '⚡', {
      fontSize: isPort ? '50px' : '56px',
    });
    icon.setOrigin(0.5);

    // Game title
    const title = this.add.text(width / 2, titleY, 'LOGIC GATE PLUMBER', {
      fontSize: isPort ? '36px' : '52px',
      fontFamily: FONTS.TITLE,
      color: '#00ff9d',
      fontStyle: 'bold',
      stroke: '#002e1a',
      strokeThickness: 4,
    });
    title.setOrigin(0.5);

    // Subtitle
    const subtitle = this.add.text(
      width / 2,
      titleY + (isPort ? 46 : 54),
      i18n.t('menu_subtitle'),
      {
        fontSize: isPort ? '15px' : '18px',
        fontFamily: FONTS.UI,
        color: '#00f0ff',
        fontStyle: 'bold',
        letterSpacing: isPort ? 1 : 2,
      }
    );
    subtitle.setOrigin(0.5);

    // Subtle glow animation on titles
    this.tweens.add({
      targets: [title, icon],
      alpha: { from: 0.88, to: 1 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
    });

    // Retrieve unlocked level
    const unlockedLevel = ProgressManager.getUnlockedLevel();

    // Action Buttons
    const buttonY = isPort ? 390 : height * 0.54;
    const buttonSpacing = isPort ? 68 : 68;
    const btnWidth = isPort ? 340 : 360;
    const continueLabel =
      unlockedLevel > 1
        ? i18n.t('btn_continue', { level: unlockedLevel })
        : i18n.t('btn_play_new');

    // 1. Play / Continue
    this.createButton(
      width / 2,
      buttonY,
      btnWidth,
      continueLabel,
      true,
      () => {
        this.cameras.main.resetFX();
        this.scene.start('GameScene', { levelId: unlockedLevel });
      }
    );

    // 2. Select Level
    this.createButton(
      width / 2,
      buttonY + buttonSpacing,
      btnWidth,
      i18n.t('btn_select_level'),
      false,
      () => {
        this.cameras.main.resetFX();
        this.scene.start('LevelSelectScene');
      }
    );

    // 3. Tutorial / How to Play
    this.createButton(
      width / 2,
      buttonY + buttonSpacing * 2,
      btnWidth,
      i18n.t('btn_tutorial'),
      false,
      () => {
        this.showTutorial();
      }
    );

    // Cyberpunk Status Footer
    const footerBg = this.add.graphics();
    footerBg.fillStyle(0x0a1628, 0.85);
    footerBg.fillRect(0, height - 44, width, 44);
    footerBg.lineStyle(1.5, COLORS.CYBER_CYAN, 0.4);
    footerBg.lineBetween(0, height - 44, width, height - 44);

    const footerText = isPort
      ? '⚡ 100 LEVELS • DIGITAL LOGIC GATES • PAR SCORING'
      : '⚡ 100 UNIQUE LEVELS • REAL DIGITAL CIRCUITS • AND • OR • NOT • XOR • NAND • NOR • XNOR';

    const footer = this.add.text(
      width / 2,
      height - 22,
      footerText,
      {
        fontSize: isPort ? '12px' : '13px',
        fontFamily: FONTS.TITLE,
        color: '#6e93b8',
      }
    );
    footer.setOrigin(0.5);

    // Decorative badges: side-by-side or below buttons
    this.drawDecorativeSideBadges(width, height, isPort);
  }

  private createHeaderControls(width: number, isPort: boolean): void {
    const y = 36;
    if (isPort) {
      // Portrait compact header
      this.createLanguageToggle(width - 55, y);
      this.createAudioToggle(width - 130, y);
      this.createFullscreenToggle(width - 205, y);
    } else {
      // Landscape header
      this.createLanguageToggle(width - 65, y);
      this.createAudioToggle(width - 140, y);
      this.createFullscreenToggle(width - 215, y);
    }
  }

  private drawDecorativeSideBadges(width: number, height: number, isPort: boolean): void {
    if (isPort) {
      // In portrait: place two badges side-by-side below the buttons
      const badgeY = 740;
      const bw = 260;
      const bh = 190;

      // Left chip badge (Gate Matrix)
      const leftX = width / 2 - 145;
      const leftG = this.add.graphics();
      leftG.fillStyle(0x0c1b30, 0.85);
      leftG.lineStyle(1.5, COLORS.CYBER_CYAN, 0.6);
      leftG.fillRoundedRect(leftX - bw / 2, badgeY - bh / 2, bw, bh, 8);
      leftG.strokeRoundedRect(leftX - bw / 2, badgeY - bh / 2, bw, bh, 8);

      const leftTitle = this.add.text(leftX, badgeY - 65, 'GATE MATRIX', {
        fontSize: '13px',
        fontFamily: FONTS.TITLE,
        color: '#00f0ff',
        fontStyle: 'bold',
      });
      leftTitle.setOrigin(0.5);

      const gatesList = ['AND  [&]', 'OR   [≥1]', 'NOT  [▷○]', 'XOR  [=1]'];
      gatesList.forEach((g, i) => {
        const gt = this.add.text(leftX, badgeY - 32 + i * 26, g, {
          fontSize: '13px',
          fontFamily: FONTS.MONO,
          color: '#90caf9',
        });
        gt.setOrigin(0.5);
      });

      // Right chip badge (System Specs)
      const rightX = width / 2 + 145;
      const rightG = this.add.graphics();
      rightG.fillStyle(0x0c1b30, 0.85);
      rightG.lineStyle(1.5, COLORS.CYBER_YELLOW, 0.6);
      rightG.fillRoundedRect(rightX - bw / 2, badgeY - bh / 2, bw, bh, 8);
      rightG.strokeRoundedRect(rightX - bw / 2, badgeY - bh / 2, bw, bh, 8);

      const rightTitle = this.add.text(rightX, badgeY - 65, 'SYSTEM SPECS', {
        fontSize: '13px',
        fontFamily: FONTS.TITLE,
        color: '#ffd000',
        fontStyle: 'bold',
      });
      rightTitle.setOrigin(0.5);

      const specs = ['5 CHAPTERS', '100 PUZZLES', 'ENDLESS MODE', 'PAR SCORING'];
      specs.forEach((s, i) => {
        const st = this.add.text(rightX, badgeY - 32 + i * 26, s, {
          fontSize: '13px',
          fontFamily: FONTS.MONO,
          color: '#ffecb3',
        });
        st.setOrigin(0.5);
      });
    } else {
      // Landscape badges on extreme left and right
      const leftX = 140;
      const leftY = height * 0.52;

      const leftG = this.add.graphics();
      leftG.fillStyle(0x0c1b30, 0.85);
      leftG.lineStyle(1.5, COLORS.CYBER_CYAN, 0.6);
      leftG.fillRoundedRect(leftX - 80, leftY - 110, 160, 220, 10);
      leftG.strokeRoundedRect(leftX - 80, leftY - 110, 160, 220, 10);

      const leftTitle = this.add.text(leftX, leftY - 80, 'GATE MATRIX', {
        fontSize: '14px',
        fontFamily: FONTS.TITLE,
        color: '#00f0ff',
        fontStyle: 'bold',
      });
      leftTitle.setOrigin(0.5);

      const gatesList = ['AND  [&]', 'OR   [≥1]', 'NOT  [▷○]', 'XOR  [=1]'];
      gatesList.forEach((g, i) => {
        const gt = this.add.text(leftX, leftY - 40 + i * 36, g, {
          fontSize: '15px',
          fontFamily: FONTS.MONO,
          color: '#90caf9',
        });
        gt.setOrigin(0.5);
      });

      // Right chip badge
      const rightX = width - 140;
      const rightY = height * 0.52;

      const rightG = this.add.graphics();
      rightG.fillStyle(0x0c1b30, 0.85);
      rightG.lineStyle(1.5, COLORS.CYBER_YELLOW, 0.6);
      rightG.fillRoundedRect(rightX - 80, rightY - 110, 160, 220, 10);
      rightG.strokeRoundedRect(rightX - 80, rightY - 110, 160, 220, 10);

      const rightTitle = this.add.text(rightX, rightY - 80, 'SYSTEM SPECS', {
        fontSize: '14px',
        fontFamily: FONTS.TITLE,
        color: '#ffd000',
        fontStyle: 'bold',
      });
      rightTitle.setOrigin(0.5);

      const specs = ['5 CHAPTERS', '100 PUZZLES', 'ENDLESS MODE', 'PAR SCORING'];
      specs.forEach((s, i) => {
        const st = this.add.text(rightX, rightY - 40 + i * 36, s, {
          fontSize: '14px',
          fontFamily: FONTS.MONO,
          color: '#ffecb3',
        });
        st.setOrigin(0.5);
      });
    }
  }

  private createLanguageToggle(x: number, y: number): void {
    const lang = i18n.getLanguage();
    const btnContainer = this.add.container(x, y);
    btnContainer.setDepth(150);

    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x0e243c, 0.95);
    btnBg.lineStyle(1.5, COLORS.CYBER_CYAN, 0.85);
    btnBg.fillRoundedRect(-40, -17, 80, 34, 6);
    btnBg.strokeRoundedRect(-40, -17, 80, 34, 6);

    const flagText = lang === 'vi' ? '🇻🇳 VI' : '🇬🇧 EN';
    const label = this.add.text(0, 0, flagText, {
      fontSize: '13px',
      fontFamily: FONTS.UI,
      color: '#00f0ff',
      fontStyle: 'bold',
    });
    label.setOrigin(0.5);

    btnContainer.add([btnBg, label]);

    const zone = this.add.zone(0, 0, 80, 34);
    zone.setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => {
      audio.playButtonClick();
      this.tweens.add({
        targets: btnContainer,
        scaleX: 0.9,
        scaleY: 0.9,
        duration: 70,
        yoyo: true,
        onComplete: () => {
          i18n.toggleLanguage();
          this.scene.restart();
        },
      });
    });
    btnContainer.add(zone);
  }

  private createAudioToggle(x: number, y: number): void {
    const isMuted = audio.isMuted();
    const btnContainer = this.add.container(x, y);
    btnContainer.setDepth(150);

    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x0e243c, 0.95);
    btnBg.lineStyle(1.5, COLORS.CYBER_CYAN, 0.85);
    btnBg.fillRoundedRect(-20, -17, 40, 34, 6);
    btnBg.strokeRoundedRect(-20, -17, 40, 34, 6);

    const icon = this.add.text(0, 0, isMuted ? '🔇' : '🔊', {
      fontSize: '15px',
    });
    icon.setOrigin(0.5);

    btnContainer.add([btnBg, icon]);

    const zone = this.add.zone(0, 0, 40, 34);
    zone.setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => {
      const nowMuted = audio.toggleMute();
      icon.setText(nowMuted ? '🔇' : '🔊');
      if (!nowMuted) {
        audio.playButtonClick();
        audio.startBGM();
      }
      this.tweens.add({
        targets: btnContainer,
        scaleX: 0.88,
        scaleY: 0.88,
        duration: 70,
        yoyo: true,
      });
    });
    btnContainer.add(zone);
  }

  private createFullscreenToggle(x: number, y: number): void {
    const btnContainer = this.add.container(x, y);
    btnContainer.setDepth(150);

    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x0e243c, 0.95);
    btnBg.lineStyle(1.5, COLORS.CYBER_CYAN, 0.85);
    btnBg.fillRoundedRect(-20, -17, 40, 34, 6);
    btnBg.strokeRoundedRect(-20, -17, 40, 34, 6);

    const icon = this.add.text(0, 0, '⛶', {
      fontSize: '17px',
      color: '#00f0ff',
    });
    icon.setOrigin(0.5);

    btnContainer.add([btnBg, icon]);

    const zone = this.add.zone(0, 0, 40, 34);
    zone.setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => {
      audio.playButtonClick();
      if (this.scale.isFullscreen) {
        this.scale.stopFullscreen();
      } else {
        this.scale.startFullscreen();
      }
    });
    btnContainer.add(zone);
  }

  private createButton(
    x: number,
    y: number,
    btnWidth: number,
    text: string,
    isPrimary: boolean,
    callback: () => void
  ): void {
    const btnHeight = 52;

    const bg = this.add.graphics();
    const strokeCol = isPrimary ? COLORS.SIGNAL_ON : COLORS.UI_PRIMARY;
    bg.fillStyle(isPrimary ? 0x0c3325 : COLORS.UI_BUTTON, 1);
    bg.lineStyle(2, strokeCol, 0.9);
    bg.fillRoundedRect(x - btnWidth / 2, y - btnHeight / 2, btnWidth, btnHeight, 10);
    bg.strokeRoundedRect(x - btnWidth / 2, y - btnHeight / 2, btnWidth, btnHeight, 10);

    const label = this.add.text(x, y, text, {
      fontSize: '19px',
      fontFamily: FONTS.TITLE,
      color: isPrimary ? '#00ff9d' : '#ffffff',
      fontStyle: 'bold',
    });
    label.setOrigin(0.5);

    const hitZone = this.add.zone(x, y, btnWidth, btnHeight);
    hitZone.setInteractive({ useHandCursor: true });

    hitZone.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(isPrimary ? 0x114d36 : COLORS.UI_BUTTON_HOVER, 1);
      bg.lineStyle(2.5, isPrimary ? 0x00ffcc : 0x00ffff, 1);
      bg.fillRoundedRect(x - btnWidth / 2, y - btnHeight / 2, btnWidth, btnHeight, 10);
      bg.strokeRoundedRect(x - btnWidth / 2, y - btnHeight / 2, btnWidth, btnHeight, 10);
      label.setColor(isPrimary ? '#ffffff' : '#00ffff');
    });

    hitZone.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(isPrimary ? 0x0c3325 : COLORS.UI_BUTTON, 1);
      bg.lineStyle(2, strokeCol, 0.9);
      bg.fillRoundedRect(x - btnWidth / 2, y - btnHeight / 2, btnWidth, btnHeight, 10);
      bg.strokeRoundedRect(x - btnWidth / 2, y - btnHeight / 2, btnWidth, btnHeight, 10);
      label.setColor(isPrimary ? '#00ff9d' : '#ffffff');
    });

    hitZone.on('pointerdown', () => {
      audio.playButtonClick();
      this.tweens.add({
        targets: [label],
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 70,
        yoyo: true,
        onComplete: callback,
      });
    });
  }

  private showTutorial(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    const modalGroup = this.add.container(0, 0);
    modalGroup.setDepth(200);

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.85);
    overlay.fillRect(0, 0, width, height);
    overlay.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, width, height),
      Phaser.Geom.Rectangle.Contains
    );

    const pw = Math.min(800, width - 40);
    const ph = Math.min(540, height - 60);
    const px = (width - pw) / 2;
    const py = (height - ph) / 2;

    const panel = this.add.graphics();
    panel.fillStyle(COLORS.UI_PANEL, 0.98);
    panel.lineStyle(2, COLORS.CYBER_CYAN, 0.95);
    panel.fillRoundedRect(px, py, pw, ph, 14);
    panel.strokeRoundedRect(px, py, pw, ph, 14);

    const title = this.add.text(
      width / 2,
      py + 32,
      i18n.t('tutorial_title'),
      {
        fontSize: '22px',
        fontFamily: FONTS.TITLE,
        color: '#00ff9d',
        fontStyle: 'bold',
      }
    );
    title.setOrigin(0.5);

    const body = this.add.text(px + 30, py + 72, i18n.t('tutorial_body'), {
      fontSize: '15px',
      fontFamily: FONTS.UI,
      color: '#d0e5ff',
      lineSpacing: 7,
      wordWrap: { width: pw - 60 },
    });

    // Close button
    const closeBtnY = py + ph - 38;
    const closeBtn = this.add.text(width / 2, closeBtnY, i18n.t('btn_close'), {
      fontSize: '18px',
      fontFamily: FONTS.TITLE,
      color: '#ffd000',
      fontStyle: 'bold',
    });
    closeBtn.setOrigin(0.5);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => {
      audio.playButtonClick();
      modalGroup.destroy();
    });

    modalGroup.add([overlay, panel, title, body, closeBtn]);
  }
}
