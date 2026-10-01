export interface SM2Result {
  repetitions: number;
  interval: number;
  easeFactor: number;
}

/**
 * SuperMemo-2 (SM-2) Spaced Repetition Algorithm with adaptive difficulty tuning
 * @param grade Performance rating from 0 to 5
 * @param easeFactor Previous ease factor (default: 2.5, min: 1.3)
 * @param interval Previous review interval in days
 * @param repetitions Number of consecutive successful reviews
 * @param totalMistakes Lifetime errors on this word (adaptive penalty)
 */
export function calculateSM2(
  grade: number,
  easeFactor: number,
  interval: number,
  repetitions: number,
  totalMistakes = 0
): SM2Result {
  if (grade < 3) {
    // Failed: Reset repetitions, review again tomorrow
    // Words with high lifetime mistakes get an easeFactor penalty to surface sooner
    const penalty = totalMistakes >= 3 ? 0.2 : 0;
    const adjustedEase = Math.max(1.3, easeFactor - penalty);
    return { repetitions: 0, interval: 1, easeFactor: Number(adjustedEase.toFixed(3)) };
  }

  const nextRepetitions = repetitions + 1;
  let nextInterval = 1;

  if (repetitions === 0) nextInterval = 1;
  else if (repetitions === 1) nextInterval = totalMistakes >= 3 ? 4 : 6;
  else {
    // Difficulty modifier: words with persistent errors get a tighter review window
    const mistakeMultiplier = totalMistakes >= 5 ? 0.8 : totalMistakes >= 3 ? 0.9 : 1.0;
    nextInterval = Math.max(1, Math.round(interval * easeFactor * mistakeMultiplier));
  }

  // SM-2 Ease Factor formula
  let nextEaseFactor = easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  if (nextEaseFactor < 1.3) nextEaseFactor = 1.3; // Minimum boundary

  return {
    repetitions: nextRepetitions,
    interval: nextInterval,
    easeFactor: Number(nextEaseFactor.toFixed(3)),
  };
}

/**
 * Calculate the next review ISO date string (YYYY-MM-DD)
 */
export function getNextReviewDateString(daysFromNow: number): string {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysFromNow);
  return targetDate.toISOString().split("T")[0];
}

/**
 * Check if a word's nextReviewDate is due today or in the past
 */
export function isDue(nextReviewDate?: string | null): boolean {
  if (!nextReviewDate) return true;
  const today = new Date().toISOString().split("T")[0];
  return nextReviewDate <= today;
}
