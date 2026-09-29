export interface GradingInput {
  word: string;
  errors: number;
  backspaces: number;
  elapsedMs: number;
  wasRetry: boolean;
}

export interface GradingResult {
  grade: number; // 0 to 5
  label: string;
  avgMsPerChar: number;
  wpm: number;
  accuracy: number;
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
  const { word, errors, backspaces, elapsedMs, wasRetry } = input;
  const wordLen = Math.max(1, word.length);
  const avgMsPerChar = Math.round(elapsedMs / wordLen);

  // WPM calculation: (chars / 5) / (minutes)
  const minutes = Math.max(0.001, elapsedMs / 60000);
  const wpm = Math.round((wordLen / 5) / minutes);

  // Accuracy calculation
  const totalKeystrokes = wordLen + errors + backspaces;
  const accuracy = Math.round((wordLen / Math.max(wordLen, totalKeystrokes)) * 100);

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
    wpm,
    accuracy,
  };
}
