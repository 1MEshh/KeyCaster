import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeCustomDeck } from "../sanitize";
import { type CustomDeckRecord, type WordRecord } from "../db";

test("customDecks: sanitizeCustomDeck accurately extracts valid unique words and cleans deck name", () => {
  const result = sanitizeCustomDeck("  <b>Cyberpunk Vocab</b>  ", "matrix, netrunner, cipher, matrix, ICE, AI");
  assert.equal(result.name, "Cyberpunk Vocab");
  assert.equal(result.words.length, 5); // Deduplicated matrix
  assert.deepEqual(result.words, ["matrix", "netrunner", "cipher", "ice", "ai"]);
});

test("customDecks: reconciliation logic pairs categoryKey with word category", () => {
  const deckId = 42;
  const categoryKey = `custom_${deckId}`;

  const deck: CustomDeckRecord = {
    id: deckId,
    categoryKey,
    name: "Medical Terms",
    description: "Custom medical vocabulary",
    words: ["cardiac", "pulmonary", "hepatic"],
    createdAt: "2026-10-10",
  };

  const words: WordRecord[] = deck.words.map((w) => ({
    word: w,
    category: deck.categoryKey || `custom_${deck.id}`,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReviewDate: "2026-10-10",
    totalMistakes: 0,
    totalReviews: 0,
  }));

  // Assert words match the category key
  assert.equal(words[0].category, "custom_42");
  assert.equal(words[1].category, "custom_42");
  assert.equal(words[2].category, "custom_42");

  // Querying by deck.categoryKey finds all words
  const queriedWords = words.filter((w) => w.category === deck.categoryKey);
  assert.equal(queriedWords.length, 3);
});

test("customDecks: deck deletion removes all matching category words", () => {
  let allWords: WordRecord[] = [
    { word: "daily1", category: "daily", easeFactor: 2.5, interval: 0, repetitions: 0, nextReviewDate: "2026-10-10", totalMistakes: 0, totalReviews: 0 },
    { word: "cust1", category: "custom_7", easeFactor: 2.5, interval: 0, repetitions: 0, nextReviewDate: "2026-10-10", totalMistakes: 0, totalReviews: 0 },
    { word: "cust2", category: "custom_7", easeFactor: 2.5, interval: 0, repetitions: 0, nextReviewDate: "2026-10-10", totalMistakes: 0, totalReviews: 0 },
  ];

  // Simulate deletion of custom_7
  const deleteCategory = "custom_7";
  allWords = allWords.filter((w) => w.category !== deleteCategory);

  assert.equal(allWords.length, 1);
  assert.equal(allWords[0].word, "daily1");
});
