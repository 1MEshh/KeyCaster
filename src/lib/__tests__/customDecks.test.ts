import test from "node:test";
import assert from "node:assert/strict";
import {
  STARTER_DECKS,
  exportDeckToJson,
  exportDeckToTxt,
  parseImportedDeck,
} from "@/lib/starterDecks";
import { sanitizeCustomDeck } from "@/lib/sanitize";

test("Starter Decks: provides valid starter decks with non-empty words conforming to regex", () => {
  assert.ok(STARTER_DECKS.length >= 4);

  for (const deck of STARTER_DECKS) {
    assert.ok(deck.name.length > 0);
    assert.ok(deck.words.length >= 10);

    // Verify each word in starter deck passes sanitization regex
    for (const word of deck.words) {
      assert.ok(/^[a-z]+([ -][a-z]+)*$/i.test(word));
    }

    // Verify deck can be sanitized without errors
    const sanitized = sanitizeCustomDeck(deck.name, deck.words.join("\n"));
    assert.strictEqual(sanitized.words.length, deck.words.length);
  }
});

test("Starter Decks: exports deck to valid JSON string and roundtrips via parseImportedDeck", () => {
  const deckName = "Test Custom Deck";
  const words = ["ephemeral", "ubiquitous", "serendipity"];
  const jsonStr = exportDeckToJson(deckName, words, "A test description");

  assert.ok(jsonStr.includes('"format": "keycaster_deck_v1"'));
  assert.ok(jsonStr.includes(deckName));

  const parsed = parseImportedDeck(jsonStr);
  assert.strictEqual(parsed.name, deckName);
  assert.deepStrictEqual(parsed.words, words);
});

test("Starter Decks: exports deck to TXT and parses back into clean word array", () => {
  const words = ["rhythm", "accommodate", "bureaucracy"];
  const txtStr = exportDeckToTxt(words);

  assert.strictEqual(txtStr, "rhythm\naccommodate\nbureaucracy");

  const parsed = parseImportedDeck(txtStr);
  assert.strictEqual(parsed.name, undefined);
  assert.deepStrictEqual(parsed.words, words);
});

test("Starter Decks: handles messy TXT with commas, whitespace, and invalid characters gracefully", () => {
  const messy = "  rhythm,  LIAISON \n\n 123badword,  bureaucracy  ";
  const parsed = parseImportedDeck(messy);
  assert.deepStrictEqual(parsed.words, ["rhythm", "liaison", "bureaucracy"]);
});

test("Starter Decks: throws an error when attempting to parse empty content", () => {
  assert.throws(() => parseImportedDeck("   \n  "), /File is empty\./);
});
