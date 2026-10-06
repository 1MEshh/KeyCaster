import test from "node:test";
import assert from "node:assert/strict";
import {
  getAllBilingualSentences,
  getBilingualSentencesByCategory,
  getBilingualSentencesByDifficulty,
  filterBilingualSentences,
  getRandomBilingualSentence,
  getBilingualSentenceById,
  checkSentenceMatch,
  isSentenceCorrect,
  normalizeSentence,
  expandContractions,
  getVocabularyHints,
  getVocabularyHint,
  getSentenceLiteralMeaning,
  findVocabularyCardByWord,
  BILINGUAL_CATEGORIES,
  SENTENCE_DIFFICULTIES,
  type BilingualSentence,
  type SentenceCategory,
} from "../sentenceDictionary";
import {
  calculateSentenceWpm,
  calculateSentenceAccuracy,
  gradeSentence,
  calculateSentenceXP,
} from "../sentenceGrader";
import { useSentenceStore } from "../../store/useSentenceStore";

/* ==========================================================================
   1. Dataset Loading and Schema Verification (All 50 Sentences)
   ========================================================================== */

test("translationMode: loads and retrieves exactly 50 bilingual sentences with complete schemas", () => {
  const sentences = getAllBilingualSentences();
  assert.equal(sentences.length, 50, "Bilingual dataset must contain exactly 50 sentences");

  const seenIds = new Set<string>();
  const categoryCounts: Record<SentenceCategory, number> = {
    daily: 0,
    tech: 0,
    wisdom: 0,
    business: 0,
  };

  for (const s of sentences) {
    // Unique ID
    assert.ok(s.id && s.id.trim().length > 0, "Sentence must have a non-empty id");
    assert.ok(!seenIds.has(s.id), `Duplicate sentence id found: ${s.id}`);
    seenIds.add(s.id);

    // Valid category & difficulty
    assert.ok(
      BILINGUAL_CATEGORIES.includes(s.category),
      `Sentence ${s.id} has invalid category: ${s.category}`
    );
    categoryCounts[s.category] += 1;

    assert.ok(
      SENTENCE_DIFFICULTIES.includes(s.difficulty),
      `Sentence ${s.id} has invalid difficulty: ${s.difficulty}`
    );

    // Text content
    assert.ok(s.arabic && s.arabic.trim().length > 0, `Sentence ${s.id} missing Arabic text`);
    // Verify Arabic characters are present
    assert.ok(/[\u0600-\u06FF]/.test(s.arabic), `Sentence ${s.id} must contain Arabic unicode`);

    assert.ok(s.english && s.english.trim().length > 0, `Sentence ${s.id} missing English text`);
    assert.ok(
      Array.isArray(s.acceptedAlternatives) && s.acceptedAlternatives.length >= 2,
      `Sentence ${s.id} must have at least 2 accepted alternatives`
    );

    assert.ok(
      s.literalMeaning && s.literalMeaning.trim().length > 0,
      `Sentence ${s.id} missing literal meaning`
    );

    // Vocabulary Cards
    assert.ok(
      Array.isArray(s.vocabularyCards) && s.vocabularyCards.length >= 2,
      `Sentence ${s.id} must have at least 2 vocabulary cards`
    );
    for (const card of s.vocabularyCards) {
      assert.ok(card.ar && card.ar.trim().length > 0, `Card in ${s.id} missing Arabic word`);
      assert.ok(card.en && card.en.trim().length > 0, `Card in ${s.id} missing English word`);
    }
  }

  // Verify category distribution
  assert.equal(categoryCounts.daily, 13, "Should have 13 daily sentences");
  assert.equal(categoryCounts.tech, 13, "Should have 13 tech sentences");
  assert.equal(categoryCounts.wisdom, 12, "Should have 12 wisdom sentences");
  assert.equal(categoryCounts.business, 12, "Should have 12 business sentences");
});

