/**
 * ProgressManager.ts
 * Manages player progression, level unlock status, and star ratings via localStorage.
 * Ensures strict sequential progression: players must solve levels from easiest to hardest.
 */

const STORAGE_UNLOCKED_KEY = 'lgp_unlocked_level';
const STORAGE_STARS_KEY = 'lgp_level_stars';
const STORAGE_ENDLESS_KEY = 'lgp_endless_streak';

export const MAX_LEVELS = 100;

export class ProgressManager {
  /**
   * Get the highest level the player has currently unlocked.
   * Defaults to 1 (only Level 1 is unlocked initially).
   */
  public static getUnlockedLevel(): number {
    try {
      const val = localStorage.getItem(STORAGE_UNLOCKED_KEY);
      if (val) {
        const num = parseInt(val, 10);
        if (!isNaN(num) && num >= 1 && num <= MAX_LEVELS) {
          return num;
        }
      }
    } catch (e) {
      console.warn('ProgressManager: Failed to read localStorage', e);
    }
    return 1; // Default: Only Level 1 is unlocked
  }

  /**
   * When a player completes a level, unlock the subsequent level.
   * Returns the new highest unlocked level.
   */
  public static unlockNextLevel(completedLevelId: number): number {
    const current = this.getUnlockedLevel();
    const nextLevel = completedLevelId + 1;
    const newUnlocked = Math.min(MAX_LEVELS, Math.max(current, nextLevel));

    try {
      localStorage.setItem(STORAGE_UNLOCKED_KEY, newUnlocked.toString());
      console.log(`✅ Level ${completedLevelId} completed! Level ${newUnlocked} unlocked.`);
    } catch (e) {
      console.warn('ProgressManager: Failed to save unlocked level to localStorage', e);
    }

    return newUnlocked;
  }

  /**
   * Save star rating for a completed level (1, 2, or 3 stars).
   */
  public static saveStars(levelId: number, stars: number): void {
    try {
      const allStars = this.getAllStars();
      allStars[levelId] = Math.max(allStars[levelId] || 0, stars);
      localStorage.setItem(STORAGE_STARS_KEY, JSON.stringify(allStars));
    } catch (e) {
      console.warn('ProgressManager: Failed to save stars to localStorage', e);
    }
  }

  /**
   * Get stars achieved on a specific level (0 if not played/completed).
   */
  public static getStars(levelId: number): number {
    const allStars = this.getAllStars();
    return allStars[levelId] || 0;
  }

  /**
   * Retrieve all recorded star ratings.
   */
  public static getAllStars(): Record<number, number> {
    try {
      const val = localStorage.getItem(STORAGE_STARS_KEY);
      if (val) {
        return JSON.parse(val);
      }
    } catch (e) {
      console.warn('ProgressManager: Failed to read stars', e);
    }
    return {};
  }

  /**
   * Get total stars earned across all levels.
   */
  public static getTotalStars(): number {
    const stars = this.getAllStars();
    return Object.values(stars).reduce((sum, s) => sum + s, 0);
  }

  /**
   * Endless mode streak / high score.
   */
  public static getEndlessStreak(): number {
    try {
      const val = localStorage.getItem(STORAGE_ENDLESS_KEY);
      if (val) {
        const num = parseInt(val, 10);
        return isNaN(num) ? 0 : num;
      }
    } catch (e) {
      console.warn(e);
    }
    return 0;
  }

  public static saveEndlessStreak(streak: number): void {
    try {
      const current = this.getEndlessStreak();
      if (streak > current) {
        localStorage.setItem(STORAGE_ENDLESS_KEY, streak.toString());
      }
    } catch (e) {
      console.warn(e);
    }
  }

  /**
   * Reset player progression (for testing or starting over from Level 1).
   */
  public static resetProgress(): void {
    try {
      localStorage.setItem(STORAGE_UNLOCKED_KEY, '1');
      localStorage.removeItem(STORAGE_STARS_KEY);
      console.log('🔄 Player progress has been reset to Level 1.');
    } catch (e) {
      console.warn('ProgressManager: Failed to reset progress', e);
    }
  }
}
