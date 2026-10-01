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
 * prioritizing multi-word phrases when phraseMode is enabled.
 */
export async function buildSessionQueue(
  category: string,
  sessionSize = 15,
  options: { phraseMode?: boolean } = {}
): Promise<SessionPlan> {
  const allWords = await db.words.where("category").equals(category).toArray();

  if (allWords.length === 0) {
    return { queue: [], dueCount: 0, newCount: 0, totalAvailable: 0 };
  }

  let candidates = allWords;

  if (options.phraseMode) {
    const phrasesOnly = allWords.filter((w) => w.word.includes(" "));
    if (phrasesOnly.length > 0) {
      const shuffledPhrases = shuffleArray(phrasesOnly);
      const remainingWords = shuffleArray(allWords.filter((w) => !w.word.includes(" ")));
      candidates = [...shuffledPhrases, ...remainingWords];
    }
  } else {
    candidates = shuffleArray(allWords);
  }

  const selectedBatch = candidates.slice(0, Math.min(sessionSize, candidates.length));

  const dueCount = selectedBatch.filter((w) => w.repetitions > 0 && isDue(w.nextReviewDate)).length;
  const newCount = selectedBatch.filter((w) => w.repetitions === 0).length;

  return {
    queue: selectedBatch,
    dueCount,
    newCount,
    totalAvailable: allWords.length,
  };
}