test("translationMode: retrieves individual sentences by unique ID across all categories", () => {
  const daily = getBilingualSentenceById("ar-daily-01");
  assert.ok(daily);
  assert.equal(daily?.category, "daily");
  assert.equal(daily?.english, "Good morning, how are you today?");

  const tech = getBilingualSentenceById("ar-tech-01");
  assert.ok(tech);
  assert.equal(tech?.category, "tech");

  const wisdom = getBilingualSentenceById("ar-wisdom-01");
  assert.ok(wisdom);
  assert.equal(wisdom?.category, "wisdom");

  const business = getBilingualSentenceById("ar-biz-01");
  assert.ok(business);
  assert.equal(business?.category, "business");

  const notFound = getBilingualSentenceById("invalid-id-9999");
  assert.equal(notFound, undefined);
});

/* ==========================================================================
   2. Sentence Matching, Accepted Alternatives, and Contractions
   ========================================================================== */

test("translationMode: accurately matches canonical English sentences", () => {
  const sentence = getBilingualSentenceById("ar-daily-01")!;
  assert.ok(sentence);

  // Exact canonical match
  const resultExact = checkSentenceMatch("Good morning, how are you today?", sentence);
  assert.equal(resultExact.isMatch, true);
  assert.equal(resultExact.isCanonical, true);
  assert.equal(resultExact.matchedText, sentence.english);

  // Case-insensitive match
  const resultCase = checkSentenceMatch("good morning, how are you today?", sentence);
  assert.equal(resultCase.isMatch, true);
  assert.equal(resultCase.isCanonical, true);

  // Extra whitespace tolerance
  const resultSpaces = checkSentenceMatch("  Good   morning,   how are you  today?   ", sentence);
  assert.equal(resultSpaces.isMatch, true);
  assert.equal(resultSpaces.isCanonical, true);
});

test("translationMode: accurately matches accepted alternatives", () => {
  const sentence = getBilingualSentenceById("ar-daily-02")!;
  assert.ok(sentence);
  // Canonical: "Can I have a cup of water, please?"
  // Alternatives include: "Could I have a cup of water, please?"

  const resultAlt = checkSentenceMatch("Could I have a cup of water, please?", sentence);
  assert.equal(resultAlt.isMatch, true);
  assert.equal(resultAlt.isCanonical, false);
  assert.equal(resultAlt.matchedText, "Could I have a cup of water, please?");
});

test("translationMode: matches contractions and expanded equivalents ('don't' vs 'do not')", () => {
  const wisdom = getBilingualSentenceById("ar-wisdom-06")!;
  assert.ok(wisdom);
  // Canonical: "Time is like a sword; if you do not cut it, it will cut you."

  // User types with contraction "don't"
  const matchContraction = checkSentenceMatch(
    "Time is like a sword; if you don't cut it, it will cut you.",
    wisdom
  );
  assert.equal(matchContraction.isMatch, true);

  // User types with expanded "do not"
  const matchExpanded = checkSentenceMatch(
    "Time is like a sword; if you do not cut it, it will cut you.",
    wisdom
  );
  assert.equal(matchExpanded.isMatch, true);

  // User types with curly apostrophe "don’t"
  const matchCurly = checkSentenceMatch(
    "Time is like a sword; if you don’t cut it, it will cut you.",
    wisdom
  );
  assert.equal(matchCurly.isMatch, true);
});

test("translationMode: matches contractions and expanded equivalents ('I'm' vs 'I am')", () => {
  const daily = getBilingualSentenceById("ar-daily-04")!;
  assert.ok(daily);
  // Canonical: "I am very grateful for your kind help."

  // User types "I'm"
  const matchContraction = checkSentenceMatch(
    "I'm very grateful for your kind help.",
    daily
  );
  assert.equal(matchContraction.isMatch, true);

  // User types "I am"
  const matchExpanded = checkSentenceMatch(
    "I am very grateful for your kind help.",
    daily
  );
  assert.equal(matchExpanded.isMatch, true);

  // User types with curly apostrophe
  const matchCurly = checkSentenceMatch(
    "I’m very grateful for your kind help.",
    daily
  );
  assert.equal(matchCurly.isMatch, true);
});

