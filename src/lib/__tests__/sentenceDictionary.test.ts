import test from "node:test";
import assert from "node:assert/strict";
import {
  getAllBilingualSentences,
  getBilingualSentencesByCategory,
  getBilingualSentencesByDifficulty,
  getRandomBilingualSentence,
  getBilingualSentenceById,
  getAllEnglishSentences,
  getEnglishSentencesByCategory,
  getEnglishSentencesByDifficulty,
  getRandomEnglishSentence,
  normalizeSentence,
  checkSentenceMatch,
  isSentenceCorrect,
  isEnglishSentenceCorrect,
  getVocabularyHints,
  getVocabularyHint,
  getSentenceLiteralMeaning,
  findVocabularyCardByWord,
} from "../sentenceDictionary";

test("Bilingual: loads dataset with at least 40-50 sentences and valid schema", () => {
  const sentences = getAllBilingualSentences();
  assert.ok(sentences.length >= 40, `Expected at least 40 sentences, got ${sentences.length}`);

  for (const s of sentences) {
    assert.ok(s.id, "Sentence must have an id");
    assert.ok(["daily", "tech", "wisdom", "business"].includes(s.category), `Invalid category: ${s.category}`);
    assert.ok(["beginner", "intermediate", "advanced"].includes(s.difficulty), `Invalid difficulty: ${s.difficulty}`);
    assert.ok(s.arabic && s.arabic.length > 0, "Arabic sentence cannot be empty");
    assert.ok(s.english && s.english.length > 0, "English sentence cannot be empty");
    assert.ok(Array.isArray(s.acceptedAlternatives), "acceptedAlternatives must be an array");
    assert.ok(s.literalMeaning && s.literalMeaning.length > 0, "literalMeaning cannot be empty");
    assert.ok(Array.isArray(s.vocabularyCards) && s.vocabularyCards.length >= 2, "Must have at least 2 vocabulary cards");
    for (const card of s.vocabularyCards) {
      assert.ok(card.ar && card.en, "Each card must have ar and en");
    }
  }
});

test("Bilingual: filter by category and difficulty works", () => {
  const techSentences = getBilingualSentencesByCategory("tech");
  assert.ok(techSentences.length > 0);
  assert.ok(techSentences.every((s) => s.category === "tech"));

  const beginnerSentences = getBilingualSentencesByDifficulty("beginner");
  assert.ok(beginnerSentences.length > 0);
  assert.ok(beginnerSentences.every((s) => s.difficulty === "beginner"));

  const randomDaily = getRandomBilingualSentence({ category: "daily", difficulty: "beginner" });
  assert.ok(randomDaily !== null);
  assert.equal(randomDaily?.category, "daily");
  assert.equal(randomDaily?.difficulty, "beginner");

  const single = getBilingualSentenceById("ar-daily-01");
  assert.ok(single);
  assert.equal(single?.id, "ar-daily-01");
});

test("English: loads dataset with at least 30-40 sentences across 4 categories", () => {
  const sentences = getAllEnglishSentences();
  assert.ok(sentences.length >= 30, `Expected at least 30 sentences, got ${sentences.length}`);

  for (const s of sentences) {
    assert.ok(s.id, "Sentence must have an id");
    assert.ok(
      ["conversation", "programming", "philosophy", "literature"].includes(s.category),
      `Invalid category: ${s.category}`
    );
    assert.ok(["beginner", "intermediate", "advanced"].includes(s.difficulty), `Invalid difficulty: ${s.difficulty}`);
    assert.ok(s.text && s.text.length > 0, "Text cannot be empty");
  }

  const prog = getEnglishSentencesByCategory("programming");
  assert.ok(prog.length >= 8);
  const randomProg = getRandomEnglishSentence({ category: "programming" });
  assert.ok(randomProg !== null);
  assert.equal(randomProg?.category, "programming");
});

test("Sentence Normalization: handles quotes, curly apostrophes, whitespace, and punctuation", () => {
  const input = "  Good  morning,   how’re you   today?  ";
  const normalized = normalizeSentence(input);
  assert.equal(normalized, "good morning, how're you today?");

  const noPunct = normalizeSentence(input, { ignorePunctuation: true });
  assert.equal(noPunct, "good morning how're you today");

  const stripTrailing = normalizeSentence(input, { stripTrailingPunctuationOnly: true });
  assert.equal(stripTrailing, "good morning, how're you today");
});

test("Sentence Matching: accurately matches canonical and accepted alternatives", () => {
  const sentence = getBilingualSentenceById("ar-daily-01")!;
  assert.ok(sentence);

  // Exact canonical match
  const matchCanonical = checkSentenceMatch("Good morning, how are you today?", sentence);
  assert.equal(matchCanonical.isMatch, true);
  assert.equal(matchCanonical.isCanonical, true);

  // Case insensitive canonical match
  const matchCase = checkSentenceMatch("good morning, how are you today?", sentence);
  assert.equal(matchCase.isMatch, true);
  assert.equal(matchCase.isCanonical, true);

  // Alternative with contraction and curly apostrophe
  const matchAlt = checkSentenceMatch("Good morning, how’re you today?", sentence);
  assert.equal(matchAlt.isMatch, true);
  assert.equal(matchAlt.isCanonical, false);

  // Missing trailing question mark tolerated by default
  const matchNoTrailing = checkSentenceMatch("Good morning, how are you today", sentence);
  assert.equal(matchNoTrailing.isMatch, true);

  // Incorrect sentence fails
  const matchWrong = checkSentenceMatch("Hello world this is wrong", sentence);
  assert.equal(matchWrong.isMatch, false);

  // Helper boolean check
  assert.equal(isSentenceCorrect("Good morning, how are you today?", sentence), true);
  assert.equal(isSentenceCorrect("Good morning, how're you today?", sentence), true);
  assert.equal(isSentenceCorrect("Something completely different", sentence), false);
});

test("English Sentence Correctness: checks typed English against target", () => {
  const target = {
    id: "test-01",
    category: "programming",
    difficulty: "beginner" as const,
    text: "Always write clean code that is easy for humans to read and understand.",
    author: "Martin Fowler",
  };

  assert.equal(isEnglishSentenceCorrect("Always write clean code that is easy for humans to read and understand.", target), true);
  assert.equal(isEnglishSentenceCorrect("always write clean code that is easy for humans to read and understand.", target), true);
  assert.equal(isEnglishSentenceCorrect("Always write clean code that is easy for humans to read and understand", target), true);
  assert.equal(isEnglishSentenceCorrect("Write messy code quickly", target), false);
});

test("Vocabulary & Hints: correctly retrieves hints and literal meanings", () => {
  const sentence = getBilingualSentenceById("ar-daily-01")!;
  const hints = getVocabularyHints(sentence);
  assert.equal(hints.length, 3);

  const firstHint = getVocabularyHint(sentence, 0);
  assert.ok(firstHint);
  assert.equal(firstHint?.en, "good morning");

  const literal = getSentenceLiteralMeaning(sentence);
  assert.ok(literal.length > 0);

  const foundCard = findVocabularyCardByWord(sentence, "today");
  assert.ok(foundCard);
  assert.equal(foundCard?.en, "today");
});
