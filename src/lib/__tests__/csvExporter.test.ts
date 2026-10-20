import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateFingerErgonomics,
  convertSessionsToCsv,
  generateSessionScorecardMarkdown,
} from "../csvExporter";

test("csvExporter: calculates finger ergonomics percentages accurately across zones", () => {
  const errorMap = {
    q: 3,
    a: 1, // Left Pinky = 4
    e: 4, // Left Middle = 4
    p: 2, // Right Pinky = 2
  };
  const stats = calculateFingerErgonomics(errorMap);
  const leftPinky = stats.find((s) => s.zone.name === "Left Pinky");
  const leftMiddle = stats.find((s) => s.zone.name === "Left Middle");
  const rightPinky = stats.find((s) => s.zone.name === "Right Pinky");
  const rightIndex = stats.find((s) => s.zone.name === "Right Index");

  assert.equal(leftPinky?.mistakes, 4);
  assert.equal(leftPinky?.percentage, 40);
  assert.equal(leftMiddle?.mistakes, 4);
  assert.equal(leftMiddle?.percentage, 40);
  assert.equal(rightPinky?.mistakes, 2);
  assert.equal(rightPinky?.percentage, 20);
  assert.equal(rightIndex?.mistakes, 0);
  assert.equal(rightIndex?.percentage, 0);
});

test("csvExporter: serializes session history records into RFC 4180 compliant CSV", () => {
  const csv = convertSessionsToCsv([
    {
      id: 1,
      timestamp: "2026-10-21T02:45:00.000Z",
      category: 'Translation, "Advanced"',
      totalWords: 45,
      wpm: 78,
      accuracy: 98.4,
      errors: 1,
      duration: 34,
    },
  ]);

  const lines = csv.split("\r\n");
  assert.equal(lines.length, 2);
  assert.equal(
    lines[0],
    "Timestamp,Date,Time,Category,TotalWords,WPM,Accuracy,Errors,DurationSeconds"
  );
  assert.ok(lines[1].includes('"Translation, ""Advanced"""'));
  assert.ok(lines[1].includes(",45,78,98.4,1,34"));
});

test("csvExporter: generates a complete Markdown scorecard with all performance metrics", () => {
  const md = generateSessionScorecardMarkdown({
    wpm: 84.6,
    accuracy: 99.2,
    category: "arabic_translation",
    totalWords: 50,
    duration: 38,
    errors: 1,
    streak: 32,
    xpEarned: 420,
    timestamp: 1792540800000,
  });

  assert.ok(md.includes("# KeyCaster Speedrun & Dictation Scorecard"));
  assert.ok(md.includes("`ARABIC_TRANSLATION`"));
  assert.ok(md.includes("| **Net Speed** | **85 WPM** |"));
  assert.ok(md.includes("| **Accuracy** | **99.2%** |"));
  assert.ok(md.includes("| **Max Streak** | 32 flawless |"));
  assert.ok(md.includes("| **XP Gained** | +420 XP |"));
  assert.ok(md.includes("KeyCaster v3.5"));
});
