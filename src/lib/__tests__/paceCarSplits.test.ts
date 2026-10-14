import test from "node:test";
import assert from "node:assert/strict";
import { calculatePaceSplitDelta, findCharPositionInSentence } from "../paceCarSplits";

test("paceCarSplits: calculates ahead delta correctly when typist is faster than target", () => {
  // Target 60 WPM = 300 CPM = 5 chars/sec.
  // For 10 chars, expected is 2.0s.
  // If typist typed in 1.2s, they are 0.8s ahead (-0.8s).
  const result = calculatePaceSplitDelta(1.2, 10, 60);
  assert.equal(result.isAhead, true);
  assert.equal(result.formattedDelta, "-0.8s");
  assert.ok(result.timeDeltaSec < 0);
});

test("paceCarSplits: calculates behind delta correctly when typist is slower than target", () => {
  // Target 60 WPM = 5 chars/sec.
  // For 10 chars, expected is 2.0s.
  // If typist typed in 3.4s, they are 1.4s behind (+1.4s).
  const result = calculatePaceSplitDelta(3.4, 10, 60);
  assert.equal(result.isAhead, false);
  assert.equal(result.formattedDelta, "+1.4s");
  assert.ok(result.timeDeltaSec > 0);
});

test("paceCarSplits: handles boundary and zero inputs gracefully without NaN", () => {
  const zeroTarget = calculatePaceSplitDelta(2.0, 10, 0);
  assert.equal(zeroTarget.timeDeltaSec, 0);
  assert.equal(zeroTarget.formattedDelta, "0.0s");

  const zeroChars = calculatePaceSplitDelta(2.0, 0, 60);
  assert.equal(zeroChars.timeDeltaSec, 0);
  assert.equal(zeroChars.formattedDelta, "0.0s");

  const zeroElapsed = calculatePaceSplitDelta(0, 10, 60);
  assert.equal(zeroElapsed.timeDeltaSec, 0);
  assert.equal(zeroElapsed.formattedDelta, "0.0s");
});

test("paceCarSplits: findCharPositionInSentence maps multi-word offsets accurately", () => {
  const words = [
    { letters: [{ char: "h" }, { char: "e" }, { char: "l" }, { char: "l" }, { char: "o" }] },
    { letters: [{ char: "w" }, { char: "o" }, { char: "r" }, { char: "l" }, { char: "d" }] },
  ];

  // Offset 0 -> word 0, letter 0 ('h')
  assert.deepStrictEqual(findCharPositionInSentence(words, 0), { wordIndex: 0, letterIndex: 0 });

  // Offset 4 -> word 0, letter 4 ('o')
  assert.deepStrictEqual(findCharPositionInSentence(words, 4), { wordIndex: 0, letterIndex: 4 });

  // Offset 5 -> space boundary -> maps to word 0, letter 4 ('o')
  assert.deepStrictEqual(findCharPositionInSentence(words, 5), { wordIndex: 0, letterIndex: 4 });

  // Offset 6 -> word 1, letter 0 ('w')
  assert.deepStrictEqual(findCharPositionInSentence(words, 6), { wordIndex: 1, letterIndex: 0 });

  // Out of bounds -> clamps to last letter
  assert.deepStrictEqual(findCharPositionInSentence(words, 999), { wordIndex: 1, letterIndex: 4 });

  // Empty words or negative -> null
  assert.strictEqual(findCharPositionInSentence([], 0), null);
  assert.strictEqual(findCharPositionInSentence(words, -1), null);
});

