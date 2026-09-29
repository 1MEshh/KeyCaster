import { db, type WordRecord } from "./db";
import { isDue } from "./sm2";

export interface SessionPlan {
  queue: WordRecord[];
  dueCount: number;
  newCount: number;
  totalAvailable: number;
}

/**
 * Fisher-Yates unbiased array shuffle
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Builds a practice session using Pure Random Practice:
 * Draws completely random words from the deck (shuffled),
 * while continuing to record SRS stats and intervals in IndexedDB.
 */
export async function buildSessionQueue(
  category: string,
  sessionSize = 15
): Promise<SessionPlan> {
  const allWords = await db.words.where("category").equals(category).toArray();

  if (allWords.length === 0) {
    return { queue: [], dueCount: 0, newCount: 0, totalAvailable: 0 };
  }

  // Completely shuffle the entire category pool
  const shuffled = shuffleArray(allWords);
  const selectedBatch = shuffled.slice(0, Math.min(sessionSize, allWords.length));

  const dueCount = selectedBatch.filter((w) => w.repetitions > 0 && isDue(w.nextReviewDate)).length;
  const newCount = selectedBatch.filter((w) => w.repetitions === 0).length;

  return {
    queue: selectedBatch,
    dueCount,
    newCount,
    totalAvailable: allWords.length,
  };
}
