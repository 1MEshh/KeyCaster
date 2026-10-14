import test from "node:test";
import assert from "node:assert/strict";
import {
  convertSessionsToCsv,
  calculateFingerErgonomics,
  FINGER_ZONES,
} from "../csvExporter";
import { type SessionHistoryRecord } from "../db";

test("csvExporter: converts session records to valid RFC 4180 CSV", () => {
  const mockSessions: SessionHistoryRecord[] = [
    {
      id: 1,
      category: "daily",
      totalWords: 15,
      wpm: 85,
      accuracy: 98,
      errors: 1,
      duration: 25,
      timestamp: "2026-10-15T12:00:00.000Z",
    },
    {
      id: 2,
      category: "custom_gre",
      totalWords: 20,
      wpm: 92,
      accuracy: 100,
      errors: 0,
      duration: 30,
      timestamp: "2026-10-15T12:30:00.000Z",
    },
  ];

  const csv = convertSessionsToCsv(mockSessions);
  const lines = csv.split("\r\n");

  assert.strictEqual(lines.length, 3);
  assert.strictEqual(
    lines[0],
    "Timestamp,Date,Time,Category,TotalWords,WPM,Accuracy,Errors,DurationSeconds"
  );
  assert.ok(lines[1].includes("daily,15,85,98,1,25"));
  assert.ok(lines[2].includes("custom_gre,20,92,100,0,30"));
});

test("csvExporter: properly escapes commas and double quotes in fields", () => {
  const mockSessions: SessionHistoryRecord[] = [
    {
      id: 3,
      category: 'deck, "special"',
      totalWords: 10,
      wpm: 60,
      accuracy: 95,
      errors: 2,
      duration: 15,
      timestamp: "2026-10-15T13:00:00.000Z",
    },
  ];

  const csv = convertSessionsToCsv(mockSessions);
  assert.ok(csv.includes('"deck, ""special"""'));
});

test("csvExporter: handles empty history records cleanly with headers only", () => {
  const csv = convertSessionsToCsv([]);
  assert.strictEqual(
    csv,
    "Timestamp,Date,Time,Category,TotalWords,WPM,Accuracy,Errors,DurationSeconds"
  );
});

test("csvExporter: calculates finger ergonomics breakdown accurately", () => {
  assert.strictEqual(FINGER_ZONES.length, 8);

  const errorMap: Record<string, number> = {
    q: 2,
    a: 3, // Left Pinky = 5
    w: 5, // Left Ring = 5
    // Total errors = 10
  };

  const ergonomics = calculateFingerErgonomics(errorMap);
  const leftPinky = ergonomics.find((e) => e.zone.name === "Left Pinky");
  const leftRing = ergonomics.find((e) => e.zone.name === "Left Ring");
  const leftIndex = ergonomics.find((e) => e.zone.name === "Left Index");

  assert.ok(leftPinky);
  assert.strictEqual(leftPinky.mistakes, 5);
  assert.strictEqual(leftPinky.percentage, 50);

  assert.ok(leftRing);
  assert.strictEqual(leftRing.mistakes, 5);
  assert.strictEqual(leftRing.percentage, 50);

  assert.ok(leftIndex);
  assert.strictEqual(leftIndex.mistakes, 0);
  assert.strictEqual(leftIndex.percentage, 0);
});
