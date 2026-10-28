import Phaser from 'phaser';
import {
  LANDSCAPE_WIDTH,
  LANDSCAPE_HEIGHT,
  PORTRAIT_WIDTH,
  PORTRAIT_HEIGHT,
  COLORS,
  FONTS,
} from './Constants';
import { audio } from './AudioManager';

export class OrientationManager {
  /**
   * Check if current game scale or window is in portrait orientation.
   * Purely automatic: phone/vertical -> portrait, PC/horizontal -> landscape.
   */
  public static isPortrait(scene?: Phaser.Scene): boolean {
    if (scene && scene.scale) {
      return scene.scale.height > scene.scale.width;
    }
    if (typeof window !== 'undefined') {
      return window.innerHeight > window.innerWidth;
    }
    return false;
  }

  /**
   * Get current width and height based on orientation.
   */
  public static getCurrentDimensions(scene?: Phaser.Scene): {
    width: number;
    height: number;
    isPortrait: boolean;
  } {
    const portrait = this.isPortrait(scene);
    return {
      width: portrait ? PORTRAIT_WIDTH : LANDSCAPE_WIDTH,
      height: portrait ? PORTRAIT_HEIGHT : LANDSCAPE_HEIGHT,
      isPortrait: portrait,
    };
  }

  /**
   * Handle browser window resize or physical screen orientation changes automatically.
   */
  public static handleWindowResize(game: Phaser.Game): void {
    if (typeof window === 'undefined') return;

    const windowIsPortrait = window.innerHeight > window.innerWidth;
    const currentIsPortrait = game.scale.height > game.scale.width;

    if (windowIsPortrait !== currentIsPortrait) {
      const targetW = windowIsPortrait ? PORTRAIT_WIDTH : LANDSCAPE_WIDTH;
      const targetH = windowIsPortrait ? PORTRAIT_HEIGHT : LANDSCAPE_HEIGHT;

      game.scale.resize(targetW, targetH);
      game.scale.refresh();

      // Notify the active scene to re-layout
      this.refreshActiveScene(game);
    } else {
      game.scale.refresh();
    }
  }

  /**
   * Re-render current scene with appropriate layout.
   */
  public static restartScene(scene: Phaser.Scene): void {
    scene.cameras.main.resetFX();

    const key = scene.scene.key;

    if (key === 'GameScene') {
      const gs = scene as any;
      scene.scene.restart({
        levelId: gs.levelId || 1,
        isEndless: gs.isEndless || false,
      });
    } else if (key === 'WinScene') {
      const ws = scene as any;
      scene.scene.restart({
        levelId: ws.levelId || 1,
        moves: ws.moves || 0,
        parMoves: ws.parMoves || 5,
        stars: ws.stars || 3,
        isEndless: ws.isEndless || false,
      });
    } else if (key === 'LevelSelectScene') {
      const ls = scene as any;
      scene.scene.restart({
        chapter: ls.currentChapter || 1,
      });
    } else {
      scene.scene.restart();
    }
  }

  /**
   * Refreshes the active running scene across the game instance.
   */
  private static refreshActiveScene(game: Phaser.Game): void {
    const scenes = game.scene.getScenes(true);
    for (const sc of scenes) {
      if (sc.scene.isActive()) {
        this.restartScene(sc);
        break;
      }
    }
  }
}
