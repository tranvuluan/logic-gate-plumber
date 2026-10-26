import Phaser from 'phaser';
import { GateType, COLORS, CELL_SIZE, GAME_WIDTH } from '../utils/Constants';

/**
 * ProceduralGraphics - Generates all game graphics in Cyberpunk / High-Tech PCB style.
 * 100% procedural vector & canvas — zero external image dependencies!
 */
export class ProceduralGraphics {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  generateTextures(): void {
    // Logic Gates & Wires
    this.generateGateTexture(GateType.AND);
    this.generateGateTexture(GateType.OR);
    this.generateGateTexture(GateType.XOR);
    this.generateGateTexture(GateType.NOT);
    this.generateGateTexture(GateType.WIRE);
    this.generateGateTexture(GateType.WIRE_CORNER);
    this.generateGateTexture(GateType.SPLIT);

    // Terminal components
    this.generateSourceTexture(0);
    this.generateSourceTexture(1);
    this.generateLEDTexture(false);
    this.generateLEDTexture(true);

    // Board & UI elements
    this.generateEmptyCellTexture();
    this.generateParticleTexture();
    this.generatePlayerTexture();
    this.generateWrenchTexture();
    this.generatePadlockTexture();
    this.generateHintIconTexture();
    this.generateBookIconTexture();
  }

  private generateGateTexture(type: GateType): void {
    const size = CELL_SIZE;
    const padding = 10;
    const g = this.scene.add.graphics();

    switch (type) {
      case GateType.AND:
        this.drawANDGate(g, size, padding);
        break;
      case GateType.OR:
        this.drawORGate(g, size, padding);
        break;
      case GateType.XOR:
        this.drawXORGate(g, size, padding);
        break;
      case GateType.NOT:
        this.drawNOTGate(g, size, padding);
        break;
      case GateType.WIRE:
        this.drawWireStraight(g, size);
        break;
      case GateType.WIRE_CORNER:
        this.drawWireCorner(g, size);
        break;
      case GateType.SPLIT:
        this.drawSplit(g, size);
        break;
    }

    g.generateTexture(`gate_${type}`, size, size);
    g.destroy();
  }

  private drawANDGate(g: Phaser.GameObjects.Graphics, size: number, pad: number): void {
    const cx = size / 2;
    const cy = size / 2;
    const w = size - pad * 2;
    const h = size - pad * 2;

    // Outer chip base
    g.fillStyle(COLORS.GATE_BODY, 0.95);
    g.lineStyle(2, COLORS.GATE_BORDER, 0.9);
    g.fillRoundedRect(pad, pad, w, h, 8);
    g.strokeRoundedRect(pad, pad, w, h, 8);

    // D-Shape
    const s = 22;
    g.lineStyle(3, COLORS.CYBER_CYAN, 1);
    g.beginPath();
    g.moveTo(cx - s * 0.8, cy - s);
    g.lineTo(cx, cy - s);
    g.arc(cx, cy, s, -Math.PI / 2, Math.PI / 2, false);
    g.lineTo(cx - s * 0.8, cy + s);
    g.closePath();
    g.strokePath();

    // Input pins (TOP & BOTTOM)
    g.lineStyle(3, COLORS.CYBER_YELLOW, 0.85);
    g.beginPath();
    g.moveTo(cx, pad);
    g.lineTo(cx, cy - s);
    g.moveTo(cx, cy + s);
    g.lineTo(cx, size - pad);
    g.strokePath();

    // Output pin (RIGHT)
    g.lineStyle(3, COLORS.SIGNAL_ON, 0.9);
    g.beginPath();
    g.moveTo(cx + s, cy);
    g.lineTo(size, cy);
    g.strokePath();
  }

