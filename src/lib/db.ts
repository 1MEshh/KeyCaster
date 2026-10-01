import Dexie, { type Table } from "dexie";
import categoriesData from "@/data/categories.json";

export interface WordRecord {
  id?: number;
  word: string;
  category: string;
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

  constructor() {
    super("KeyCasterDB");
    this.version(1).stores({
      words: "++id, word, category, nextReviewDate, [category+nextReviewDate]",
      customDecks: "++id, name, createdAt",
      sessionHistory: "++id, timestamp, category",
      meta: "key",
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
    if (seedVersion?.value === 3) {
      return;
    }

    const today = new Date().toISOString().split("T")[0];

    // Remove legacy categories so old words do not linger
    await db.words
      .where("category")
      .anyOf(["daily", "daily_1000", "cs_it_pro", "common_misspellings", "twitch_gaming", "gaming", "coding"])
      .delete();

    const initialWords: WordRecord[] = [];

    // 1. Daily (500 focus words, adverbs & phrases)
    for (const w of categoriesData.daily.words) {
      initialWords.push({
        word: w.toLowerCase().trim(),
        category: "daily",
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        nextReviewDate: today,
        totalMistakes: 0,
        totalReviews: 0,
      });
    }

    // 2. Common Misspellings (250+ tricky words)
    for (const w of categoriesData.common_misspellings.words) {
      initialWords.push({
        word: w.toLowerCase().trim(),
        category: "common_misspellings",
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        nextReviewDate: today,
        totalMistakes: 0,
        totalReviews: 0,
      });
    }

    // 3. Gaming
    for (const w of categoriesData.gaming.words) {
      initialWords.push({
        word: w.toLowerCase().trim(),
        category: "gaming",
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        nextReviewDate: today,
        totalMistakes: 0,
        totalReviews: 0,
      });
    }

    // 4. Coding Syntax
    for (const w of categoriesData.coding.words) {
      initialWords.push({
        word: w.toLowerCase().trim(),
        category: "coding",
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        nextReviewDate: today,
        totalMistakes: 0,
        totalReviews: 0,
      });
    }

    await db.words.bulkAdd(initialWords);
    await db.meta.put({ key: "seed_version", value: 3 });
    await db.meta.put({ key: "seeded", value: true });
    console.log("KeyCasterDB seeded with Daily, Common Misspellings, Gaming, and Coding decks.");
  } catch (error) {
    console.error("Failed to seed database:", error);
  }
}
