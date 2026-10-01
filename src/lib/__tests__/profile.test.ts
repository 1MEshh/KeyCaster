import test from "node:test";
import assert from "node:assert/strict";
import { calculateLevel, getRankFromWpm } from "../../store/useProfileStore";

test("Profile: Level 1 begins at 0 XP", () => {
  assert.equal(calculateLevel(0), 1);
  assert.equal(calculateLevel(100), 1);
});

test("Profile: Level 2 reached at 150 XP", () => {
  assert.equal(calculateLevel(150), 2);
  assert.equal(calculateLevel(250), 2);
});

test("Profile: Higher levels scale linearly", () => {
  // L1: 150, L2: 300, total = 450
  assert.equal(calculateLevel(450), 3);
});

test("Profile: Ranks scale with WPM correctly", () => {
  assert.equal(getRankFromWpm(25), "Novice");
  assert.equal(getRankFromWpm(45), "Apprentice");
  assert.equal(getRankFromWpm(65), "Adept");
  assert.equal(getRankFromWpm(85), "Expert");
  assert.equal(getRankFromWpm(105), "Master");
  assert.equal(getRankFromWpm(130), "Grandmaster");
});