  private drawORGate(g: Phaser.GameObjects.Graphics, size: number, pad: number): void {
    const cx = size / 2;
    const cy = size / 2;
    const w = size - pad * 2;
    const h = size - pad * 2;

    g.fillStyle(COLORS.GATE_BODY, 0.95);
    g.lineStyle(2, COLORS.GATE_BORDER, 0.9);
    g.fillRoundedRect(pad, pad, w, h, 8);
    g.strokeRoundedRect(pad, pad, w, h, 8);

    // Curved OR shield
    const s = 22;
    g.lineStyle(3, COLORS.CYBER_CYAN, 1);
    g.beginPath();
    g.moveTo(cx - s * 0.8, cy - s);
    g.lineTo(cx + s * 0.2, cy - s * 0.8);
    g.lineTo(cx + s, cy);
    g.lineTo(cx + s * 0.2, cy + s * 0.8);
    g.lineTo(cx - s * 0.8, cy + s);
    g.lineTo(cx - s * 0.3, cy);
    g.closePath();
    g.strokePath();

    // Input pins (TOP & BOTTOM)
    g.lineStyle(3, COLORS.CYBER_YELLOW, 0.85);
    g.beginPath();
    g.moveTo(cx, pad);
    g.lineTo(cx, cy - s * 0.7);
    g.moveTo(cx, cy + s * 0.7);
    g.lineTo(cx, size - pad);
    g.strokePath();

    // Output pin (RIGHT)
    g.lineStyle(3, COLORS.SIGNAL_ON, 0.9);
    g.beginPath();
    g.moveTo(cx + s, cy);
    g.lineTo(size, cy);
    g.strokePath();
  }

  private drawXORGate(g: Phaser.GameObjects.Graphics, size: number, pad: number): void {
    const cx = size / 2;
    const cy = size / 2;
    const w = size - pad * 2;
    const h = size - pad * 2;

    g.fillStyle(COLORS.GATE_BODY, 0.95);
    g.lineStyle(2, COLORS.GATE_BORDER, 0.9);
    g.fillRoundedRect(pad, pad, w, h, 8);
    g.strokeRoundedRect(pad, pad, w, h, 8);

    // Double-arc XOR
    const s = 22;
    g.lineStyle(3, COLORS.CYBER_CYAN, 1);
    g.beginPath();
    g.moveTo(cx - s * 0.6, cy - s);
    g.lineTo(cx + s * 0.2, cy - s * 0.8);
    g.lineTo(cx + s, cy);
    g.lineTo(cx + s * 0.2, cy + s * 0.8);
    g.lineTo(cx - s * 0.6, cy + s);
    g.lineTo(cx - s * 0.2, cy);
    g.closePath();
    g.strokePath();

    // Extra curved line
    g.beginPath();
    g.moveTo(cx - s * 0.85, cy - s);
    g.lineTo(cx - s * 0.45, cy);
    g.lineTo(cx - s * 0.85, cy + s);
    g.strokePath();

    // Pins
    g.lineStyle(3, COLORS.CYBER_YELLOW, 0.85);
    g.beginPath();
    g.moveTo(cx, pad);
    g.lineTo(cx, cy - s * 0.7);
    g.moveTo(cx, cy + s * 0.7);
    g.lineTo(cx, size - pad);
    g.strokePath();

    // Output pin
    g.lineStyle(3, COLORS.SIGNAL_ON, 0.9);
    g.beginPath();
    g.moveTo(cx + s, cy);
    g.lineTo(size, cy);
    g.strokePath();
  }

