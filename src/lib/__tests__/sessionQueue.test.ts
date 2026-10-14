import test from "node:test";
import assert from "node:assert/strict";
import { useSessionStore } from "@/store/useSessionStore";
import { type WordRecord } from "@/lib/db";

test("sessionQueue: startTargetedPractice properly initializes session with custom list of words", () => {
  const store = useSessionStore.getState();

  const mockWords: WordRecord[] = [
    {
      id: 101,
      word: "bureaucracy",
      category: "daily",
      easeFactor: 1.7,
      interval: 1,
      repetitions: 1,
      nextReviewDate: "2026-10-15",
      totalMistakes: 5,
      totalReviews: 2,
    },
    {
      id: 102,
      word: "conscientious",
      category: "daily",
      easeFactor: 1.5,
      interval: 1,
      repetitions: 1,
      nextReviewDate: "2026-10-15",
      totalMistakes: 7,
      totalReviews: 3,
    },
  ];

  store.startTargetedPractice(mockWords);

  const state = useSessionStore.getState();
  assert.equal(state.isSessionActive, true);
  assert.equal(state.isSessionComplete, false);
  assert.equal(state.currentIndex, 0);
  assert.equal(state.currentWord?.word, "bureaucracy");
  assert.equal(state.mainQueue.length, 2);
  assert.equal(state.completedWords.length, 0);
});

test("sessionQueue: startTargetedPractice gracefully handles empty array", () => {
  const store = useSessionStore.getState();
  const prevQueueLength = store.mainQueue.length;

  store.startTargetedPractice([]);
  // Should not throw or crash
  assert.ok(true);
});
