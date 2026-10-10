import arabicSentencesData from "@/data/arabicSentences.json";
import englishSentencesData from "@/data/englishSentences.json";

export type SentenceCategory = "daily" | "tech" | "wisdom" | "business";
export type SentenceDifficulty = "beginner" | "intermediate" | "advanced";

export interface VocabularyCard {
  ar: string;
  en: string;
}

export interface BilingualSentence {
  id: string;
  category: SentenceCategory;
  difficulty: SentenceDifficulty;
  arabic: string;
  english: string;
  acceptedAlternatives: string[];
  literalMeaning: string;
  vocabularyCards: VocabularyCard[];
}

export type EnglishCategory = "conversation" | "programming" | "philosophy" | "literature";

export interface EnglishSentence {
  id: string;
  category: EnglishCategory | string;
  difficulty: SentenceDifficulty;
  text: string;
  author: string | null;
}

export interface SentenceFilterOptions {
  category?: SentenceCategory | string;
  difficulty?: SentenceDifficulty;
}

export interface SentenceMatchOptions {
  ignorePunctuation?: boolean;
  caseSensitive?: boolean;
  allowMissingTrailingPunctuation?: boolean;
}

export interface SentenceMatchResult {
  isMatch: boolean;
  isCanonical: boolean;
  matchedText?: string;
  normalizedTyped: string;
}

// In-memory typed lists loaded from JSON
const BILINGUAL_SENTENCES: BilingualSentence[] = arabicSentencesData as BilingualSentence[];
const ENGLISH_SENTENCES: EnglishSentence[] = englishSentencesData as EnglishSentence[];

/* ==========================================================================
   Bilingual Sentences Retrieval
   ========================================================================== */

/**
 * Returns all available bilingual sentence pairs.
 */
export function getAllBilingualSentences(): BilingualSentence[] {
  return [...BILINGUAL_SENTENCES];
}

/**
 * Returns bilingual sentences matching a specific category.
 */
export function getBilingualSentencesByCategory(category: SentenceCategory | string): BilingualSentence[] {
  return BILINGUAL_SENTENCES.filter((s) => s.category === category);
}

/**
 * Returns bilingual sentences matching a specific difficulty level.
 */
export function getBilingualSentencesByDifficulty(difficulty: SentenceDifficulty): BilingualSentence[] {
  return BILINGUAL_SENTENCES.filter((s) => s.difficulty === difficulty);
}

/**
 * Filters bilingual sentences by category and/or difficulty.
 */
export function filterBilingualSentences(filter?: SentenceFilterOptions): BilingualSentence[] {
  if (!filter) return getAllBilingualSentences();

  return BILINGUAL_SENTENCES.filter((s) => {
    if (filter.category && s.category !== filter.category) return false;
    if (filter.difficulty && s.difficulty !== filter.difficulty) return false;
    return true;
  });
}

/**
 * Selects a random bilingual sentence matching the given filter criteria.
 * Returns null if no sentences match.
 */
export function getRandomBilingualSentence(filter?: SentenceFilterOptions): BilingualSentence | null {
  const matches = filterBilingualSentences(filter);
  if (matches.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * matches.length);
  return matches[randomIndex];
}

/**
 * Retrieves a single bilingual sentence by its unique ID.
 */
export function getBilingualSentenceById(id: string): BilingualSentence | undefined {
  return BILINGUAL_SENTENCES.find((s) => s.id === id);
}

/* ==========================================================================
   English Sentences Retrieval
   ========================================================================== */

/**
 * Returns all available English practice sentences.
 */
export function getAllEnglishSentences(): EnglishSentence[] {
  return [...ENGLISH_SENTENCES];
}

/**
 * Returns English sentences matching a specific category.
 */
export function getEnglishSentencesByCategory(category: EnglishCategory | string): EnglishSentence[] {
  return ENGLISH_SENTENCES.filter((s) => s.category === category);
}

/**
 * Returns English sentences matching a specific difficulty level.
 */
export function getEnglishSentencesByDifficulty(difficulty: SentenceDifficulty): EnglishSentence[] {
  return ENGLISH_SENTENCES.filter((s) => s.difficulty === difficulty);
}

/**
 * Filters English sentences by category and/or difficulty.
 */
export function filterEnglishSentences(filter?: SentenceFilterOptions): EnglishSentence[] {
  if (!filter) return getAllEnglishSentences();

  return ENGLISH_SENTENCES.filter((s) => {
    if (filter.category && s.category !== filter.category) return false;
    if (filter.difficulty && s.difficulty !== filter.difficulty) return false;
    return true;
  });
}