  private drawNOTGate(g: Phaser.GameObjects.Graphics, size: number, pad: number): void {
    const cx = size / 2;
    const cy = size / 2;
    const w = size - pad * 2;
    const h = size - pad * 2;

    g.fillStyle(COLORS.GATE_BODY, 0.95);
    g.lineStyle(2, COLORS.GATE_BORDER, 0.9);
    g.fillRoundedRect(pad, pad, w, h, 8);
    g.strokeRoundedRect(pad, pad, w, h, 8);

    const s = 20;
    // Triangle
    g.lineStyle(3, COLORS.CYBER_CYAN, 1);
    g.beginPath();
    g.moveTo(cx - s, cy - s * 0.8);
    g.lineTo(cx + s * 0.4, cy);
    g.lineTo(cx - s, cy + s * 0.8);
    g.closePath();
    g.strokePath();

    // Bubble (Inverter circle)
    g.fillStyle(COLORS.BG_DARK, 1);
    g.lineStyle(3, COLORS.CYBER_CYAN, 1);
    g.fillCircle(cx + s * 0.75, cy, 6);
    g.strokeCircle(cx + s * 0.75, cy, 6);

    // Input pin (LEFT)
    g.lineStyle(3, COLORS.CYBER_YELLOW, 0.85);
    g.beginPath();
    g.moveTo(0, cy);
    g.lineTo(cx - s, cy);
    g.strokePath();

    // Output pin (RIGHT)
    g.lineStyle(3, COLORS.SIGNAL_ON, 0.9);
    g.beginPath();
    g.moveTo(cx + s * 0.75 + 6, cy);
    g.lineTo(size, cy);
    g.strokePath();
  }

  private drawWireStraight(g: Phaser.GameObjects.Graphics, size: number): void {
    const cy = size / 2;

    // Dark copper trace base
    g.lineStyle(10, COLORS.SIGNAL_OFF, 0.9);
    g.beginPath();
    g.moveTo(0, cy);
    g.lineTo(size, cy);
    g.strokePath();

    // Glowing core
    g.lineStyle(4, COLORS.WIRE_COPPER, 1);
    g.beginPath();
    g.moveTo(0, cy);
    g.lineTo(size, cy);
    g.strokePath();

    // Solder joint in center
    g.fillStyle(COLORS.CYBER_YELLOW, 1);
    g.fillCircle(size / 2, cy, 5);
  }

  private drawWireCorner(g: Phaser.GameObjects.Graphics, size: number): void {
    const cx = size / 2;
    const cy = size / 2;

    // Corner: LEFT to DOWN (rot 0)
    g.lineStyle(10, COLORS.SIGNAL_OFF, 0.9);
    g.beginPath();
    g.moveTo(0, cy);
    g.lineTo(cx, cy);
    g.lineTo(cx, size);
    g.strokePath();

    // Inner core
    g.lineStyle(4, COLORS.WIRE_COPPER, 1);
    g.beginPath();
    g.moveTo(0, cy);
    g.lineTo(cx, cy);
    g.lineTo(cx, size);
    g.strokePath();

    // Corner junction pad
    g.fillStyle(COLORS.CYBER_YELLOW, 1);
    g.fillCircle(cx, cy, 6);
  }

  private drawSplit(g: Phaser.GameObjects.Graphics, size: number): void {
    const cx = size / 2;
    const cy = size / 2;

    // T-junction: LEFT to RIGHT, and DOWN
    g.lineStyle(10, COLORS.SIGNAL_OFF, 0.9);
    g.beginPath();
    g.moveTo(0, cy);
    g.lineTo(size, cy);
    g.moveTo(cx, cy);
    g.lineTo(cx, size);
    g.strokePath();

    g.lineStyle(4, COLORS.WIRE_COPPER, 1);
    g.beginPath();
    g.moveTo(0, cy);
    g.lineTo(size, cy);
    g.moveTo(cx, cy);
    g.lineTo(cx, size);
    g.strokePath();

    // Split junction pad
    g.fillStyle(COLORS.CYBER_YELLOW, 1);
    g.fillCircle(cx, cy, 7);
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(cx, cy, 3);
  }

  private generateSourceTexture(value: number): void {
    const size = CELL_SIZE;
    const g = this.scene.add.graphics();
    const cx = size / 2;
    const cy = size / 2;
    const radius = 32;

    const color = value === 1 ? COLORS.SIGNAL_ON : COLORS.SIGNAL_OFF;

    // Glowing halo for 1
    if (value === 1) {
      g.fillStyle(COLORS.SIGNAL_ON_GLOW, 0.12);
      g.fillCircle(cx, cy, radius + 14);
      g.fillStyle(COLORS.SIGNAL_ON, 0.25);
      g.fillCircle(cx, cy, radius + 6);
    }

    // Generator hexagon or circle
    g.fillStyle(0x0e2034, 1);
    g.lineStyle(3, color, 1);
    g.fillCircle(cx, cy, radius);
    g.strokeCircle(cx, cy, radius);

    // Inner ring
    g.lineStyle(2, color, 0.5);
    g.strokeCircle(cx, cy, radius - 6);

    // Output pin to right
    g.lineStyle(4, color, 1);
    g.beginPath();
    g.moveTo(cx + radius, cy);
    g.lineTo(size, cy);
    g.strokePath();

    g.generateTexture(`source_${value}`, size, size);
    g.destroy();
  }

