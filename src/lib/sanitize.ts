import type {
  WordRecord,
  CustomDeckRecord,
  SessionHistoryRecord,
  SentenceHistoryRecord,
  TranslationMasteryRecord,
} from "./db";

export const MAX_BACKUP_FILE_BYTES = 5 * 1024 * 1024; // 5 MB hard limit
export const MAX_DECK_NAME_LENGTH = 60;
export const MAX_WORDS_PER_DECK = 1000;
export const MAX_WORD_LENGTH = 45;

const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);

/**
 * Checks if a string or object contains forbidden prototype keys to prevent prototype pollution.
 */
export function hasPrototypePollution(obj: unknown, depth = 0): boolean {
  if (depth > 10) return true; // Prevent deeply nested stack overflow
  if (obj === null || typeof obj !== "object") return false;

  // Check prototype inheritance tampering
  const proto = Object.getPrototypeOf(obj);
  if (proto !== Object.prototype && proto !== Array.prototype && proto !== null) {
    return true;
  }

  // Check object's own property names
  const keys = Object.getOwnPropertyNames(obj);
  for (const key of keys) {
    if (FORBIDDEN_KEYS.has(key)) return true;
    const val = (obj as Record<string, unknown>)[key];
    if (val !== null && typeof val === "object") {
      if (hasPrototypePollution(val, depth + 1)) return true;
    }
  }

  return false;
}

/**
 * Strips HTML tags, control characters, and leading/trailing whitespace.
 */
export function sanitizeString(val: unknown, maxLen = 255): string {
  if (typeof val !== "string") return "";
  // Strip control chars (0x00-0x1F, 0x7F) and basic HTML markup
  return val
    .replace(/<[^>]*>/g, "")
    .replace(/[\x00-\x1F\x7F]/g, "")
    .trim()
    .slice(0, maxLen);
}

/**
 * Validates and sanitizes a custom deck name and word list.
 */
export function sanitizeCustomDeck(name: string, rawWords: string | string[]): {
  name: string;
  words: string[];
} {
  const cleanName = sanitizeString(name, MAX_DECK_NAME_LENGTH);
  if (!cleanName) {
    throw new Error("Deck name cannot be empty or contain only invalid characters.");
  }

  const wordList = Array.isArray(rawWords)
    ? rawWords
    : rawWords.split(/[\n,]+/);

  const seen = new Set<string>();
  const sanitizedWords: string[] = [];

  for (const raw of wordList) {
    if (sanitizedWords.length >= MAX_WORDS_PER_DECK) break;

    const cleaned = sanitizeString(raw, MAX_WORD_LENGTH)
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

    // Word must be alphabetic letters, spaces or hyphens (e.g., "state-of-the-art" or "ice cream")
    if (/^[a-z]+([ -][a-z]+)*$/i.test(cleaned) && !seen.has(cleaned)) {
      seen.add(cleaned);
      sanitizedWords.push(cleaned);
    }
  }

  if (sanitizedWords.length === 0) {
    throw new Error("Deck must contain at least one valid alphabetic word.");
  }

  return {
    name: cleanName,
    words: sanitizedWords,
  };
}

export interface ValidatedBackupPayload {
  version: number;
  exportedAt: string;
  words: WordRecord[];
  customDecks: CustomDeckRecord[];
  sessionHistory: SessionHistoryRecord[];
  sentenceHistory: SentenceHistoryRecord[];
  translationMastery: TranslationMasteryRecord[];
}

/**
 * Validates a parsed backup object with defensive schema checks and prototype pollution guards.
 */