/**
 * Selects a random English sentence matching the given filter criteria.
 * Returns null if no sentences match.
 */
export function getRandomEnglishSentence(filter?: SentenceFilterOptions): EnglishSentence | null {
  const matches = filterEnglishSentences(filter);
  if (matches.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * matches.length);
  return matches[randomIndex];
}

/**
 * Retrieves a single English sentence by its unique ID.
 */
export function getEnglishSentenceById(id: string): EnglishSentence | undefined {
  return ENGLISH_SENTENCES.find((s) => s.id === id);
}

/* ==========================================================================
   Text Normalization & Verification Logic
   ========================================================================== */

/**
 * Normalizes a sentence by:
 * - Unifying quotation marks and apostrophes (e.g. ’ -> ')
 * - Unifying dashes (—, – -> -)
 * - Collapsing whitespace
 * - Optionally lowercasing
 * - Optionally removing punctuation
 */
export function normalizeSentence(
  text: string,
  options?: { ignorePunctuation?: boolean; caseSensitive?: boolean; stripTrailingPunctuationOnly?: boolean }
): string {
  if (!text) return "";

  let res = text
    // Normalize Unicode apostrophes and single quotes
    .replace(/[\u2018\u2019\u201B\u02BC\u02BB']/g, "'")
    // Normalize Unicode double quotes
    .replace(/[\u201C\u201D\u00AB\u00BB"]/g, '"')
    // Normalize hyphens and dashes
    .replace(/[\u2013\u2014]/g, "-")
    // Collapse all whitespace (tabs, newlines, multi-spaces) to single space
    .replace(/\s+/g, " ")
    .trim();

  if (!options?.caseSensitive) {
    res = res.toLowerCase();
  }

  if (options?.ignorePunctuation) {
    // Strip punctuation marks, while preserving contraction apostrophes (e.g. how're, don't)
    res = res
      .replace(/[.,/#!$%^&*;:{}=\-_`~()?«»"“”]/g, "")
      .replace(/(^|\s)'|'(\s|$)/g, "$1$2")
      .replace(/\s+/g, " ")
      .trim();
  } else if (options?.stripTrailingPunctuationOnly) {
    res = res.replace(/[.?!,:;]+$/, "").trim();
  }

  return res;
}

/**
 * Strips all Arabic Tashkeel diacritics (Fatha, Damma, Kasra, Sukun, Tanwin, Shadda, etc.)
 */
export function stripArabicTashkeel(text: string): string {
  if (!text) return "";
  return text.replace(/[\u064B-\u065F\u0670]/g, "");
}

/**
 * Normalizes Arabic text for tolerant bilingual matching:
 * - Strips tashkeel diacritics
 * - Normalizes Alif variants (أ, إ, آ, ٱ -> ا)
 * - Normalizes Ta Marbuta (ة -> ه)
 * - Normalizes Alif Maqsura (ى -> ي)
 * - Collapses whitespace
 */
export function normalizeArabicText(text: string): string {
  if (!text) return "";
  return stripArabicTashkeel(text)
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Map of common English contractions to their expanded equivalents.
 */
export const CONTRACTIONS_MAP: Record<string, string> = {
  "don't": "do not",
  "doesn't": "does not",
  "didn't": "did not",
  "won't": "will not",
  "can't": "can not",
  "cannot": "can not",
  "couldn't": "could not",
  "shouldn't": "should not",
  "wouldn't": "would not",
  "isn't": "is not",
  "aren't": "are not",
  "wasn't": "was not",
  "weren't": "were not",
  "haven't": "have not",
  "hasn't": "has not",
  "hadn't": "had not",
  "i'm": "i am",
  "you're": "you are",
  "he's": "he is",
  "she's": "she is",
  "it's": "it is",
  "we're": "we are",
  "they're": "they are",
  "i'll": "i will",
  "you'll": "you will",
  "he'll": "he will",
  "she'll": "she will",
  "we'll": "we will",
  "they'll": "they will",
  "i've": "i have",
  "you've": "you have",
  "we've": "we have",
  "they've": "they have",
  "i'd": "i would",
  "you'd": "you would",
  "he'd": "he would",
  "she'd": "she would",
  "we'd": "we would",
  "they'd": "they would",
  "let's": "let us",
  "that's": "that is",
  "what's": "what is",
  "where's": "where is",
  "who's": "who is",
  "there's": "there is",
  "how's": "how is",
  "how're": "how are",
};

/**
 * Expands common English contractions in a string into their full forms.
 * Handles typographical apostrophes.
 */
export function expandContractions(text: string): string {
  if (!text) return "";
  let res = text.replace(/[\u2018\u2019\u201B\u02BC\u02BB']/g, "'");
  for (const [contraction, expanded] of Object.entries(CONTRACTIONS_MAP)) {
    const regex = new RegExp(`\\b${contraction}\\b`, "gi");
    res = res.replace(regex, expanded);
  }
  return res;
}

/**
 * Checks whether user typed input matches the target bilingual sentence.
 * Evaluates against both the canonical English sentence and accepted alternatives.
 * Handles case-insensitivity, typographical apostrophe variations, contractions, and optional punctuation tolerance.
 */
export function checkSentenceMatch(
  typedText: string,
  targetSentence: BilingualSentence,
  options: SentenceMatchOptions = {}
): SentenceMatchResult {
  const {
    caseSensitive = false,
    ignorePunctuation = false,
    allowMissingTrailingPunctuation = true,
  } = options;

  const normalizedTyped = normalizeSentence(typedText, {
    caseSensitive,
    ignorePunctuation,
  });

  if (!normalizedTyped) {
    return {
      isMatch: false,
      isCanonical: false,
      normalizedTyped: "",
    };
  }

  // 1. Check canonical English
  const normalizedCanonical = normalizeSentence(targetSentence.english, {
    caseSensitive,
    ignorePunctuation,
  });

  if (normalizedTyped === normalizedCanonical) {
    return {
      isMatch: true,
      isCanonical: true,
      matchedText: targetSentence.english,
      normalizedTyped,
    };
  }

  // 2. Check accepted alternatives
  for (const alt of targetSentence.acceptedAlternatives) {
    const normalizedAlt = normalizeSentence(alt, {
      caseSensitive,
      ignorePunctuation,
    });
    if (normalizedTyped === normalizedAlt) {
      return {
        isMatch: true,
        isCanonical: false,
        matchedText: alt,
        normalizedTyped,
      };
    }
  }

  // 3. Fallback: Check without trailing punctuation if permitted
  if (allowMissingTrailingPunctuation && !ignorePunctuation) {
    const typedWithoutTrailing = normalizeSentence(typedText, {
      caseSensitive,
      stripTrailingPunctuationOnly: true,
    });
    const canonicalWithoutTrailing = normalizeSentence(targetSentence.english, {
      caseSensitive,
      stripTrailingPunctuationOnly: true,
    });

    if (typedWithoutTrailing === canonicalWithoutTrailing) {
      return {
        isMatch: true,
        isCanonical: true,
        matchedText: targetSentence.english,
        normalizedTyped,
      };
    }

    for (const alt of targetSentence.acceptedAlternatives) {
      const altWithoutTrailing = normalizeSentence(alt, {
        caseSensitive,
        stripTrailingPunctuationOnly: true,
      });
      if (typedWithoutTrailing === altWithoutTrailing) {
        return {
          isMatch: true,
          isCanonical: false,
          matchedText: alt,
          normalizedTyped,
        };
      }
    }
  }

  // 4. Fallback: Check with contraction expansion (e.g. don't <-> do not, I'm <-> I am)
  const typedExpanded = expandContractions(normalizedTyped);
  const canonicalExpanded = expandContractions(normalizedCanonical);
  if (typedExpanded === canonicalExpanded) {
    return {
      isMatch: true,
      isCanonical: true,
      matchedText: targetSentence.english,
      normalizedTyped,
    };
  }

  for (const alt of targetSentence.acceptedAlternatives) {
    const normalizedAlt = normalizeSentence(alt, {
      caseSensitive,
      ignorePunctuation,
    });
    const altExpanded = expandContractions(normalizedAlt);
    if (typedExpanded === altExpanded) {
      return {
        isMatch: true,
        isCanonical: false,
        matchedText: alt,
        normalizedTyped,
      };
    }
  }

  // 5. Fallback: Check contraction expansion without trailing punctuation
  if (allowMissingTrailingPunctuation && !ignorePunctuation) {
    const typedNoTrailing = normalizeSentence(typedText, {
      caseSensitive,
      stripTrailingPunctuationOnly: true,
    });
    const typedNoTrailingExp = expandContractions(typedNoTrailing);

    const canonicalNoTrailing = normalizeSentence(targetSentence.english, {
      caseSensitive,
      stripTrailingPunctuationOnly: true,
    });
    const canonicalNoTrailingExp = expandContractions(canonicalNoTrailing);

    if (typedNoTrailingExp === canonicalNoTrailingExp) {
      return {
        isMatch: true,
        isCanonical: true,
        matchedText: targetSentence.english,
        normalizedTyped,
      };
    }

    for (const alt of targetSentence.acceptedAlternatives) {
      const altNoTrailing = normalizeSentence(alt, {
        caseSensitive,
        stripTrailingPunctuationOnly: true,
      });
      const altNoTrailingExp = expandContractions(altNoTrailing);
      if (typedNoTrailingExp === altNoTrailingExp) {
        return {
          isMatch: true,
          isCanonical: false,
          matchedText: alt,
          normalizedTyped,
        };
      }
    }
  }

  return {
    isMatch: false,
    isCanonical: false,
    normalizedTyped,
  };
}

/**
 * Boolean helper to quickly verify if user input matches canonical or alternative translations.
 */
export function isSentenceCorrect(
  typedText: string,
  sentence: BilingualSentence,
  options?: SentenceMatchOptions
): boolean {
  return checkSentenceMatch(typedText, sentence, options).isMatch;
}

/**
 * Checks whether user typed input matches the target EnglishSentence.
 */
export function isEnglishSentenceCorrect(
  typedText: string,
  target: EnglishSentence,
  options: SentenceMatchOptions = {}
): boolean {
  const {
    caseSensitive = false,
    ignorePunctuation = false,
    allowMissingTrailingPunctuation = true,
  } = options;

  const normalizedTyped = normalizeSentence(typedText, {
    caseSensitive,
    ignorePunctuation,
  });
  const normalizedTarget = normalizeSentence(target.text, {
    caseSensitive,
    ignorePunctuation,
  });

  if (normalizedTyped === normalizedTarget) {
    return true;
  }

  if (expandContractions(normalizedTyped) === expandContractions(normalizedTarget)) {
    return true;
  }

  if (allowMissingTrailingPunctuation && !ignorePunctuation) {
    const typedNoTrailing = normalizeSentence(typedText, {
      caseSensitive,
      stripTrailingPunctuationOnly: true,
    });
    const targetNoTrailing = normalizeSentence(target.text, {
      caseSensitive,
      stripTrailingPunctuationOnly: true,
    });
    if (typedNoTrailing === targetNoTrailing) {
      return true;
    }
    if (expandContractions(typedNoTrailing) === expandContractions(targetNoTrailing)) {
      return true;
    }
  }

  return false;
}

/* ==========================================================================
   Vocabulary & Hints
   ========================================================================== */

/**
 * Returns all vocabulary cards for a bilingual sentence.
 */
export function getVocabularyHints(sentence: BilingualSentence): VocabularyCard[] {
  return sentence.vocabularyCards || [];
}

/**
 * Returns a specific vocabulary hint card by index.
 */
export function getVocabularyHint(sentence: BilingualSentence, index = 0): VocabularyCard | null {
  if (!sentence.vocabularyCards || sentence.vocabularyCards.length === 0) {
    return null;
  }
  if (index < 0 || index >= sentence.vocabularyCards.length) {
    return null;
  }
  return sentence.vocabularyCards[index];
}

/**
 * Returns the literal word-for-word translation hint.
 */
export function getSentenceLiteralMeaning(sentence: BilingualSentence): string {
  return sentence.literalMeaning || "";
}

/**
 * Searches for a vocabulary card matching an Arabic or English word within a sentence.
 */
export function findVocabularyCardByWord(
  sentence: BilingualSentence,
  query: string
): VocabularyCard | undefined {
  if (!query || !sentence.vocabularyCards) return undefined;
  const q = query.trim().toLowerCase();
  return sentence.vocabularyCards.find(
    (card) => card.en.toLowerCase().includes(q) || card.ar.includes(query.trim())
  );
}

/* ==========================================================================
   Categories & Difficulties Metadata
   ========================================================================== */

export const BILINGUAL_CATEGORIES: readonly SentenceCategory[] = [
  "daily",
  "tech",
  "wisdom",
  "business",
] as const;

export const ENGLISH_CATEGORIES: readonly EnglishCategory[] = [
  "conversation",
  "programming",
  "philosophy",
  "literature",
] as const;

export const SENTENCE_DIFFICULTIES: readonly SentenceDifficulty[] = [
  "beginner",
  "intermediate",
  "advanced",
] as const;