test("translationMode: matches various common contractions ('how're', 'where's', 'I'll')", () => {
  // ar-daily-01: "Good morning, how are you today?"
  const s1 = getBilingualSentenceById("ar-daily-01")!;
  assert.equal(isSentenceCorrect("Good morning, how're you today?", s1), true);

  // ar-daily-03: "Where is the nearest train station from here?"
  const s3 = getBilingualSentenceById("ar-daily-03")!;
  assert.equal(isSentenceCorrect("Where's the nearest train station from here?", s3), true);

  // ar-daily-05: "I will meet my friends at the cafe after work."
  const s5 = getBilingualSentenceById("ar-daily-05")!;
  assert.equal(isSentenceCorrect("I'll meet my friends at the cafe after work.", s5), true);
});

test("translationMode: expandContractions helper expands standard English contractions", () => {
  assert.equal(expandContractions("don't"), "do not");
  assert.equal(expandContractions("doesn't"), "does not");
  assert.equal(expandContractions("didn't"), "did not");
  assert.equal(expandContractions("won't"), "will not");
  assert.equal(expandContractions("can't"), "can not");
  assert.equal(expandContractions("cannot"), "can not");
  assert.equal(expandContractions("I'm"), "i am");
  assert.equal(expandContractions("you're"), "you are");
  assert.equal(expandContractions("they're"), "they are");
  assert.equal(expandContractions("we'll"), "we will");
  assert.equal(expandContractions("it's"), "it is");
  assert.equal(expandContractions("how’re"), "how are"); // handles curly quote
});

test("translationMode: handles punctuation tolerance and strict matching", () => {
  const sentence = getBilingualSentenceById("ar-daily-01")!;

  // Missing trailing question mark tolerated by default
  const matchNoTrailing = checkSentenceMatch("Good morning, how are you today", sentence);
  assert.equal(matchNoTrailing.isMatch, true);

  // Missing trailing punctuation rejected when allowMissingTrailingPunctuation is false
  const matchStrictPunct = checkSentenceMatch("Good morning, how are you today", sentence, {
    allowMissingTrailingPunctuation: false,
  });
  assert.equal(matchStrictPunct.isMatch, false);

  // Case-sensitive mode rejects lowercase input
  const matchStrictCase = checkSentenceMatch("good morning, how are you today?", sentence, {
    caseSensitive: true,
  });
  assert.equal(matchStrictCase.isMatch, false);

  // Completely wrong text rejected
  assert.equal(checkSentenceMatch("Unrelated text here", sentence).isMatch, false);
  assert.equal(checkSentenceMatch("", sentence).isMatch, false);
});

/* ==========================================================================
   3. Translation Session Queue Generation and Category Filtering
   ========================================================================== */

test("translationMode: filterBilingualSentences filters by category and difficulty accurately", () => {
  const all = filterBilingualSentences();
  assert.equal(all.length, 50);

  const daily = filterBilingualSentences({ category: "daily" });
  assert.equal(daily.length, 13);
  assert.ok(daily.every((s) => s.category === "daily"));

  const tech = filterBilingualSentences({ category: "tech" });
  assert.equal(tech.length, 13);
  assert.ok(tech.every((s) => s.category === "tech"));

  const wisdom = filterBilingualSentences({ category: "wisdom" });
  assert.equal(wisdom.length, 12);
  assert.ok(wisdom.every((s) => s.category === "wisdom"));

  const business = filterBilingualSentences({ category: "business" });
  assert.equal(business.length, 12);
  assert.ok(business.every((s) => s.category === "business"));

  // Difficulty filter
  const beginners = filterBilingualSentences({ difficulty: "beginner" });
  assert.ok(beginners.length > 0);
  assert.ok(beginners.every((s) => s.difficulty === "beginner"));

  // Combined filter
  const techBeginners = filterBilingualSentences({ category: "tech", difficulty: "beginner" });
  assert.ok(techBeginners.length > 0);
  assert.ok(techBeginners.every((s) => s.category === "tech" && s.difficulty === "beginner"));
});

