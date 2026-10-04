import dictionaryData from "@/data/wordDictionary.json";

export interface WordMetadata {
  definition?: string;
  partOfSpeech?: string;
  hint?: string;
  phonetic?: string;
  isHomophone?: boolean;
}

const HOMOPHONE_WORDS = new Set([
  "their", "there", "they're",
  "affect", "effect",
  "its", "it's",
  "your", "you're",
  "whose", "who's",
  "accept", "except",
  "advice", "advise",
  "principal", "principle",
  "compliment", "complement",
  "stationary", "stationery",
  "weather", "whether",
  "desert", "dessert",
  "past", "passed",
  "sight", "site", "cite",
  "conscience", "conscious",
  "precede", "proceed",
  "lose", "loose",
  "quiet", "quite",
]);

const DICT: Record<string, WordMetadata> = dictionaryData as Record<string, WordMetadata>;

export function getWordMetadata(rawWord: string): WordMetadata | null {
  if (!rawWord) return null;
  const normalized = rawWord.toLowerCase().trim();
  const entry = DICT[normalized];
  const isHomophone = HOMOPHONE_WORDS.has(normalized);

  if (entry) {
    return {
      ...entry,
      isHomophone,
    };
  }

  if (isHomophone) {
    return { isHomophone: true };
  }

  return null;
}
