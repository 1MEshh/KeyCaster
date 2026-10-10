import test from "node:test";
import assert from "node:assert/strict";
import { formatSessionSummaryText, exportScoreCardCanvas } from "../scoreCardExporter";

test("scoreCardExporter: formatSessionSummaryText produces clean social summary text", () => {
  const summary = formatSessionSummaryText({
    deckName: "daily",
    wpm: 84,
    rawWpm: 90,
    accuracy: 98,
    consistency: 92,
    durationSec: 45,
    totalWords: 15,
    passedWords: 14,
    failedWords: 1,
  });

  assert.match(summary, /⚡ KeyCaster Review Summary/);
  assert.match(summary, /DAILY/);
  assert.match(summary, /84 WPM/);
  assert.match(summary, /90 WPM/);
  assert.match(summary, /98%/);
  assert.match(summary, /92%/);
  assert.match(summary, /14\/15/);
  assert.match(summary, /keycaster\.app/);
});

test("scoreCardExporter: exportScoreCardCanvas returns null safely in headless / node environment without document", () => {
  const res = exportScoreCardCanvas({
    deckName: "coding",
    wpm: 75,
    accuracy: 95,
    consistency: 80,
    durationSec: 60,
    totalWords: 15,
    passedWords: 15,
    failedWords: 0,
  });

  assert.equal(res, null);
});
