import test from "node:test";
import assert from "node:assert/strict";
import { gradeWord } from "../grader";

test("Grader: 0 errors, 0 backspaces, fast typing (<320ms/char) -> Grade 5", () => {
  const result = gradeWord({
    word: "rhythm",
    errors: 0,
    backspaces: 0,
    elapsedMs: 1500, // 250ms/char
    wasRetry: false,
  });
  assert.equal(result.grade, 5);
  assert.equal(result.label, "⚡ Flawless");
});

test("Grader: 0 errors, 1 backspace, steady typing (<550ms/char) -> Grade 4", () => {
  const result = gradeWord({
    word: "rhythm",
    errors: 0,
    backspaces: 1,
    elapsedMs: 2400, // 400ms/char
    wasRetry: false,
  });
  assert.equal(result.grade, 4);
  assert.equal(result.label, "Great Pace");
});

test("Grader: 1-2 errors, minor backspaces -> Grade 3", () => {
  const result = gradeWord({
    word: "rhythm",
    errors: 2,
    backspaces: 2,
    elapsedMs: 3000,
    wasRetry: false,
  });
  assert.equal(result.grade, 3);
  assert.equal(result.label, "Passed");
});

test("Grader: Retry words capped at Grade 3 even if typed fast with 0 errors", () => {
  const result = gradeWord({
    word: "rhythm",
    errors: 0,
    backspaces: 0,
    elapsedMs: 1200,
    wasRetry: true,
  });
  assert.equal(result.grade, 3);
  assert.equal(result.label, "Passed");
});

test("Grader: Heavy mistakes (>4 errors) -> Grade 1", () => {
  const result = gradeWord({
    word: "rhythm",
    errors: 5,
    backspaces: 4,
    elapsedMs: 5000,
    wasRetry: false,
  });
  assert.equal(result.grade, 1);
  assert.equal(result.label, "Needs Practice");
});