  private generateLEDTexture(isOn: boolean): void {
    const size = CELL_SIZE;
    const g = this.scene.add.graphics();
    const cx = size / 2;
    const cy = size / 2;
    const radius = 26;

    if (isOn) {
      // Intense neon radial glow
      g.fillStyle(COLORS.LED_GLOW, 0.08);
      g.fillCircle(cx, cy, radius + 22);
      g.fillStyle(COLORS.LED_GLOW, 0.18);
      g.fillCircle(cx, cy, radius + 14);
      g.fillStyle(COLORS.LED_GLOW, 0.35);
      g.fillCircle(cx, cy, radius + 6);
    }

    // Diode dome
    const color = isOn ? COLORS.LED_ON : COLORS.LED_OFF;
    g.fillStyle(color, 1);
    g.lineStyle(3, isOn ? 0x00ff88 : 0x334a60, 1);
    g.fillCircle(cx, cy, radius);
    g.strokeCircle(cx, cy, radius);

    // Glass reflection
    if (isOn) {
      g.fillStyle(0xffffff, 0.6);
      g.fillCircle(cx - 7, cy - 7, 7);
    } else {
      g.fillStyle(0xffffff, 0.15);
      g.fillCircle(cx - 6, cy - 6, 6);
    }

    // Input contact line
    g.lineStyle(4, isOn ? COLORS.SIGNAL_ON : COLORS.SIGNAL_OFF, 1);
    g.beginPath();
    g.moveTo(0, cy);
    g.lineTo(cx - radius, cy);
    g.strokePath();

    g.generateTexture(isOn ? 'led_on' : 'led_off', size, size);
    g.destroy();
  }

  private generateEmptyCellTexture(): void {
    const size = CELL_SIZE;
    const g = this.scene.add.graphics();

    // Dark PCB cell
    g.fillStyle(COLORS.BOARD_BG, 0.7);
    g.fillRect(2, 2, size - 4, size - 4);

    // Solder pad dots at corners
    g.fillStyle(COLORS.BOARD_GRID, 0.8);
    g.fillCircle(8, 8, 2.5);
    g.fillCircle(size - 8, 8, 2.5);
    g.fillCircle(8, size - 8, 2.5);
    g.fillCircle(size - 8, size - 8, 2.5);

    g.generateTexture('cell_empty', size, size);
    g.destroy();
  }

  private generateParticleTexture(): void {
    const size = 16;
    const g = this.scene.add.graphics();

    g.fillStyle(COLORS.SIGNAL_ON, 1);
    g.fillCircle(size / 2, size / 2, size / 2);
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(size / 2, size / 2, size / 4);

    g.generateTexture('particle_spark', size, size);
    g.destroy();
  }