test("translationMode: getRandomBilingualSentence selects valid sentences and handles empty filters", () => {
  const randomWisdom = getRandomBilingualSentence({ category: "wisdom" });
  assert.ok(randomWisdom);
  assert.equal(randomWisdom?.category, "wisdom");

  const randomNonExistent = getRandomBilingualSentence({ category: "non-existent-cat" });
  assert.equal(randomNonExistent, null);
});

test("translationMode: initSentenceSession in useSentenceStore creates queue and tokenizes properly", async () => {
  const store = useSentenceStore.getState();

  // Initialize translation session for 'business' category
  await store.initSentenceSession("translation", "business", "all");

  const state = useSentenceStore.getState();
  assert.equal(state.practiceType, "translation");
  assert.equal(state.activeCategory, "business");
  assert.equal(state.isSessionActive, true);
  assert.equal(state.isSentenceComplete, false);
  assert.equal(state.isSessionComplete, false);
  assert.equal(state.queueIndex, 0);

  // Queue should have 5 sentences (or all available if < 5)
  assert.equal(state.sentenceQueue.length, 5);
  for (const s of state.sentenceQueue) {
    assert.equal(s.category, "business");
  }

  // Current sentence is the first in queue
  assert.equal(state.currentSentence?.id, state.sentenceQueue[0].id);

  // Words tokenized
  assert.ok(state.words.length > 0);
  assert.equal(state.currentWordIndex, 0);
  assert.equal(state.currentLetterIndex, 0);
  assert.ok(state.words[0].letters.every((l) => l.state === "pending"));

  // Advance to next sentence
  store.nextSentence();
  const nextState = useSentenceStore.getState();
  assert.equal(nextState.queueIndex, 1);
  assert.equal(nextState.currentSentence?.id, state.sentenceQueue[1].id);
  assert.equal(nextState.currentWordIndex, 0);
  assert.equal(nextState.currentLetterIndex, 0);

  // Restart session resets to index 0
  store.restartSession();
  const restartState = useSentenceStore.getState();
  assert.equal(restartState.queueIndex, 0);
  assert.equal(restartState.currentSentence?.id, state.sentenceQueue[0].id);
});

/* ==========================================================================
   4. Vocabulary Flashcard Retrieval for Each Category
   ========================================================================== */

test("translationMode: retrieves flashcards and hints across all 4 categories", () => {
  const categories: SentenceCategory[] = ["daily", "tech", "wisdom", "business"];

  for (const cat of categories) {
    const sentences = getBilingualSentencesByCategory(cat);
    assert.ok(sentences.length > 0, `Category ${cat} should have sentences`);

    for (const s of sentences) {
      const hints = getVocabularyHints(s);
      assert.ok(hints.length >= 2, `Sentence ${s.id} should have >= 2 vocabulary hints`);

      // Verify first card
      const firstCard = getVocabularyHint(s, 0);
      assert.ok(firstCard);
      assert.equal(firstCard?.ar, hints[0].ar);
      assert.equal(firstCard?.en, hints[0].en);

      // Verify literal meaning
      const literal = getSentenceLiteralMeaning(s);
      assert.ok(literal && literal.length > 0, `Sentence ${s.id} literal meaning missing`);
    }
  }
});

test("translationMode: getVocabularyHint bounds checking returns null on out-of-range index", () => {
  const sentence = getBilingualSentenceById("ar-tech-01")!;
  assert.ok(sentence);

  assert.equal(getVocabularyHint(sentence, -1), null);
  assert.equal(getVocabularyHint(sentence, 9999), null);

  const dummySentence: BilingualSentence = {
    ...sentence,
    vocabularyCards: [],
  };
  assert.equal(getVocabularyHint(dummySentence, 0), null);
});

