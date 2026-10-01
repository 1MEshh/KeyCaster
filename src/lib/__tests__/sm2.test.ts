import test from "node:test";
import assert from "node:assert/strict";
import { calculateSM2 } from "../sm2";

test("SM-2: Grade 5 on first attempt (repetitions = 0)", () => {
  const result = calculateSM2(5, 2.5, 0, 0);
  assert.equal(result.repetitions, 1);
  assert.equal(result.interval, 1);
  assert.equal(result.easeFactor, 2.6);
});

test("SM-2: Grade 5 on second attempt (repetitions = 1)", () => {
  const result = calculateSM2(5, 2.6, 1, 1);
  assert.equal(result.repetitions, 2);
  assert.equal(result.interval, 6);
  assert.equal(result.easeFactor, 2.7);
});

test("SM-2: Grade 5 on third attempt (repetitions = 2, interval = 6)", () => {
  const result = calculateSM2(5, 2.7, 6, 2);
  assert.equal(result.repetitions, 3);
  assert.equal(result.interval, 16); // Math.round(6 * 2.7) = 16
  assert.equal(result.easeFactor, 2.8);
});

test("SM-2: Grade < 3 fails and resets repetitions to 0 and interval to 1", () => {
  const result = calculateSM2(2, 2.5, 16, 3);
  assert.equal(result.repetitions, 0);
  assert.equal(result.interval, 1);
  assert.equal(result.easeFactor, 2.5); // Ease factor preserved on fail
});

test("SM-2: Minimum boundary of ease factor is clamped to 1.3", () => {
  let ef = 1.4;
  for (let i = 0; i < 5; i++) {
    const res = calculateSM2(3, ef, 1, 1);
    ef = res.easeFactor;
  }
  assert.ok(ef >= 1.3, `Ease factor should be >= 1.3, got ${ef}`);
});
