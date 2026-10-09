import Dexie, { type Table } from "dexie";
import categoriesData from "@/data/categories.json";
import { getWordMetadata } from "./wordDictionary";

export interface WordRecord {
  id?: number;
  word: string;
  category: string;
  definition?: string;
  partOfSpeech?: string;
  hint?: string;
  phonetic?: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: string; // YYYY-MM-DD
  lastReviewedDate?: string;
  totalMistakes: number;
  totalReviews: number;
}

export interface CustomDeckRecord {
  id?: number;
  name: string;
  description: string;
  words: string[];
  createdAt: string;
}

export interface SessionHistoryRecord {
  id?: number;
  timestamp: string;
  wpm: number;
  accuracy: number;
  totalWords: number;
  errors: number;
  category: string;
  duration: number; // in seconds
  consistency?: number;
  rawWpm?: number;
}

export interface SentenceHistoryRecord {
  id?: number;
  sentenceId: string;
  type: "sentences" | "translation" | string;
  category: string;
  wpm: number;
  accuracy: number;
  errors: number;
  elapsedMs: number;
  timestamp: string;
  consistency?: number;
  rawWpm?: number;
}

export interface TranslationMasteryRecord {
  id?: number;
  sentenceId: string;
  repetitions: number;
  interval: number;
  easeFactor: number;
  dueDate: string;
  mistakes: number;
}

export interface MetaRecord {
  key: string;
  value: unknown;
}

export class KeyCasterDB extends Dexie {
  words!: Table<WordRecord, number>;
  customDecks!: Table<CustomDeckRecord, number>;
  sessionHistory!: Table<SessionHistoryRecord, number>;
  meta!: Table<MetaRecord, string>;
  sentenceHistory!: Table<SentenceHistoryRecord, number>;
  translationMastery!: Table<TranslationMasteryRecord, number>;

  constructor() {
    super("KeyCasterDB");
    this.version(1).stores({
      words: "++id, word, category, nextReviewDate, [category+nextReviewDate]",
      customDecks: "++id, name, createdAt",
      sessionHistory: "++id, timestamp, category",
      meta: "key",
    });
    this.version(4).stores({
      words: "++id, word, category, nextReviewDate, [category+nextReviewDate]",
      customDecks: "++id, name, createdAt",
      sessionHistory: "++id, timestamp, category",
      meta: "key",
      sentenceHistory: "++id, sentenceId, type, category, wpm, accuracy, errors, elapsedMs, timestamp",
      translationMastery: "++id, sentenceId, repetitions, interval, easeFactor, dueDate, mistakes",
    });
  }
}

export const db = new KeyCasterDB();

/**
 * Seed initial categories into IndexedDB if not already done.
 */
export async function seedDatabaseIfNeeded(): Promise<void> {
  try {
    const seedVersion = await db.meta.get("seed_version");
    if (seedVersion?.value === 4) {
      return;
    }

    const today = new Date().toISOString().split("T")[0];

    // Remove legacy categories so old words do not linger
    await db.words
      .where("category")
      .anyOf(["daily", "daily_1000", "cs_it_pro", "common_misspellings", "twitch_gaming", "gaming", "coding"])
      .delete();

    const initialWords: WordRecord[] = [];

    const createWordRecord = (rawWord: string, category: string): WordRecord => {
      const clean = rawWord.toLowerCase().trim();
      const meta = getWordMetadata(clean);
      return {
        word: clean,
        category,
        definition: meta?.definition,
        partOfSpeech: meta?.partOfSpeech,
        hint: meta?.hint,
        phonetic: meta?.phonetic,
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        nextReviewDate: today,
        totalMistakes: 0,
        totalReviews: 0,
      };
    };

    // 1. Daily
    for (const w of categoriesData.daily.words) {
      initialWords.push(createWordRecord(w, "daily"));
    }

    // 2. Common Misspellings
    for (const w of categoriesData.common_misspellings.words) {
      initialWords.push(createWordRecord(w, "common_misspellings"));
    }

    // 3. Gaming
    for (const w of categoriesData.gaming.words) {
      initialWords.push(createWordRecord(w, "gaming"));
    }

    // 4. Coding Syntax
    for (const w of categoriesData.coding.words) {
      initialWords.push(createWordRecord(w, "coding"));
    }

    await db.words.bulkAdd(initialWords);
    await db.meta.put({ key: "seed_version", value: 4 });
    await db.meta.put({ key: "seeded", value: true });
    console.log("KeyCasterDB seeded with enriched word metadata and definitions.");
  } catch (error) {
    console.error("Failed to seed database:", error);
  }
}
