import test from "node:test";
import assert from "node:assert/strict";
import {
  hasPrototypePollution,
  sanitizeString,
  sanitizeCustomDeck,
  validateBackupPayload,
  MAX_DECK_NAME_LENGTH,
  MAX_WORDS_PER_DECK,
} from "../sanitize";

test("hasPrototypePollution: detects dangerous prototype injection attempts", () => {
  assert.equal(hasPrototypePollution({ a: 1, b: "clean" }), false);
  assert.equal(hasPrototypePollution({ nested: { fine: true } }), false);

  // Prototype pollution keys
  assert.equal(hasPrototypePollution({ ["__proto__"]: { admin: true } }), true);
  assert.equal(hasPrototypePollution(JSON.parse('{"__proto__": {"admin": true}}')), true);
  assert.equal(hasPrototypePollution({ constructor: { prototype: {} } }), true);
  assert.equal(hasPrototypePollution({ prototype: { poll: true } }), true);

  // Nested pollution
  assert.equal(hasPrototypePollution({ payload: { nested: { ["__proto__"]: 123 } } }), true);
  assert.equal(hasPrototypePollution(JSON.parse('{"payload": {"nested": {"__proto__": 123}}}')), true);
});

test("sanitizeString: removes HTML tags, control chars, and respects max length", () => {
  const dirty = "<script>alert('xss')</script>Hello\x00World<b>!</b>";
  const clean = sanitizeString(dirty, 20);
  assert.equal(clean, "alert('xss')HelloWor");
  assert.ok(!clean.includes("<"));
  assert.ok(!clean.includes(">"));
  assert.ok(!clean.includes("\x00"));
});

test("sanitizeCustomDeck: validates and caps deck name and word list", () => {
  const deck = sanitizeCustomDeck("  SAT Vocabulary & Idioms  ", [
    "abandon",
    "benevolent",
    "abandon", // duplicate
    "state-of-the-art",
    "123badword", // invalid
    "ice cream",
  ]);

  assert.equal(deck.name, "SAT Vocabulary & Idioms");
  assert.deepEqual(deck.words, ["abandon", "benevolent", "state-of-the-art", "ice cream"]);

  // Test name cap
  const longName = "A".repeat(100);
  const cappedDeck = sanitizeCustomDeck(longName, ["validword"]);
  assert.equal(cappedDeck.name.length, MAX_DECK_NAME_LENGTH);

  // Test word count cap (exceeding 1000 words) with valid alphabetic strings
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  const manyWords = Array.from({ length: 1200 }, (_, i) => {
    const c1 = alphabet[Math.floor(i / (26 * 26)) % 26];
    const c2 = alphabet[Math.floor(i / 26) % 26];
    const c3 = alphabet[i % 26];
    return `word${c1}${c2}${c3}`;
  });
  const cappedWordsDeck = sanitizeCustomDeck("Big Deck", manyWords);
  assert.equal(cappedWordsDeck.words.length, MAX_WORDS_PER_DECK);

  // Test invalid inputs throwing
  assert.throws(() => sanitizeCustomDeck("   ", ["word"]), /Deck name cannot be empty/);
  assert.throws(() => sanitizeCustomDeck("Valid Name", ["123", "!@#$"]), /Deck must contain at least one/);
});

test("validateBackupPayload: enforces schema integrity and prototype security across all 5 stores", () => {
  // Reject non-objects
  assert.throws(() => validateBackupPayload(null), /Root payload must be an object/);
  assert.throws(() => validateBackupPayload(["array"]), /Root payload must be an object/);
  assert.throws(() => validateBackupPayload("string"), /Root payload must be an object/);

  // Reject prototype pollution in JSON payload
  const jsonPolluted = JSON.parse('{"version": 4, "words": [], "__proto__": {"injected": true}}');
  assert.throws(() => validateBackupPayload(jsonPolluted), /Security exception: Backup payload contains forbidden prototype keys/);

  // Reject missing version or missing words array
  assert.throws(() => validateBackupPayload({ version: 0, words: [] }), /Missing or invalid version number/);
  assert.throws(() => validateBackupPayload({ version: 1 }), /'words' must be an array/);

  // Valid payload with all 5 stores
  const validRaw = {
    version: 4,
    exportedAt: "2026-10-08T00:00:00.000Z",
    words: [
      {
        word: "  resilient  ",
        category: "vocabulary",
        easeFactor: 99.9, // Out of bounds -> should clamp to 5.0
        interval: -5,     // Negative -> should clamp to 0
        repetitions: 2,
        nextReviewDate: "2026-10-15",
        totalMistakes: 1,
        totalReviews: 3,
      },
    ],
    customDecks: [
      {
        name: "<b>Science Deck</b>",
        description: "Terms",
        words: ["atom", "molecule"],
        createdAt: "2026-10-08",
      },
    ],
    sessionHistory: [
      {
        timestamp: "2026-10-08T01:00:00.000Z",
        wpm: 9999, // Out of bounds -> should clamp to 500
        accuracy: -20, // Negative -> should clamp to 0
        totalWords: 25,
        errors: 2,
        category: "science",
        duration: 30,
      },
    ],
    sentenceHistory: [
      {
        sentenceId: "sent_001",
        type: "translation",
        category: "business",
        wpm: 75,
        accuracy: 98,
        errors: 1,
        elapsedMs: 12000,
        timestamp: "2026-10-08T01:10:00.000Z",
      },
    ],
    translationMastery: [
      {
        sentenceId: "sent_001",
        repetitions: 3,
        interval: 10,
        easeFactor: 0.5, // Below minimum 1.3 -> should clamp to 1.3
        dueDate: "2026-10-18",
        mistakes: 0,
      },
    ],
  };

  const validated = validateBackupPayload(validRaw);
  assert.equal(validated.version, 4);
  assert.equal(validated.words.length, 1);
  assert.equal(validated.words[0].word, "resilient");
  assert.equal(validated.words[0].easeFactor, 5.0);
  assert.equal(validated.words[0].interval, 0);

  assert.equal(validated.customDecks.length, 1);
  assert.equal(validated.customDecks[0].name, "Science Deck"); // stripped <b>

  assert.equal(validated.sessionHistory.length, 1);
  assert.equal(validated.sessionHistory[0].wpm, 500);
  assert.equal(validated.sessionHistory[0].accuracy, 0);

  assert.equal(validated.sentenceHistory.length, 1);
  assert.equal(validated.sentenceHistory[0].sentenceId, "sent_001");

  assert.equal(validated.translationMastery.length, 1);
  assert.equal(validated.translationMastery[0].easeFactor, 1.3);
});
