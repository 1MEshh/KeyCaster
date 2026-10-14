import test from "node:test";
import assert from "node:assert/strict";
import { useGameModeStore } from "@/store/useGameModeStore";
import { useProfileStore } from "@/store/useProfileStore";

test("arcadeProgression: startMode initializes time_attack with 60s and resets counters", () => {
  const store = useGameModeStore.getState();
  store.startMode("time_attack");

  const state = useGameModeStore.getState();
  assert.equal(state.mode, "time_attack");
  assert.equal(state.isActive, true);
  assert.equal(state.isGameOver, false);
  assert.equal(state.timeLeft, 60);
  assert.equal(state.score, 0);
  assert.equal(state.wordsCompleted, 0);
  assert.equal(state.currentStreak, 0);
  assert.ok(state.words.length > 0);
});

test("arcadeProgression: submitWord advances streak, computes score and tracks highestStreak", () => {
  const store = useGameModeStore.getState();
  store.startMode("time_attack");

  // Word 1 with 0 errors, 5 chars
  store.submitWord({ errors: 0, chars: 5 });
  let state = useGameModeStore.getState();
  assert.equal(state.wordsCompleted, 1);
  assert.equal(state.currentStreak, 1);
  assert.equal(state.highestStreak, 1);
  assert.ok(state.score >= 50);

  // Word 2 with 0 errors, 6 chars
  store.submitWord({ errors: 0, chars: 6 });
  state = useGameModeStore.getState();
  assert.equal(state.wordsCompleted, 2);
  assert.equal(state.currentStreak, 2);
  assert.equal(state.highestStreak, 2);

  // Word 3 with 1 error -> resets streak to 0 but keeps highestStreak = 2
  store.submitWord({ errors: 1, chars: 4 });
  state = useGameModeStore.getState();
  assert.equal(state.wordsCompleted, 3);
  assert.equal(state.currentStreak, 0);
  assert.equal(state.highestStreak, 2);
});

test("arcadeProgression: sudden_death triggers game over upon mistake", () => {
  const store = useGameModeStore.getState();
  store.startMode("sudden_death");

  const initialXp = useProfileStore.getState().xp;

  store.recordKeystroke(true);
  store.recordKeystroke(true);
  store.submitWord({ errors: 0, chars: 5 });

  // Now trigger mistake
  store.recordMistake();

  const state = useGameModeStore.getState();
  assert.equal(state.isGameOver, true);
  assert.equal(state.errors, 1);
  assert.ok(state.endTime !== null);
});