test("translationMode: findVocabularyCardByWord finds cards by English and Arabic query", () => {
  const sentence = getBilingualSentenceById("ar-tech-01")!;
  assert.ok(sentence);

  // Find by English word (case-insensitive substring)
  const cardEn = findVocabularyCardByWord(sentence, "application");
  assert.ok(cardEn);
  assert.ok(cardEn?.en.toLowerCase().includes("application"));

  // Find by Arabic word
  const firstAr = sentence.vocabularyCards[0].ar;
  const cardAr = findVocabularyCardByWord(sentence, firstAr);
  assert.ok(cardAr);
  assert.equal(cardAr?.ar, firstAr);

  // Non-matching query returns undefined
  assert.equal(findVocabularyCardByWord(sentence, "nonexistentxyz"), undefined);
  assert.equal(findVocabularyCardByWord(sentence, ""), undefined);
});

/* ==========================================================================
   5. WPM, Accuracy, SM-2 Grading, and XP Calculations (Edge Cases)
   ========================================================================== */

test("translationMode: calculateSentenceWpm handles 0ms, negative elapsed, and zero chars", () => {
  // 0ms elapsed -> 0 WPM
  assert.equal(calculateSentenceWpm(50, 0), 0);

  // Negative elapsed -> 0 WPM
  assert.equal(calculateSentenceWpm(50, -500), 0);

  // 0 charCount -> 0 WPM
  assert.equal(calculateSentenceWpm(0, 10000), 0);

  // Negative charCount -> 0 WPM
  assert.equal(calculateSentenceWpm(-10, 10000), 0);

  // Normal calculation: 50 chars in 12,000ms (10 words in 0.2 min = 50 WPM)
  assert.equal(calculateSentenceWpm(50, 12000), 50);

  // Fast calculation: 200 chars in 30,000ms (40 words in 0.5 min = 80 WPM)
  assert.equal(calculateSentenceWpm(200, 30000), 80);

  // Very small elapsed (1ms) does not produce NaN or Infinity
  const highWpm = calculateSentenceWpm(50, 1);
  assert.ok(Number.isFinite(highWpm));
  assert.ok(highWpm > 0);
});

test("translationMode: calculateSentenceAccuracy handles 0 keystrokes, 100%, and heavy errors", () => {
  // 0 total keystrokes defaults gracefully to 100%
  assert.equal(calculateSentenceAccuracy(0, 0), 100);
  assert.equal(calculateSentenceAccuracy(10, 0), 100);
  assert.equal(calculateSentenceAccuracy(10, -5), 100);

  // 0 correct characters -> 0%
  assert.equal(calculateSentenceAccuracy(0, 50), 0);
  assert.equal(calculateSentenceAccuracy(-5, 50), 0);

  // 100% accuracy: 50 correct out of 50 total
  assert.equal(calculateSentenceAccuracy(50, 50), 100);

  // Heavy errors: 10 correct out of 100 total keystrokes -> 10%
  assert.equal(calculateSentenceAccuracy(10, 100), 10);

  // Clamping: even if correct > total, accuracy never exceeds 100%
  assert.equal(calculateSentenceAccuracy(100, 50), 100);
});

