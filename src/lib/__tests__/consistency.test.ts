import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateConsistency,
  calculateRawAndNetWpm,
  gradeWord,
} from "../grader";
import { gradeSentence } from "../sentenceGrader";

test("calculateConsistency: identical intervals produce 100% consistency", () => {
  const result = calculateConsistency([200, 200, 200, 200]);
  assert.equal(result, 100);
});

test("calculateConsistency: minimal variance produces near-perfect consistency", () => {
  const result = calculateConsistency([195, 205, 198, 202, 200]);
  assert.ok(result >= 95, `Expected >= 95%, got ${result}%`);
});

test("calculateConsistency: high variance intervals produce low consistency", () => {
  const result = calculateConsistency([50, 700, 60, 850, 70]);
  assert.ok(result < 60, `Expected < 60%, got ${result}%`);
});

test("calculateConsistency: handles boundary cases gracefully", () => {
  assert.equal(calculateConsistency([]), 100);
  assert.equal(calculateConsistency([150]), 100);
  assert.equal(calculateConsistency([-10, 0]), 100);
  assert.equal(calculateConsistency([100, 100]), 100);
});

test("calculateRawAndNetWpm: accurately computes raw vs net WPM", () => {
  // 100 total keystrokes and 80 correct characters over 12000ms (0.2 min)
  // Raw: (100 / 5) / 0.2 = 100
  // Net: (80 / 5) / 0.2 = 80
  const result = calculateRawAndNetWpm(100, 80, 12000);
  assert.equal(result.rawWpm, 100);
  assert.equal(result.netWpm, 80);

  // Zero elapsed time edge case
  const zero = calculateRawAndNetWpm(50, 50, 0);
  assert.equal(zero.rawWpm, 0);
  assert.equal(zero.netWpm, 0);
});

test("gradeWord: includes consistency and rawWpm in diagnostic output", () => {
  const res = gradeWord({
    word: "metronome",
    errors: 0,
    backspaces: 0,
    elapsedMs: 1800,
    wasRetry: false,
    keystrokeIntervals: [200, 200, 200, 200, 200, 200, 200, 200],
    totalKeystrokes: 9,
  });

  assert.equal(res.grade, 5);
  assert.equal(res.consistency, 100);
  assert.ok(res.rawWpm !== undefined && res.rawWpm > 0);
});

test("gradeSentence: includes consistency and rawWpm in diagnostic output", () => {
  const res = gradeSentence({
    charCount: 25,
    correctChars: 25,
    totalKeystrokes: 25,
    errors: 0,
    backspaces: 0,
    elapsedMs: 5000,
    keystrokeIntervals: [200, 210, 195, 205, 200],
  });

  assert.equal(res.grade, 5);
  assert.ok(res.consistency !== undefined && res.consistency >= 90);
  assert.ok(res.rawWpm !== undefined && res.rawWpm > 0);
});
