import { calculateConsistency, calculateRawAndNetWpm } from "./grader";

export { calculateConsistency, calculateRawAndNetWpm };

export interface SentenceGradingInput {
  charCount: number;
  correctChars: number;
  totalKeystrokes: number;
  errors: number;
  backspaces?: number;
  elapsedMs: number;
  wasRetry?: boolean;
  wasSkipped?: boolean;
  keystrokeIntervals?: number[];
}

export interface SentenceGradingResult {
  grade: number; // 0 to 5
  label: string;
  wpm: number;
  accuracy: number;
  avgMsPerChar: number;
  consistency?: number;
  rawWpm?: number;
}

/**
 * Calculates Sentence Words Per Minute (standard 5 characters per word):
 * Math.round((charCount / 5) / (elapsedMs / 60000))
 */
export function calculateSentenceWpm(charCount: number, elapsedMs: number): number {
  if (elapsedMs <= 0 || charCount <= 0) return 0;
  const minutes = Math.max(0.001, elapsedMs / 60000);
  return Math.round((charCount / 5) / minutes);
}

/**
 * Calculates Sentence Accuracy percentage:
 * Math.round((correctChars / Math.max(1, totalKeystrokes)) * 100)
 */
export function calculateSentenceAccuracy(correctChars: number, totalKeystrokes: number): number {
  if (totalKeystrokes <= 0) return 100;
  if (correctChars <= 0) return 0;
  const raw = Math.round((correctChars / Math.max(1, totalKeystrokes)) * 100);
  return Math.min(100, Math.max(0, raw));
}

/**
 * Grades user performance on a sentence for SM-2 repetition:
 * Grade 5: Flawless (0 errors, 0-1 backspaces, >= 98% accuracy, <= 380ms/char)
 * Grade 4: Solid pace & accuracy (<= 1 error, <= 3 backspaces, >= 92% accuracy, <= 600ms/char)
 * Grade 3: Passed with hesitation/minor mistakes (<= 3 errors, >= 80% accuracy)
 * Grade 2: Hard / struggled (<= 6 errors, >= 65% accuracy)
 * Grade 1: Multiple errors / failed (> 6 errors or < 65% accuracy)
 * Grade 0: Skipped
 */
export function gradeSentence(input: SentenceGradingInput): SentenceGradingResult {
  const {
    charCount,
    correctChars,
    totalKeystrokes,
    errors,
    backspaces = 0,
    elapsedMs,
    wasRetry = false,
    wasSkipped = false,
  } = input;

  const validCharCount = Math.max(1, charCount);
  const avgMsPerChar = Math.round(Math.max(0, elapsedMs) / validCharCount);
  const wpm = calculateSentenceWpm(charCount, elapsedMs);
  const accuracy = calculateSentenceAccuracy(correctChars, totalKeystrokes);
  const { rawWpm } = calculateRawAndNetWpm(totalKeystrokes, correctChars, elapsedMs);
  const consistency =
    input.keystrokeIntervals && input.keystrokeIntervals.length >= 2
      ? calculateConsistency(input.keystrokeIntervals)
      : 100;

  if (wasSkipped) {
    return {
      grade: 0,
      label: "Skipped",
      wpm,
      accuracy,
      avgMsPerChar,
      consistency,
      rawWpm,
    };
  }

  let rawGrade: number;

  if (errors === 0 && backspaces <= 1 && accuracy >= 98 && avgMsPerChar <= 380) {
    rawGrade = 5;
  } else if (errors <= 1 && backspaces <= 3 && accuracy >= 92 && avgMsPerChar <= 600) {
    rawGrade = 4;
  } else if (errors <= 3 && accuracy >= 80) {
    rawGrade = 3;
  } else if (errors <= 6 && accuracy >= 65) {
    rawGrade = 2;
  } else {
    rawGrade = 1;
  }

  // Cap retry sentences at Grade 3
  const finalGrade = wasRetry ? Math.min(3, Math.max(1, rawGrade)) : rawGrade;

  let label = "Needs Practice";
  if (finalGrade === 5) label = "⚡ Flawless";
  else if (finalGrade === 4) label = "Great Pace";
  else if (finalGrade === 3) label = "Passed";
  else if (finalGrade === 2) label = "Hard Sentence";
  else if (finalGrade === 1) label = "Try Again";

  return {
    grade: finalGrade,
    label,
    wpm,
    accuracy,
    avgMsPerChar,
    consistency,
    rawWpm,
  };
}

/**
 * Calculates XP earned for a sentence based on length, difficulty, and accuracy.
 */
export function calculateSentenceXP(options: {
  charCount: number;
  difficulty?: "beginner" | "intermediate" | "advanced" | string;
  accuracy: number;
  errors?: number;
}): number {
  const { charCount, difficulty = "beginner", accuracy, errors = 0 } = options;
  const wordCount = Math.max(1, Math.round(charCount / 5));

  // Multipliers based on difficulty
  let diffMultiplier = 1.0;
  if (difficulty === "intermediate") diffMultiplier = 1.5;
  else if (difficulty === "advanced") diffMultiplier = 2.0;

  // Base XP: 10 XP per word
  const baseXP = wordCount * 10;

  // Accuracy bonus
  let accMultiplier = 1.0;
  if (accuracy >= 98) accMultiplier = 1.3;
  else if (accuracy >= 92) accMultiplier = 1.15;
  else if (accuracy < 80) accMultiplier = 0.7;

  // Error penalty
  const errorPenalty = Math.min(baseXP * 0.4, errors * 2);

  const finalXP = Math.round(baseXP * diffMultiplier * accMultiplier - errorPenalty);
  return Math.max(10, finalXP);
}
