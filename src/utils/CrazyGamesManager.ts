/**
 * CrazyGamesManager - Safe integration wrapper for CrazyGames SDK v3
 * Handles lifecycle events (loading, gameplayStart, gameplayStop, happytime),
 * localization detection, and ad callbacks safely across all platforms.
 */

declare global {
  interface Window {
    CrazyGames?: {
      SDK: {
        init: () => Promise<void>;
        game: {
          loadingStart: () => void;
          loadingStop: () => void;
          gameplayStart: () => void;
          gameplayStop: () => void;
          happytime: () => void;
        };
        user?: {
          getSystemInfo?: () => Promise<{ countryCode?: string; browser?: string; os?: string }>;
        };
        ad?: {
          requestAd: (type: 'midgame' | 'rewarded', callbacks?: {
            adStarted?: () => void;
            adFinished?: () => void;
            adError?: (error: any) => void;
          }) => void;
        };
      };
    };
  }
}

class CrazyGamesManager {
  private isInitialized: boolean = false;
  private isGameplayActive: boolean = false;
  private isAvailable: boolean = false;

  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      if (typeof window !== 'undefined' && window.CrazyGames?.SDK) {
        await window.CrazyGames.SDK.init();
        this.isAvailable = true;
        console.log('⚡ CrazyGames SDK v3 initialized successfully');
      } else {
        console.log('ℹ️ CrazyGames SDK not detected (running standalone/local)');
      }
    } catch (e) {
      console.warn('⚠️ CrazyGames SDK init notice:', e);
    } finally {
      this.isInitialized = true;
    }
  }

  loadingStart(): void {
    try {
      if (this.isAvailable && window.CrazyGames?.SDK?.game?.loadingStart) {
        window.CrazyGames.SDK.game.loadingStart();
      }
    } catch (e) {
      console.warn('loadingStart notice:', e);
    }
  }

  loadingStop(): void {
    try {
      if (this.isAvailable && window.CrazyGames?.SDK?.game?.loadingStop) {
        window.CrazyGames.SDK.game.loadingStop();
      }
    } catch (e) {
      console.warn('loadingStop notice:', e);
    }
  }

  gameplayStart(): void {
    if (this.isGameplayActive) return;
    this.isGameplayActive = true;
    try {
      if (this.isAvailable && window.CrazyGames?.SDK?.game?.gameplayStart) {
        window.CrazyGames.SDK.game.gameplayStart();
      }
    } catch (e) {
      console.warn('gameplayStart notice:', e);
    }
  }

  gameplayStop(): void {
    if (!this.isGameplayActive) return;
    this.isGameplayActive = false;
    try {
      if (this.isAvailable && window.CrazyGames?.SDK?.game?.gameplayStop) {
        window.CrazyGames.SDK.game.gameplayStop();
      }
    } catch (e) {
      console.warn('gameplayStop notice:', e);
    }
  }

  happytime(): void {
    try {
      if (this.isAvailable && window.CrazyGames?.SDK?.game?.happytime) {
        window.CrazyGames.SDK.game.happytime();
      }
    } catch (e) {
      console.warn('happytime notice:', e);
    }
  }
}

export const crazyGames = new CrazyGamesManager();
