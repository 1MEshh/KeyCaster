import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateSentenceWpm,
  calculateSentenceAccuracy,
  gradeSentence,
  calculateSentenceXP,
} from "../sentenceGrader";

test("sentenceGrader: calculateSentenceWpm calculates accurate standard WPM", () => {
  // 50 chars in 30 seconds = (10 words) / 0.5 minutes = 20 WPM
  const wpm = calculateSentenceWpm(50, 30000);
  assert.equal(wpm, 20);

  // 150 chars in 30 seconds = 30 words / 0.5 min = 60 WPM
  const wpm2 = calculateSentenceWpm(150, 30000);
  assert.equal(wpm2, 60);

  // 0 elapsed time or 0 chars handles gracefully
  assert.equal(calculateSentenceWpm(0, 30000), 0);
  assert.equal(calculateSentenceWpm(50, 0), 0);
});

test("sentenceGrader: calculateSentenceAccuracy computes correct percentage", () => {
  assert.equal(calculateSentenceAccuracy(100, 100), 100);
  assert.equal(calculateSentenceAccuracy(95, 100), 95);
  assert.equal(calculateSentenceAccuracy(50, 100), 50);
  assert.equal(calculateSentenceAccuracy(0, 0), 100);
});

test("sentenceGrader: gradeSentence produces SM-2 Grade 5 for flawless execution", () => {
  const result = gradeSentence({
    charCount: 60,
    correctChars: 60,
    totalKeystrokes: 60,
    errors: 0,
    backspaces: 0,
    elapsedMs: 12000, // 200ms/char
  });
  assert.equal(result.grade, 5);
  assert.equal(result.label, "⚡ Flawless");
  assert.equal(result.accuracy, 100);
});

test("sentenceGrader: gradeSentence produces Grade 4 for minor backspace and steady pace", () => {
  const result = gradeSentence({
    charCount: 60,
    correctChars: 59,
    totalKeystrokes: 61,
    errors: 1,
    backspaces: 2,
    elapsedMs: 24000, // 400ms/char
  });
  assert.equal(result.grade, 4);
  assert.equal(result.label, "Great Pace");
});

test("sentenceGrader: gradeSentence produces Grade 3 for moderate errors", () => {
  const result = gradeSentence({
    charCount: 60,
    correctChars: 52,
    totalKeystrokes: 63,
    errors: 3,
    backspaces: 4,
    elapsedMs: 30000,
  });
  assert.equal(result.grade, 3);
  assert.equal(result.label, "Passed");
});

test("sentenceGrader: gradeSentence caps retry at Grade 3", () => {
  const result = gradeSentence({
    charCount: 60,
    correctChars: 60,
    totalKeystrokes: 60,
    errors: 0,
    backspaces: 0,
    elapsedMs: 10000,
    wasRetry: true,
  });
  assert.equal(result.grade, 3);
});

test("sentenceGrader: gradeSentence handles skipped sentences", () => {
  const result = gradeSentence({
    charCount: 60,
    correctChars: 0,
    totalKeystrokes: 0,
    errors: 0,
    elapsedMs: 5000,
    wasSkipped: true,
  });
  assert.equal(result.grade, 0);
  assert.equal(result.label, "Skipped");
});

test("sentenceGrader: calculateSentenceXP scales with length, difficulty, and accuracy", () => {
  const beginnerXp = calculateSentenceXP({
    charCount: 50,
    difficulty: "beginner",
    accuracy: 95,
  });
  const intermediateXp = calculateSentenceXP({
    charCount: 50,
    difficulty: "intermediate",
    accuracy: 95,
  });
  const advancedXp = calculateSentenceXP({
    charCount: 50,
    difficulty: "advanced",
    accuracy: 95,
  });

  assert.ok(beginnerXp > 0);
  assert.ok(intermediateXp > beginnerXp);
  assert.ok(advancedXp > intermediateXp);

  // Flawless accuracy gives bonus
  const flawlessXp = calculateSentenceXP({
    charCount: 50,
    difficulty: "advanced",
    accuracy: 100,
  });
  assert.ok(flawlessXp >= advancedXp);
});