  private generatePlayerTexture(): void {
    const size = 60;
    const g = this.scene.add.graphics();
    const cx = size / 2;

    // Ground shadow
    g.fillStyle(0x000000, 0.4);
    g.fillCircle(cx, 50, 15);

    // Boots
    g.fillStyle(0x132333, 1);
    g.fillRoundedRect(cx - 11, 38, 9, 13, 3);
    g.fillRoundedRect(cx + 2, 38, 9, 13, 3);

    // Cyan Cyberpunk Hazard Suit
    g.fillStyle(0x0088cc, 1);
    g.fillRoundedRect(cx - 13, 23, 26, 17, 5);

    // High-vis orange tool belt
    g.fillStyle(0xff6600, 1);
    g.fillRect(cx - 13, 33, 26, 5);
    g.fillStyle(COLORS.CYBER_YELLOW, 1);
    g.fillRect(cx - 3, 32, 6, 7);

    // Power battery backpack
    g.fillStyle(0x1e364d, 1);
    g.fillRoundedRect(cx - 16, 21, 5, 15, 2);
    // Antenna
    g.lineStyle(2, 0x88aabb, 1);
    g.beginPath();
    g.moveTo(cx - 14, 21);
    g.lineTo(cx - 14, 10);
    g.strokePath();
    g.fillStyle(0xff0055, 1);
    g.fillCircle(cx - 14, 9, 3.5);

    // Cyber Helmet
    g.fillStyle(0x22364c, 1);
    g.lineStyle(2, COLORS.CYBER_CYAN, 0.9);
    g.fillCircle(cx, 14, 13);
    g.strokeCircle(cx, 14, 13);

    // Glowing Neon Visor
    g.fillStyle(COLORS.CYBER_CYAN, 1);
    g.fillRoundedRect(cx - 9, 10, 18, 9, 3);
    g.fillStyle(0xffffff, 0.7);
    g.fillRect(cx - 6, 11, 4, 3);

    // Test probe in hand
    g.fillStyle(0xffaa00, 1);
    g.fillCircle(cx + 15, 28, 4);
    g.lineStyle(2, COLORS.CYBER_YELLOW, 1);
    g.beginPath();
    g.moveTo(cx + 15, 28);
    g.lineTo(cx + 22, 19);
    g.strokePath();
    g.fillStyle(COLORS.SIGNAL_ON, 1);
    g.fillCircle(cx + 22, 18, 3.5);

    g.generateTexture('player_plumber', size, size);
    g.destroy();
  }

  private generateWrenchTexture(): void {
    const size = 68;
    const g = this.scene.add.graphics();
    const cx = size / 2;
    const cy = size / 2;

    g.fillStyle(0x102844, 0.9);
    g.lineStyle(3, COLORS.CYBER_CYAN, 0.95);
    g.fillCircle(cx, cy, 30);
    g.strokeCircle(cx, cy, 30);

    // Wrench
    g.lineStyle(4, COLORS.CYBER_YELLOW, 1);
    g.beginPath();
    g.arc(cx - 7, cy - 7, 11, -Math.PI / 4, (5 * Math.PI) / 4, false);
    g.strokePath();

    g.beginPath();
    g.moveTo(cx - 1, cy - 1);
    g.lineTo(cx + 14, cy + 14);
    g.strokePath();

    g.generateTexture('btn_wrench', size, size);
    g.destroy();
  }

  private generatePadlockTexture(): void {
    const size = 32;
    const g = this.scene.add.graphics();
    const cx = size / 2;
    const cy = size / 2;

    // Golden lock shackle
    g.lineStyle(3, COLORS.CYBER_GOLD, 1);
    g.beginPath();
    g.arc(cx, cy - 4, 7, Math.PI, 0, false);
    g.lineTo(cx + 7, cy + 2);
    g.moveTo(cx - 7, cy - 4);
    g.lineTo(cx - 7, cy + 2);
    g.strokePath();

    // Lock body
    g.fillStyle(COLORS.CYBER_GOLD, 1);
    g.fillRoundedRect(cx - 9, cy, 18, 14, 3);

    // Keyhole
    g.fillStyle(0x000000, 0.8);
    g.fillCircle(cx, cy + 6, 2.5);
    g.fillRect(cx - 1.5, cy + 6, 3, 4);

    g.generateTexture('icon_padlock', size, size);
    g.destroy();
  }

  private generateHintIconTexture(): void {
    const size = 48;
    const g = this.scene.add.graphics();
    const cx = size / 2;
    const cy = size / 2;

    // Glowing bulb outline
    g.fillStyle(0x0e243c, 0.9);
    g.lineStyle(2, COLORS.CYBER_YELLOW, 1);
    g.fillCircle(cx, cy, 21);
    g.strokeCircle(cx, cy, 21);

    // Lightbulb icon
    g.fillStyle(COLORS.CYBER_YELLOW, 1);
    g.fillCircle(cx, cy - 3, 10);
    g.fillRoundedRect(cx - 5, cy + 5, 10, 6, 2);

    g.generateTexture('icon_hint', size, size);
    g.destroy();
  }

