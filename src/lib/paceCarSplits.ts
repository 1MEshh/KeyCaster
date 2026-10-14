/**
 * KeyCaster Speedrun Ghost & Pace Car Split Delta Engine
 * Calculates real-time time splits (+/- seconds) comparing live execution against PB / target pace.
 */

export interface PaceSplitResult {
  timeDeltaSec: number;
  formattedDelta: string;
  isAhead: boolean;
  expectedSec: number;
  charPacePerSec: number;
}

/**
 * Calculates live speedrun split delta comparing elapsed seconds against target pace WPM.
 * Negative delta = user is ahead of target pace (faster than ghost / PB).
 * Positive delta = user is behind target pace (slower than ghost / PB).
 */
export function calculatePaceSplitDelta(
  elapsedSec: number,
  charsTyped: number,
  targetWpm: number
): PaceSplitResult {
  if (targetWpm <= 0 || charsTyped <= 0 || elapsedSec <= 0) {
    return {
      timeDeltaSec: 0,
      formattedDelta: "0.0s",
      isAhead: true,
      expectedSec: 0,
      charPacePerSec: 0,
    };
  }

  const charPacePerSec = (targetWpm * 5) / 60;
  const expectedSec = charsTyped / charPacePerSec;
  const timeDeltaSec = elapsedSec - expectedSec;
  const isAhead = timeDeltaSec <= 0.05; // 50ms tolerance for dead-even split

  const absDelta = Math.abs(timeDeltaSec);
  const formattedDelta = `${timeDeltaSec <= 0 ? "-" : "+"}${absDelta.toFixed(1)}s`;

  return {
    timeDeltaSec,
    formattedDelta,
    isAhead,
    expectedSec,
    charPacePerSec,
  };
}

export interface SentenceCharCoord {
  wordIndex: number;
  letterIndex: number;
}

/**
 * Maps a flat character offset across a multi-word sentence to the corresponding (wordIndex, letterIndex).
 */
export function findCharPositionInSentence(
  words: { letters: { char: string }[] }[],
  charOffset: number
): SentenceCharCoord | null {
  if (!words.length || charOffset < 0) return null;

  let currentOffset = 0;
  for (let w = 0; w < words.length; w++) {
    const letters = words[w].letters;
    if (charOffset < currentOffset + letters.length) {
      return {
        wordIndex: w,
        letterIndex: charOffset - currentOffset,
      };
    }
    currentOffset += letters.length;

    // Account for word separator space
    if (w < words.length - 1) {
      if (charOffset === currentOffset) {
        return {
          wordIndex: w,
          letterIndex: Math.max(0, letters.length - 1),
        };
      }
      currentOffset += 1;
    }
  }

  const lastWordIdx = words.length - 1;
  const lastLetterIdx = Math.max(0, words[lastWordIdx].letters.length - 1);
  return {
    wordIndex: lastWordIdx,
    letterIndex: lastLetterIdx,
  };
}

