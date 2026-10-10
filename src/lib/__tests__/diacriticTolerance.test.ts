import test from "node:test";
import assert from "node:assert/strict";
import { stripArabicTashkeel, normalizeArabicText } from "../sentenceDictionary";
import { areCharsEquivalent } from "../../store/useSentenceStore";

test("diacriticTolerance: stripArabicTashkeel removes all harakat / tashkeel marks", () => {
  // "السَّلَامُ عَلَيْكُمْ" with Fatha, Shadda, Damma, Sukun
  const withTashkeel = "السَّلَامُ عَلَيْكُمْ";
  const stripped = stripArabicTashkeel(withTashkeel);
  assert.equal(stripped, "السلام عليكم");
});

test("diacriticTolerance: normalizeArabicText normalizes alif variants, ta-marbuta, and alif-maqsura", () => {
  // "أَنْتَ إِلَى الحَيَاةِ" -> "انت الي الحياه"
  const input = "أَنْتَ إِلَى الحَيَاةِ";
  const normalized = normalizeArabicText(input);
  assert.equal(normalized, "انت الي الحياه");
});

test("diacriticTolerance: areCharsEquivalent handles Arabic Alif, Ta-Marbuta, and Ya variants", () => {
  // Alif variants
  assert.equal(areCharsEquivalent("ا", "أ"), true);
  assert.equal(areCharsEquivalent("إ", "ا"), true);
  assert.equal(areCharsEquivalent("آ", "ا"), true);

  // Ta-Marbuta and Ha
  assert.equal(areCharsEquivalent("ه", "ة"), true);
  assert.equal(areCharsEquivalent("ة", "ه"), true);

  // Ya and Alif Maqsura
  assert.equal(areCharsEquivalent("ي", "ى"), true);
  assert.equal(areCharsEquivalent("ى", "ي"), true);

  // Unrelated letters do not match
  assert.equal(areCharsEquivalent("ب", "ت"), false);
});

test("diacriticTolerance: areCharsEquivalent handles curly quotes, dashes, and non-breaking space", () => {
  assert.equal(areCharsEquivalent("'", "’"), true);
  assert.equal(areCharsEquivalent("'", "‘"), true);
  assert.equal(areCharsEquivalent('"', "“"), true);
  assert.equal(areCharsEquivalent('"', "”"), true);
  assert.equal(areCharsEquivalent("-", "—"), true);
  assert.equal(areCharsEquivalent("-", "–"), true);
  assert.equal(areCharsEquivalent(" ", "\u00A0"), true);
});
