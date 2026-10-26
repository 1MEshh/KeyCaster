export interface GradingInput {
  word: string;
  errors: number;
  backspaces: number;
  elapsedMs: number;
  wasRetry: boolean;
  keystrokeIntervals?: number[];
  totalKeystrokes?: number;
}

export interface GradingResult {
  grade: number; // 0 to 5
  label: string;
  avgMsPerChar: number;
  wpm: number;
  accuracy: number;
  consistency?: number;
  rawWpm?: number;
}

// In-memory memoization cache for consistency scores across identical interval sequences
const consistencyCache = new Map<string, number>();
const MAX_CONSISTENCY_CACHE = 128;

/**
 * Calculates typing rhythm consistency percentage from an array of keystroke delta intervals (in milliseconds).
 * Formula: Math.max(0, Math.min(100, Math.round(100 - (stdDev / meanDelta) * 100)))
 * If fewer than 2 intervals are present or mean <= 0, returns 100%.
 */
export function calculateConsistency(intervals: number[]): number {
  if (!intervals || !Array.isArray(intervals) || intervals.length < 2) return 100;

  // Single-pass computation for sum and count of valid positive finite intervals
  let count = 0;
  let sum = 0;

  for (let i = 0; i < intervals.length; i++) {
    const val = intervals[i];
    if (typeof val === "number" && Number.isFinite(val) && val > 0) {
      count++;
      sum += val;
    }
  }

  if (count < 2) return 100;

  const meanDelta = sum / count;
  if (meanDelta <= 0) return 100;

  // Cache lookup for frequent interval arrays
  const cacheKey = intervals.length <= 16 ? intervals.join(",") : "";
  if (cacheKey && consistencyCache.has(cacheKey)) {
    return consistencyCache.get(cacheKey)!;
  }

  // Second pass: variance computation without intermediate array allocation
  let varianceSum = 0;
  for (let i = 0; i < intervals.length; i++) {
    const val = intervals[i];
    if (typeof val === "number" && Number.isFinite(val) && val > 0) {
      const diff = val - meanDelta;
      varianceSum += diff * diff;
    }
  }

  const variance = varianceSum / count;
  const stdDev = Math.sqrt(variance);
  const consistency = Math.max(0, Math.min(100, Math.round(100 - (stdDev / meanDelta) * 100)));

  if (cacheKey) {
    if (consistencyCache.size >= MAX_CONSISTENCY_CACHE) {
      consistencyCache.clear();
    }
    consistencyCache.set(cacheKey, consistency);
  }

  return consistency;
}

/**
 * Calculates raw WPM (all keystrokes / 5 / elapsed minutes) vs net WPM (correct chars / 5 / elapsed minutes).
 * Features defensive guards for negative times, non-finite values, and zero elapsed time.
 */
export function calculateRawAndNetWpm(
  totalKeystrokes: number,
  correctChars: number,
  elapsedMs: number
): { rawWpm: number; netWpm: number } {
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) return { rawWpm: 0, netWpm: 0 };

  const safeKeystrokes = Math.max(0, Number.isFinite(totalKeystrokes) ? totalKeystrokes : 0);
  const safeCorrect = Math.max(0, Number.isFinite(correctChars) ? correctChars : 0);

  const minutes = Math.max(0.001, elapsedMs / 60000);
  const rawWpm = Math.round((safeKeystrokes / 5) / minutes);
  const netWpm = Math.max(0, Math.round((safeCorrect / 5) / minutes));
  return { rawWpm, netWpm };
}

/**
 * Grades user performance for SM-2 input
 * Grade 5: Perfect, fast typing (<= 300ms/char, 0 errors, 0 backspaces)
 * Grade 4: Correct, steady typing (<= 500ms/char, 0 errors, <= 1 backspace)
 * Grade 3: Correct, but user hesitated or made minor mistakes (<= 2 errors, <= 3 backspaces)
 * Grade 2: 3-4 errors
 * Grade 1: Failed / multiple red error triggers (> 4 errors or skipped)
 * Grade 0: Skipped / gave up
 */
export function gradeWord(input: GradingInput): GradingResult {
  const { word, errors, backspaces, elapsedMs, wasRetry, keystrokeIntervals } = input;
  const wordLen = Math.max(1, word.length);
  const avgMsPerChar = Math.round(elapsedMs / wordLen);

  // Keystrokes & WPM calculation
  const totalKeystrokes = input.totalKeystrokes ?? (wordLen + errors + backspaces);
  const { rawWpm, netWpm } = calculateRawAndNetWpm(totalKeystrokes, wordLen, elapsedMs);

  // Accuracy calculation
  const accuracy = Math.round((wordLen / Math.max(wordLen, totalKeystrokes)) * 100);

  // Consistency calculation from interval variance
  const consistency =
    keystrokeIntervals && keystrokeIntervals.length >= 2
      ? calculateConsistency(keystrokeIntervals)
      : 100;

  let rawGrade = 1;

  if (errors === 0 && backspaces === 0 && avgMsPerChar <= 320) {
    rawGrade = 5;
  } else if (errors === 0 && backspaces <= 1 && avgMsPerChar <= 550) {
    rawGrade = 4;
  } else if (errors <= 2 && backspaces <= 3) {
    rawGrade = 3;
  } else if (errors <= 4) {
    rawGrade = 2;
  } else {
    rawGrade = 1;
  }

  // If word was already failed in this session and retried, cap maximum SM-2 grade at 3
  const finalGrade = wasRetry ? Math.min(3, Math.max(1, rawGrade)) : rawGrade;

  let label = "Needs Practice";
  if (finalGrade === 5) label = "⚡ Flawless";
  else if (finalGrade === 4) label = "Great Pace";
  else if (finalGrade === 3) label = "Passed";
  else if (finalGrade === 2) label = "Hard Word";

  return {
    grade: finalGrade,
    label,
    avgMsPerChar,
    wpm: netWpm,
    accuracy,
    consistency,
    rawWpm,
  };
}
