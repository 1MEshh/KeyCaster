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