  private generateBookIconTexture(): void {
    const size = 48;
    const g = this.scene.add.graphics();
    const cx = size / 2;
    const cy = size / 2;

    g.fillStyle(0x0e243c, 0.9);
    g.lineStyle(2, COLORS.CYBER_CYAN, 1);
    g.fillCircle(cx, cy, 21);
    g.strokeCircle(cx, cy, 21);

    // Open cheat book
    g.lineStyle(2, COLORS.CYBER_CYAN, 1);
    g.strokeRoundedRect(cx - 10, cy - 8, 20, 16, 2);
    g.beginPath();
    g.moveTo(cx, cy - 8);
    g.lineTo(cx, cy + 8);
    g.strokePath();

    g.generateTexture('icon_cheatsheet', size, size);
    g.destroy();
  }

  drawBackground(g: Phaser.GameObjects.Graphics, width: number, height: number): void {
    // Dark cyberpunk midnight gradient
    g.fillStyle(COLORS.BG_DARK, 1);
    g.fillRect(0, 0, width, height);

    // Futuristic micro-grid pattern
    g.lineStyle(1, 0x112844, 0.35);
    const spacing = 36;
    for (let x = 0; x < width; x += spacing) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, height);
      g.strokePath();
    }
    for (let y = 0; y < height; y += spacing) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(width, y);
      g.strokePath();
    }

    // High-tech PCB bus traces with solder vias
    g.lineStyle(1.5, COLORS.CYBER_CYAN, 0.12);
    const tracePaths = [
      [30, 150, 180, 150, 240, 210, 480, 210],
      [GAME_WIDTH - 30, 280, 520, 280, 460, 340, 300, 340],
      [60, 850, 200, 850, 260, 910, 450, 910],
      [GAME_WIDTH - 50, 960, 420, 960, 360, 1020, 100, 1020],
      [50, 1150, 220, 1150, 280, 1210, 500, 1210],
    ];

    for (const path of tracePaths) {
      g.beginPath();
      g.moveTo(path[0], path[1]);
      for (let i = 2; i < path.length; i += 2) {
        g.lineTo(path[i], path[i + 1]);
      }
      g.strokePath();

      // Golden solder vias at ends
      g.fillStyle(COLORS.CYBER_YELLOW, 0.25);
      g.fillCircle(path[0], path[1], 3.5);
      g.fillCircle(path[path.length - 2], path[path.length - 1], 3.5);
    }
  }

  drawGridBackground(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    cols: number,
    rows: number,
    cellSize: number
  ): void {
    const width = cols * cellSize;
    const height = rows * cellSize;

    // Glowing Cyber Beveled Frame
    g.fillStyle(COLORS.BOARD_BG, 0.95);
    g.lineStyle(3, COLORS.BOARD_BORDER, 0.7);
    g.fillRoundedRect(x - 8, y - 8, width + 16, height + 16, 12);
    g.strokeRoundedRect(x - 8, y - 8, width + 16, height + 16, 12);

    // Inner bevel shadow
    g.lineStyle(1, 0x00f0ff, 0.25);
    g.strokeRoundedRect(x - 4, y - 4, width + 8, height + 8, 8);

    // Internal Grid lines
    g.lineStyle(1, COLORS.BOARD_GRID, 0.7);
    for (let col = 0; col <= cols; col++) {
      g.beginPath();
      g.moveTo(x + col * cellSize, y);
      g.lineTo(x + col * cellSize, y + height);
      g.strokePath();
    }
    for (let row = 0; row <= rows; row++) {
      g.beginPath();
      g.moveTo(x, y + row * cellSize);
      g.lineTo(x + width, y + row * cellSize);
      g.strokePath();
    }
  }
}
