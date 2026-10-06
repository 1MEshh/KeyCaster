import test from "node:test";
import assert from "node:assert/strict";
import {
  useSentenceStore,
  areCharsEquivalent,
  tokenizeSentence,
  getTargetText,
} from "../../store/useSentenceStore";

test("sentenceStore: areCharsEquivalent handles quotes, apostrophes, and hyphens", () => {
  assert.equal(areCharsEquivalent("'", "’"), true);
  assert.equal(areCharsEquivalent("'", "‘"), true);
  assert.equal(areCharsEquivalent('"', "“"), true);
  assert.equal(areCharsEquivalent('"', "”"), true);
  assert.equal(areCharsEquivalent("-", "—"), true);
  assert.equal(areCharsEquivalent("-", "–"), true);
  assert.equal(areCharsEquivalent("a", "a"), true);
  assert.equal(areCharsEquivalent("a", "b"), false);
});

test("sentenceStore: tokenizeSentence splits words and letters accurately", () => {
  const words = tokenizeSentence("Hello, world!");
  assert.equal(words.length, 2);
  assert.equal(words[0].word, "Hello,");
  assert.equal(words[0].letters.length, 6);
  assert.equal(words[0].letters[0].char, "H");
  assert.equal(words[0].letters[0].state, "pending");
  assert.equal(words[1].word, "world!");
});

test("sentenceStore: initSentenceSession sets up sentence typing queue", async () => {
  const store = useSentenceStore.getState();
  await store.initSentenceSession("sentences", "conversation", "beginner");

  const state = useSentenceStore.getState();
  assert.equal(state.practiceType, "sentences");
  assert.equal(state.isSessionActive, true);
  assert.equal(state.isSentenceComplete, false);
  assert.ok(state.sentenceQueue.length > 0);
  assert.ok(state.words.length > 0);
  assert.equal(state.currentWordIndex, 0);
  assert.equal(state.currentLetterIndex, 0);
});

test("sentenceStore: handleKeyStroke advances on correct typing and errors properly", async () => {
  const store = useSentenceStore.getState();
  await store.initSentenceSession("sentences", "conversation", "beginner");

  const initialWord = useSentenceStore.getState().words[0];
  const targetChar = initialWord.letters[0].char;

  // Type wrong character at index 0 with stopOnError="letter"
  const wrongChar = targetChar.toLowerCase() === "x" ? "z" : "x";
  await store.handleKeyStroke(wrongChar, "letter", "off");
  let state = useSentenceStore.getState();
  assert.equal(state.words[0].letters[0].state, "error");
  // Index halts at 0 in stopOnError="letter"
  assert.equal(state.currentLetterIndex, 0);

  // Type correct character to overwrite error and advance
  await store.handleKeyStroke(targetChar, "letter", "off");
  state = useSentenceStore.getState();
  assert.equal(state.words[0].letters[0].state, "correct");
  assert.equal(state.currentLetterIndex, 1);
});

test("sentenceStore: handleBackspace handles character deletion and boundary navigation", async () => {
  const store = useSentenceStore.getState();
  await store.initSentenceSession("sentences", "conversation", "beginner");

  const word0 = useSentenceStore.getState().words[0];
  await store.handleKeyStroke(word0.letters[0].char, "off", "off");
  let state = useSentenceStore.getState();
  assert.equal(state.currentLetterIndex, 1);

  // Backspace within word
  store.handleBackspace("off");
  state = useSentenceStore.getState();
  assert.equal(state.currentLetterIndex, 0);
  assert.equal(state.words[0].letters[0].state, "pending");
});

test("sentenceStore: clean deletion of error at index 0 and no orphaned states", async () => {
  const store = useSentenceStore.getState();
  await store.initSentenceSession("sentences", "conversation", "beginner");

  const initialWord = useSentenceStore.getState().words[0];
  const targetChar = initialWord.letters[0].char;
  const wrongChar = targetChar.toLowerCase() === "q" ? "z" : "q";

  // Type wrong letter at index 0 with stopOnError="letter"
  await store.handleKeyStroke(wrongChar, "letter", "off");
  let state = useSentenceStore.getState();
  assert.equal(state.words[0].letters[0].state, "error");
  assert.equal(state.currentLetterIndex, 0);
  assert.equal(state.words[0].hasErrors, true);

  // Press backspace to cleanly clear the error
  store.handleBackspace("off");
  state = useSentenceStore.getState();
  assert.equal(state.words[0].letters[0].state, "pending");
  assert.equal(state.words[0].letters[0].typedChar, undefined);
  assert.equal(state.words[0].hasErrors, false);
  assert.equal(state.currentLetterIndex, 0);
});

test("sentenceStore: stopOnError word blocks space advancement with errors", async () => {
  const store = useSentenceStore.getState();
  await store.initSentenceSession("sentences", "conversation", "beginner");

  const word0 = useSentenceStore.getState().words[0];
  const wrongChar = word0.letters[0].char === "z" ? "x" : "z";

  // In stopOnError="word", type wrong letter, which advances to next index
  await store.handleKeyStroke(wrongChar, "word", "off");
  let state = useSentenceStore.getState();
  assert.equal(state.words[0].letters[0].state, "error");
  assert.equal(state.words[0].hasErrors, true);

  // Attempting to space should NOT advance word
  await store.handleSpace("word");
  state = useSentenceStore.getState();
  assert.equal(state.currentWordIndex, 0);
});

test("sentenceStore: confidenceMode max disables backspace completely", async () => {
  const store = useSentenceStore.getState();
  await store.initSentenceSession("sentences", "conversation", "beginner");

  const word0 = useSentenceStore.getState().words[0];
  await store.handleKeyStroke(word0.letters[0].char, "off", "max");
  let state = useSentenceStore.getState();
  assert.equal(state.currentLetterIndex, 1);

  // Backspace in confidence "max" should be ignored
  store.handleBackspace("max");
  state = useSentenceStore.getState();
  assert.equal(state.currentLetterIndex, 1);
  assert.equal(state.words[0].letters[0].state, "correct");
});

test("sentenceStore: toggleVocabHint toggles hint visibility", () => {
  const store = useSentenceStore.getState();
  const initial = store.showVocabHint;
  store.toggleVocabHint();
  assert.equal(useSentenceStore.getState().showVocabHint, !initial);
  store.toggleVocabHint();
  assert.equal(useSentenceStore.getState().showVocabHint, initial);
});