test("translationMode: gradeSentence handles flawless, retry, heavy errors, and skipped states", () => {
  // 0ms elapsed edge case: does not crash or return NaN
  const zeroElapsed = gradeSentence({
    charCount: 30,
    correctChars: 30,
    totalKeystrokes: 30,
    errors: 0,
    backspaces: 0,
    elapsedMs: 0,
  });
  assert.equal(zeroElapsed.grade, 5);
  assert.equal(zeroElapsed.accuracy, 100);
  assert.equal(zeroElapsed.wpm, 0);
  assert.equal(zeroElapsed.avgMsPerChar, 0);

  // Flawless typing -> Grade 5
  const flawless = gradeSentence({
    charCount: 40,
    correctChars: 40,
    totalKeystrokes: 40,
    errors: 0,
    backspaces: 0,
    elapsedMs: 8000, // 200ms/char <= 380ms/char
  });
  assert.equal(flawless.grade, 5);
  assert.equal(flawless.label, "⚡ Flawless");
  assert.equal(flawless.accuracy, 100);

  // Solid pace with 1 error and 2 backspaces -> Grade 4
  const solid = gradeSentence({
    charCount: 40,
    correctChars: 39,
    totalKeystrokes: 42,
    errors: 1,
    backspaces: 2,
    elapsedMs: 18000, // 450ms/char <= 600ms/char
  });
  assert.equal(solid.grade, 4);
  assert.equal(solid.label, "Great Pace");

  // Moderate mistakes (3 errors) -> Grade 3
  const moderate = gradeSentence({
    charCount: 40,
    correctChars: 37,
    totalKeystrokes: 44,
    errors: 3,
    backspaces: 4,
    elapsedMs: 25000,
  });
  assert.equal(moderate.grade, 3);
  assert.equal(moderate.label, "Passed");

  // Struggling (5 errors) -> Grade 2
  const hard = gradeSentence({
    charCount: 40,
    correctChars: 35,
    totalKeystrokes: 50,
    errors: 5,
    backspaces: 8,
    elapsedMs: 30000,
  });
  assert.equal(hard.grade, 2);
  assert.equal(hard.label, "Hard Sentence");

  // Heavy errors (>6 errors or <65% acc) -> Grade 1
  const heavyErrors = gradeSentence({
    charCount: 40,
    correctChars: 20,
    totalKeystrokes: 50,
    errors: 10,
    backspaces: 15,
    elapsedMs: 35000,
  });
  assert.equal(heavyErrors.grade, 1);
  assert.equal(heavyErrors.label, "Try Again");

  // Retry capping: Flawless retry is capped at Grade 3
  const retry = gradeSentence({
    charCount: 40,
    correctChars: 40,
    totalKeystrokes: 40,
    errors: 0,
    backspaces: 0,
    elapsedMs: 8000,
    wasRetry: true,
  });
  assert.equal(retry.grade, 3);

  // Skipped sentence -> Grade 0
  const skipped = gradeSentence({
    charCount: 40,
    correctChars: 0,
    totalKeystrokes: 0,
    errors: 0,
    elapsedMs: 1000,
    wasSkipped: true,
  });
  assert.equal(skipped.grade, 0);
  assert.equal(skipped.label, "Skipped");
});

test("translationMode: calculateSentenceXP scales with length, difficulty, and penalties", () => {
  // Beginner base calculation (50 chars = 10 words * 10 XP = 100 XP base)
  const xpBeginner = calculateSentenceXP({
    charCount: 50,
    difficulty: "beginner",
    accuracy: 95,
  });
  // 100 * 1.0 * 1.15 = 115
  assert.equal(xpBeginner, 115);

  // Advanced with 100% accuracy bonus
  const xpAdvanced = calculateSentenceXP({
    charCount: 50,
    difficulty: "advanced",
    accuracy: 100,
  });
  // 100 * 2.0 * 1.3 = 260
  assert.equal(xpAdvanced, 260);

  // Penalties for low accuracy and heavy errors
  const xpPenalized = calculateSentenceXP({
    charCount: 50,
    difficulty: "beginner",
    accuracy: 70,
    errors: 15,
  });
  // 100 * 1.0 * 0.7 = 70, minus min(40, 30) = 40 XP
  assert.equal(xpPenalized, 40);

  // Minimum floor: XP never falls below 10
  const xpFloor = calculateSentenceXP({
    charCount: 5,
    difficulty: "beginner",
    accuracy: 30,
    errors: 50,
  });
  assert.equal(xpFloor, 10);
});