export function validateBackupPayload(raw: unknown): ValidatedBackupPayload {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Invalid backup: Root payload must be an object.");
  }

  if (hasPrototypePollution(raw)) {
    throw new Error("Security exception: Backup payload contains forbidden prototype keys.");
  }

  const data = raw as Record<string, unknown>;

  if (typeof data.version !== "number" || data.version < 1) {
    throw new Error("Invalid backup: Missing or invalid version number.");
  }

  const exportedAt = typeof data.exportedAt === "string" ? sanitizeString(data.exportedAt, 50) : new Date().toISOString();

  // Validate words
  if (!Array.isArray(data.words)) {
    throw new Error("Invalid backup: 'words' must be an array.");
  }

  const words: WordRecord[] = [];
  for (const item of data.words) {
    if (item === null || typeof item !== "object") continue;
    const w = item as Record<string, unknown>;
    const wordStr = sanitizeString(w.word, 100);
    const category = sanitizeString(w.category, 100);
    if (!wordStr || !category) continue;

    words.push({
      word: wordStr,
      category,
      definition: w.definition ? sanitizeString(w.definition, 500) : undefined,
      partOfSpeech: w.partOfSpeech ? sanitizeString(w.partOfSpeech, 50) : undefined,
      hint: w.hint ? sanitizeString(w.hint, 500) : undefined,
      phonetic: w.phonetic ? sanitizeString(w.phonetic, 100) : undefined,
      easeFactor: typeof w.easeFactor === "number" && !isNaN(w.easeFactor) ? Math.max(1.3, Math.min(5.0, w.easeFactor)) : 2.5,
      interval: typeof w.interval === "number" && !isNaN(w.interval) ? Math.max(0, Math.floor(w.interval)) : 0,
      repetitions: typeof w.repetitions === "number" && !isNaN(w.repetitions) ? Math.max(0, Math.floor(w.repetitions)) : 0,
      nextReviewDate: typeof w.nextReviewDate === "string" ? sanitizeString(w.nextReviewDate, 20) : new Date().toISOString().split("T")[0],
      lastReviewedDate: typeof w.lastReviewedDate === "string" ? sanitizeString(w.lastReviewedDate, 30) : undefined,
      totalMistakes: typeof w.totalMistakes === "number" && !isNaN(w.totalMistakes) ? Math.max(0, Math.floor(w.totalMistakes)) : 0,
      totalReviews: typeof w.totalReviews === "number" && !isNaN(w.totalReviews) ? Math.max(0, Math.floor(w.totalReviews)) : 0,
    });
  }

  // Validate customDecks
  const customDecks: CustomDeckRecord[] = [];
  if (Array.isArray(data.customDecks)) {
    for (const item of data.customDecks) {
      if (item === null || typeof item !== "object") continue;
      const d = item as Record<string, unknown>;
      const name = sanitizeString(d.name, MAX_DECK_NAME_LENGTH);
      if (!name) continue;

      const wordsArr: string[] = [];
      if (Array.isArray(d.words)) {
        for (const w of d.words) {
          if (wordsArr.length >= MAX_WORDS_PER_DECK) break;
          const cleanW = sanitizeString(w, MAX_WORD_LENGTH);
          if (cleanW) wordsArr.push(cleanW);
        }
      }

      customDecks.push({
        name,
        description: sanitizeString(d.description, 200) || `Custom deck ${name}`,
        words: wordsArr,
        createdAt: typeof d.createdAt === "string" ? sanitizeString(d.createdAt, 30) : new Date().toISOString().split("T")[0],
      });
    }
  }

  // Validate sessionHistory
  const sessionHistory: SessionHistoryRecord[] = [];
  if (Array.isArray(data.sessionHistory)) {
    for (const item of data.sessionHistory) {
      if (item === null || typeof item !== "object") continue;
      const s = item as Record<string, unknown>;
      sessionHistory.push({
        timestamp: typeof s.timestamp === "string" ? sanitizeString(s.timestamp, 40) : new Date().toISOString(),
        wpm: typeof s.wpm === "number" && !isNaN(s.wpm) ? Math.max(0, Math.min(500, s.wpm)) : 0,
        accuracy: typeof s.accuracy === "number" && !isNaN(s.accuracy) ? Math.max(0, Math.min(100, s.accuracy)) : 0,
        totalWords: typeof s.totalWords === "number" && !isNaN(s.totalWords) ? Math.max(0, Math.floor(s.totalWords)) : 0,
        errors: typeof s.errors === "number" && !isNaN(s.errors) ? Math.max(0, Math.floor(s.errors)) : 0,
        category: sanitizeString(s.category, 100) || "general",
        duration: typeof s.duration === "number" && !isNaN(s.duration) ? Math.max(0, s.duration) : 0,
      });
    }
  }

  // Validate sentenceHistory
  const sentenceHistory: SentenceHistoryRecord[] = [];
  if (Array.isArray(data.sentenceHistory)) {
    for (const item of data.sentenceHistory) {
      if (item === null || typeof item !== "object") continue;
      const sh = item as Record<string, unknown>;
      const sentenceId = sanitizeString(sh.sentenceId, 100);
      if (!sentenceId) continue;
      sentenceHistory.push({
        sentenceId,
        type: sanitizeString(sh.type, 50) || "sentences",
        category: sanitizeString(sh.category, 50) || "general",
        wpm: typeof sh.wpm === "number" && !isNaN(sh.wpm) ? Math.max(0, Math.min(500, sh.wpm)) : 0,
        accuracy: typeof sh.accuracy === "number" && !isNaN(sh.accuracy) ? Math.max(0, Math.min(100, sh.accuracy)) : 0,
        errors: typeof sh.errors === "number" && !isNaN(sh.errors) ? Math.max(0, Math.floor(sh.errors)) : 0,
        elapsedMs: typeof sh.elapsedMs === "number" && !isNaN(sh.elapsedMs) ? Math.max(0, Math.floor(sh.elapsedMs)) : 0,
        timestamp: typeof sh.timestamp === "string" ? sanitizeString(sh.timestamp, 40) : new Date().toISOString(),
      });
    }
  }

  // Validate translationMastery
  const translationMastery: TranslationMasteryRecord[] = [];
  if (Array.isArray(data.translationMastery)) {
    for (const item of data.translationMastery) {
      if (item === null || typeof item !== "object") continue;
      const tm = item as Record<string, unknown>;
      const sentenceId = sanitizeString(tm.sentenceId, 100);
      if (!sentenceId) continue;
      translationMastery.push({
        sentenceId,
        repetitions: typeof tm.repetitions === "number" && !isNaN(tm.repetitions) ? Math.max(0, Math.floor(tm.repetitions)) : 0,
        interval: typeof tm.interval === "number" && !isNaN(tm.interval) ? Math.max(0, Math.floor(tm.interval)) : 0,
        easeFactor: typeof tm.easeFactor === "number" && !isNaN(tm.easeFactor) ? Math.max(1.3, Math.min(5.0, tm.easeFactor)) : 2.5,
        dueDate: typeof tm.dueDate === "string" ? sanitizeString(tm.dueDate, 20) : new Date().toISOString().split("T")[0],
        mistakes: typeof tm.mistakes === "number" && !isNaN(tm.mistakes) ? Math.max(0, Math.floor(tm.mistakes)) : 0,
      });
    }
  }

  return {
    version: data.version,
    exportedAt,
    words,
    customDecks,
    sessionHistory,
    sentenceHistory,
    translationMastery,
  };
}
