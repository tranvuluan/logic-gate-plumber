import { TOUCH } from './Constants';

export interface TouchEvent {
  type: 'tap' | 'longpress' | 'swipe' | 'pinch';
  x: number;
  y: number;
  deltaX?: number;
  deltaY?: number;
  scale?: number;
}

export class TouchControls {
  private scene: Phaser.Scene;
  private longPressTimer: Phaser.Time.TimerEvent | null = null;
  private startX: number = 0;
  private startY: number = 0;
  private isLongPress: boolean = false;
  private onTap: ((x: number, y: number) => void) | null = null;
  private onLongPress: ((x: number, y: number) => void) | null = null;
  private onDrag: ((dx: number, dy: number) => void) | null = null;
  private isDragging: boolean = false;

  private boundPointerDown: (pointer: Phaser.Input.Pointer) => void;
  private boundPointerMove: (pointer: Phaser.Input.Pointer) => void;
  private boundPointerUp: (pointer: Phaser.Input.Pointer) => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.boundPointerDown = (pointer: Phaser.Input.Pointer) => {
      // Don't trigger board events in bottom control area or top header
      if (pointer.y > 1020 || pointer.y < 120) {
        return;
      }

      this.startX = pointer.x;
      this.startY = pointer.y;
      this.isLongPress = false;
      this.isDragging = false;

      // Start long press timer
      this.longPressTimer = this.scene.time.delayedCall(
        TOUCH.LONG_PRESS_MS,
        () => {
          this.isLongPress = true;
          if (this.onLongPress) {
            this.onLongPress(pointer.x, pointer.y);
          }
        }
      );
    };

    this.boundPointerMove = (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown) return;

      const dx = pointer.x - this.startX;
      const dy = pointer.y - this.startY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > TOUCH.TAP_THRESHOLD_PX) {
        // Cancel long press if moved too far
        if (this.longPressTimer) {
          this.longPressTimer.destroy();
          this.longPressTimer = null;
        }
        this.isDragging = true;

        if (this.onDrag) {
          this.onDrag(pointer.x - pointer.prevPosition.x, pointer.y - pointer.prevPosition.y);
        }
      }
    };

    this.boundPointerUp = (pointer: Phaser.Input.Pointer) => {
      // Cancel long press timer
      if (this.longPressTimer) {
        this.longPressTimer.destroy();
        this.longPressTimer = null;
      }

      if (!this.isLongPress && !this.isDragging) {
        // It's a tap
        if (this.onTap) {
          this.onTap(pointer.x, pointer.y);
        }
      }

      this.isDragging = false;
      this.isLongPress = false;
    };

    this.setupListeners();
  }

  setTapHandler(handler: (x: number, y: number) => void): void {
    this.onTap = handler;
  }

  setLongPressHandler(handler: (x: number, y: number) => void): void {
    this.onLongPress = handler;
  }

  setDragHandler(handler: (dx: number, dy: number) => void): void {
    this.onDrag = handler;
  }

  private setupListeners(): void {
    this.scene.input.on('pointerdown', this.boundPointerDown);
    this.scene.input.on('pointermove', this.boundPointerMove);
    this.scene.input.on('pointerup', this.boundPointerUp);
  }

  destroy(): void {
    if (this.longPressTimer) {
      this.longPressTimer.destroy();
      this.longPressTimer = null;
    }
    // CRITICAL FIX: Only remove bound handlers, NEVER remove all listeners!
    this.scene.input.off('pointerdown', this.boundPointerDown);
    this.scene.input.off('pointermove', this.boundPointerMove);
    this.scene.input.off('pointerup', this.boundPointerUp);
  }
}
