import Phaser from 'phaser';

export interface JoystickDirection {
  x: number; // -1 to 1
  y: number; // -1 to 1
  angle: number;
  force: number; // 0 to 1
  isDown: boolean;
}

export class VirtualJoystick {
  private scene: Phaser.Scene;
  private base!: Phaser.GameObjects.Arc;
  private thumb!: Phaser.GameObjects.Arc;
  private outerRing!: Phaser.GameObjects.Arc;
  private container!: Phaser.GameObjects.Container;
  private radius: number = 55;
  private baseX: number;
  private baseY: number;
  private currentPointer: Phaser.Input.Pointer | null = null;

  private boundPointerDown: (pointer: Phaser.Input.Pointer) => void;
  private boundPointerMove: (pointer: Phaser.Input.Pointer) => void;
  private boundPointerUp: (pointer: Phaser.Input.Pointer) => void;

  public direction: JoystickDirection = {
    x: 0,
    y: 0,
    angle: 0,
    force: 0,
    isDown: false,
  };

  constructor(scene: Phaser.Scene, x: number, y: number, radius: number = 55) {
    this.scene = scene;
    this.baseX = x;
    this.baseY = y;
    this.radius = radius;

    this.boundPointerDown = (pointer: Phaser.Input.Pointer) => {
      const dist = Phaser.Math.Distance.Between(pointer.x, pointer.y, this.baseX, this.baseY);
      if (dist <= this.radius * 1.4 && !this.currentPointer) {
        this.currentPointer = pointer;
        this.updateThumb(pointer.x, pointer.y);
      }
    };

    this.boundPointerMove = (pointer: Phaser.Input.Pointer) => {
      if (this.currentPointer && this.currentPointer.id === pointer.id) {
        this.updateThumb(pointer.x, pointer.y);
      }
    };

    this.boundPointerUp = (pointer: Phaser.Input.Pointer) => {
      if (this.currentPointer && this.currentPointer.id === pointer.id) {
        this.currentPointer = null;
        this.direction.x = 0;
        this.direction.y = 0;
        this.direction.force = 0;
        this.direction.isDown = false;

        this.scene.tweens.add({
          targets: this.thumb,
          x: 0,
          y: 0,
          duration: 100,
          ease: 'Sine.easeOut',
        });
      }
    };

    this.createGraphics();
    this.setupEvents();
  }

  private createGraphics(): void {
    this.container = this.scene.add.container(this.baseX, this.baseY);
    this.container.setDepth(150);

    // Outer glow / ring
    this.outerRing = this.scene.add.circle(0, 0, this.radius + 6, 0x00aaff, 0.15);
    this.outerRing.setStrokeStyle(2, 0x00aaff, 0.5);

    // Joystick Base
    this.base = this.scene.add.circle(0, 0, this.radius, 0x102035, 0.65);
    this.base.setStrokeStyle(3, 0x00ff88, 0.8);

    // Center dot guide
    const centerDot = this.scene.add.circle(0, 0, 4, 0x00aaff, 0.5);

    // Joystick Thumb (Knob)
    this.thumb = this.scene.add.circle(0, 0, this.radius * 0.42, 0x00ff88, 0.85);
    this.thumb.setStrokeStyle(3, 0xffffff, 0.95);

    this.container.add([this.outerRing, this.base, centerDot, this.thumb]);
  }

  private setupEvents(): void {
    const hitArea = new Phaser.Geom.Circle(0, 0, this.radius * 1.5);
    this.base.setInteractive(hitArea, Phaser.Geom.Circle.Contains);

    this.scene.input.on('pointerdown', this.boundPointerDown);
    this.scene.input.on('pointermove', this.boundPointerMove);
    this.scene.input.on('pointerup', this.boundPointerUp);
    this.scene.input.on('pointerupoutside', this.boundPointerUp);
  }

  private updateThumb(pointerX: number, pointerY: number): void {
    const dx = pointerX - this.baseX;
    const dy = pointerY - this.baseY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    const clampedDist = Math.min(dist, this.radius);
    const thumbX = Math.cos(angle) * clampedDist;
    const thumbY = Math.sin(angle) * clampedDist;

    this.thumb.x = thumbX;
    this.thumb.y = thumbY;

    this.direction.force = clampedDist / this.radius;
    this.direction.angle = angle;
    this.direction.x = Math.cos(angle) * this.direction.force;
    this.direction.y = Math.sin(angle) * this.direction.force;
    this.direction.isDown = this.direction.force > 0.15;
  }

  public getValue(): { x: number; y: number } {
    return { x: this.direction.x, y: this.direction.y };
  }

  public getForce(): { x: number; y: number } {
    return { x: this.direction.x, y: this.direction.y };
  }

  public setVisible(visible: boolean): void {
    this.container.setVisible(visible);
  }

  public destroy(): void {
    this.scene.input.off('pointerdown', this.boundPointerDown);
    this.scene.input.off('pointermove', this.boundPointerMove);
    this.scene.input.off('pointerup', this.boundPointerUp);
    this.scene.input.off('pointerupoutside', this.boundPointerUp);
    this.container.destroy();
  }
}
