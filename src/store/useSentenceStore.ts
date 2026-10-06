import { create } from "zustand";
import {
  type BilingualSentence,
  type EnglishSentence,
  type SentenceDifficulty,
  filterBilingualSentences,
  filterEnglishSentences,
  getAllBilingualSentences,
  getAllEnglishSentences,
} from "@/lib/sentenceDictionary";
import { db } from "@/lib/db";
import { calculateSM2, getNextReviewDateString } from "@/lib/sm2";
import {
  gradeSentence,
  calculateSentenceWpm,
  calculateSentenceAccuracy,
  calculateSentenceXP,
} from "@/lib/sentenceGrader";
import { useProfileStore } from "@/store/useProfileStore";
import type { StopOnError, ConfidenceMode } from "@/store/useSettingsStore";

export interface SentenceLetter {
  char: string;
  state: "pending" | "correct" | "error";
  typedChar?: string;
}

export interface SentenceWord {
  word: string;
  letters: SentenceLetter[];
  isCompleted: boolean;
  hasErrors: boolean;
}

export interface SentenceStats {
  wpm: number;
  accuracy: number;
  errors: number;
  elapsedMs: number;
}

export type PracticeType = "sentences" | "translation";
export type PracticeDifficulty = "beginner" | "intermediate" | "advanced" | "all";

export interface SentenceState {
  practiceType: PracticeType;
  activeCategory: string;
  activeDifficulty: PracticeDifficulty;
  currentSentence: EnglishSentence | BilingualSentence | null;
  sentenceQueue: Array<EnglishSentence | BilingualSentence>;
  queueIndex: number;
  currentWordIndex: number;
  currentLetterIndex: number;
  words: SentenceWord[];
  isSessionActive: boolean;
  isSentenceComplete: boolean;
  isSessionComplete: boolean;
  showVocabHint: boolean;
  isSpeaking: boolean;
  stats: SentenceStats;

  // Actions
  initSentenceSession: (
    practiceType: PracticeType,
    category?: string,
    difficulty?: PracticeDifficulty
  ) => Promise<void>;
  handleKeyStroke: (
    key: string,
    stopOnError: StopOnError,
    confidenceMode: ConfidenceMode
  ) => Promise<void>;
  handleSpace: (stopOnError: StopOnError) => Promise<void>;
  handleBackspace: (confidenceMode: ConfidenceMode) => void;
  toggleVocabHint: () => void;
  setShowVocabHint: (show: boolean) => void;
  setIsSpeaking: (isSpeaking: boolean) => void;
  nextSentence: () => void;
  skipSentence: () => Promise<void>;
  restartSession: () => void;
}

/**
 * Normalizes typographical apostrophes, quotes, and dashes for resilient keyboard matching.
 */
export function areCharsEquivalent(input: string, target: string): boolean {
  if (input === target) return true;
  if (/['’‘`]/.test(target) && /['`]/.test(input)) return true;
  if (/["“”«»]/.test(target) && input === '"') return true;
  if (/[-–—]/.test(target) && input === "-") return true;
  return false;
}

/**
 * Extracts target English text from either an EnglishSentence or a BilingualSentence.
 */
export function getTargetText(sentence: EnglishSentence | BilingualSentence | null): string {
  if (!sentence) return "";
  if ("text" in sentence) {
    return sentence.text;
  }
  if ("english" in sentence) {
    return sentence.english;
  }
  return "";
}

/**
 * Tokenizes sentence text into words with individual letter tracking.
 */
export function tokenizeSentence(text: string): SentenceWord[] {
  if (!text || !text.trim()) return [];
  const words = text.trim().split(/\s+/);
  return words.map((w) => ({
    word: w,
    letters: w.split("").map((c) => ({
      char: c,
      state: "pending" as const,
    })),
    isCompleted: false,
    hasErrors: false,
  }));
}

// Track execution timings and keystroke counts without re-render thrash
let sentenceStartTime: number | null = null;
let totalKeystrokesCount = 0;
let correctKeystrokesCount = 0;
let backspacesCount = 0;

export const useSentenceStore = create<SentenceState>((set, get) => ({
  practiceType: "sentences",
  activeCategory: "all",
  activeDifficulty: "all",
  currentSentence: null,
  sentenceQueue: [],
  queueIndex: 0,
  currentWordIndex: 0,
  currentLetterIndex: 0,
  words: [],
  isSessionActive: false,
  isSentenceComplete: false,
  isSessionComplete: false,
  showVocabHint: false,
  isSpeaking: false,
  stats: {
    wpm: 0,
    accuracy: 100,
    errors: 0,
    elapsedMs: 0,
  },

  initSentenceSession: async (
    practiceType: PracticeType,
    category = "all",
    difficulty: PracticeDifficulty = "all"
  ) => {
    let queue: Array<EnglishSentence | BilingualSentence> = [];

    const difficultyFilter: SentenceDifficulty | undefined =
      difficulty === "all" ? undefined : difficulty;

    if (practiceType === "translation") {
      let matches = filterBilingualSentences({
        category: category === "all" ? undefined : category,
        difficulty: difficultyFilter,
      });
      if (matches.length === 0) {
        matches = getAllBilingualSentences();
      }
      // Shuffle and pick 5 sentences
      queue = [...matches].sort(() => Math.random() - 0.5).slice(0, 5);
    } else {
      let matches = filterEnglishSentences({
        category: category === "all" ? undefined : category,
        difficulty: difficultyFilter,
      });
      if (matches.length === 0) {
        matches = getAllEnglishSentences();
      }
      queue = [...matches].sort(() => Math.random() - 0.5).slice(0, 5);
    }

    const firstSentence = queue[0] || null;
    const targetText = getTargetText(firstSentence);
    const tokenizedWords = tokenizeSentence(targetText);

    sentenceStartTime = null;
    totalKeystrokesCount = 0;
    correctKeystrokesCount = 0;
    backspacesCount = 0;

    set({
      practiceType,
      activeCategory: category,
      activeDifficulty: difficulty,
      sentenceQueue: queue,
      queueIndex: 0,
      currentSentence: firstSentence,
      currentWordIndex: 0,
      currentLetterIndex: 0,
      words: tokenizedWords,
      isSessionActive: queue.length > 0,
      isSentenceComplete: false,
      isSessionComplete: queue.length === 0,
      showVocabHint: false,
      isSpeaking: false,
      stats: {
        wpm: 0,
        accuracy: 100,
        errors: 0,
        elapsedMs: 0,
      },
    });
  },

  handleKeyStroke: async (
    key: string,
    stopOnError: StopOnError,
    confidenceMode: ConfidenceMode
  ) => {
    const {
      isSessionActive,
      isSentenceComplete,
      isSessionComplete,
      words,
      currentWordIndex,
      currentLetterIndex,
      currentSentence,
      practiceType,
      activeCategory,
      stats,
    } = get();

    if (!isSessionActive || isSentenceComplete || isSessionComplete || !currentSentence) {
      return;
    }

    // Ignore non-printable or multi-character keys (Enter, Esc, Tab handled separately)
    if (key.length !== 1) return;

    // Start timer on first keystroke
    if (!sentenceStartTime) {
      sentenceStartTime = Date.now();
    }

    totalKeystrokesCount += 1;

    const newWords = words.map((w, wIdx) => {
      if (wIdx !== currentWordIndex) return w;
      return {
        ...w,
        letters: w.letters.map((l) => ({ ...l })),
      };
    });

    const activeWord = newWords[currentWordIndex];
    if (!activeWord) return;

    // Handle typing past the original word length
    if (currentLetterIndex >= activeWord.letters.length) {
      if (stopOnError === "letter") {
        return;
      }
      // In word/off stop mode, append extra error character
      activeWord.letters.push({
        char: key,
        state: "error",
        typedChar: key,
      });
      activeWord.hasErrors = true;

      const newErrors = stats.errors + 1;
      const curElapsed = Math.max(1, Date.now() - (sentenceStartTime || Date.now()));
      const curAcc = calculateSentenceAccuracy(correctKeystrokesCount, totalKeystrokesCount);
      const curWpm = calculateSentenceWpm(correctKeystrokesCount, curElapsed);

      set({
        words: newWords,
        currentLetterIndex: currentLetterIndex + 1,
        stats: {
          wpm: curWpm,
          accuracy: curAcc,
          errors: newErrors,
          elapsedMs: curElapsed,
        },
      });
      return;
    }

    const currentLetter = activeWord.letters[currentLetterIndex];
    const isCorrect = areCharsEquivalent(key, currentLetter.char);

    if (isCorrect) {
      correctKeystrokesCount += 1;
      currentLetter.state = "correct";
      currentLetter.typedChar = key;

      const nextLetterIdx = currentLetterIndex + 1;
      const isWordFinished = nextLetterIdx >= activeWord.letters.length;
      const isLastWord = currentWordIndex >= newWords.length - 1;

      const curElapsed = Math.max(1, Date.now() - (sentenceStartTime || Date.now()));
      const curAcc = calculateSentenceAccuracy(correctKeystrokesCount, totalKeystrokesCount);
      const targetText = getTargetText(currentSentence);
      const curWpm = calculateSentenceWpm(targetText.length, curElapsed);

      if (isWordFinished && isLastWord) {
        // Entire sentence completed!
        activeWord.isCompleted = true;

        // Persist sentence history & SM-2 data
        const finalElapsed = Math.max(200, Date.now() - (sentenceStartTime || Date.now()));
        const finalWpm = calculateSentenceWpm(targetText.length, finalElapsed);
        const finalAcc = calculateSentenceAccuracy(correctKeystrokesCount, totalKeystrokesCount);

        try {
          await db.sentenceHistory.add({
            sentenceId: currentSentence.id,
            type: practiceType,
            category: activeCategory,
            wpm: finalWpm,
            accuracy: finalAcc,
            errors: stats.errors,
            elapsedMs: finalElapsed,
            timestamp: new Date().toISOString(),
          });

          if (practiceType === "translation") {
            const mastery = await db.translationMastery
              .where("sentenceId")
              .equals(currentSentence.id)
              .first();

            const prevEase = mastery?.easeFactor ?? 2.5;
            const prevInterval = mastery?.interval ?? 0;
            const prevReps = mastery?.repetitions ?? 0;
            const prevMistakes = mastery?.mistakes ?? 0;

            const gradeResult = gradeSentence({
              charCount: targetText.length,
              correctChars: correctKeystrokesCount,
              totalKeystrokes: totalKeystrokesCount,
              errors: stats.errors,
              backspaces: backspacesCount,
              elapsedMs: finalElapsed,
            });

            const sm2 = calculateSM2(
              gradeResult.grade,
              prevEase,
              prevInterval,
              prevReps,
              prevMistakes + stats.errors
            );

            const dueDate = getNextReviewDateString(sm2.interval);

            if (mastery?.id) {
              await db.translationMastery.update(mastery.id, {
                repetitions: sm2.repetitions,
                interval: sm2.interval,
                easeFactor: sm2.easeFactor,
                dueDate,
                mistakes: prevMistakes + stats.errors,
              });
            } else {
              await db.translationMastery.add({
                sentenceId: currentSentence.id,
                repetitions: sm2.repetitions,
                interval: sm2.interval,
                easeFactor: sm2.easeFactor,
                dueDate,
                mistakes: stats.errors,
              });
            }
          }

          // Gamification XP
          const earnedXp = calculateSentenceXP({
            charCount: targetText.length,
            difficulty: currentSentence.difficulty,
            accuracy: finalAcc,
            errors: stats.errors,
          });

          useProfileStore.getState().recordSessionCompletion({
            wpm: finalWpm,
            accuracy: finalAcc,
            totalWords: newWords.length,
            category: activeCategory,
            blindMode: false,
          });
        } catch (err) {
          console.error("Failed to persist sentence completion:", err);
        }

        set({
          words: newWords,
          currentLetterIndex: nextLetterIdx,
          isSentenceComplete: true,
          stats: {
            wpm: finalWpm,
            accuracy: finalAcc,
            errors: stats.errors,
            elapsedMs: finalElapsed,
          },
        });
      } else {
        set({
          words: newWords,
          currentLetterIndex: nextLetterIdx,
          stats: {
            wpm: curWpm,
            accuracy: curAcc,
            errors: stats.errors,
            elapsedMs: curElapsed,
          },
        });
      }
    } else {
      // Keystroke Error
      const newErrors = stats.errors + 1;
      activeWord.hasErrors = true;

      const curElapsed = Math.max(1, Date.now() - (sentenceStartTime || Date.now()));
      const curAcc = calculateSentenceAccuracy(correctKeystrokesCount, totalKeystrokesCount);
      const targetText = getTargetText(currentSentence);
      const curWpm = calculateSentenceWpm(targetText.length, curElapsed);

      if (stopOnError === "letter") {
        currentLetter.state = "error";
        currentLetter.typedChar = key;
        set({
          words: newWords,
          stats: {
            wpm: curWpm,
            accuracy: curAcc,
            errors: newErrors,
            elapsedMs: curElapsed,
          },
        });
      } else {
        currentLetter.state = "error";
        currentLetter.typedChar = key;
        const nextLetterIdx = currentLetterIndex + 1;
        set({
          words: newWords,
          currentLetterIndex: nextLetterIdx,
          stats: {
            wpm: curWpm,
            accuracy: curAcc,
            errors: newErrors,
            elapsedMs: curElapsed,
          },
        });
      }
    }
  },

  handleSpace: async (stopOnError: StopOnError) => {
    const {
      isSessionActive,
      isSentenceComplete,
      isSessionComplete,
      words,
      currentWordIndex,
      currentLetterIndex,
    } = get();

    if (!isSessionActive || isSentenceComplete || isSessionComplete) {
      return;
    }

    const currentWord = words[currentWordIndex];
    if (!currentWord) return;

    const isLastWord = currentWordIndex >= words.length - 1;

    // If on the last word
    if (isLastWord) {
      if (currentLetterIndex >= currentWord.letters.length) {
        // Sentence completes on space if not already completed
        return;
      }
      return;
    }

    // If user has reached or exceeded word length
    if (currentLetterIndex >= currentWord.letters.length) {
      const newWords = words.map((w, idx) =>
        idx === currentWordIndex ? { ...w, isCompleted: true } : w
      );

      set({
        words: newWords,
        currentWordIndex: currentWordIndex + 1,
        currentLetterIndex: 0,
      });
      return;
    }

    // If user pressed Space before finishing the current word
    if (stopOnError === "letter" || stopOnError === "word") {
      // Cannot skip unfinished word in strict modes
      return;
    }

    // In stopOnError: "off", mark remaining letters as errors and advance
    let addedErrors = 0;
    const newWords = words.map((w, idx) => {
      if (idx !== currentWordIndex) return w;
      const letters = w.letters.map((l, lIdx) => {
        if (lIdx >= currentLetterIndex && l.state === "pending") {
          addedErrors += 1;
          return { ...l, state: "error" as const };
        }
        return l;
      });
      return {
        ...w,
        letters,
        isCompleted: true,
        hasErrors: true,
      };
    });

    totalKeystrokesCount += addedErrors;

    set((state) => ({
      words: newWords,
      currentWordIndex: currentWordIndex + 1,
      currentLetterIndex: 0,
      stats: {
        ...state.stats,
        errors: state.stats.errors + addedErrors,
      },
    }));
  },

  handleBackspace: (confidenceMode: ConfidenceMode) => {
    const {
      isSessionActive,
      isSentenceComplete,
      isSessionComplete,
      words,
      currentWordIndex,
      currentLetterIndex,
    } = get();

    if (!isSessionActive || isSentenceComplete || isSessionComplete) {
      return;
    }

    // Confidence max: backspaces disabled
    if (confidenceMode === "max") {
      return;
    }

    backspacesCount += 1;

    const newWords = words.map((w, wIdx) => {
      if (wIdx !== currentWordIndex && wIdx !== currentWordIndex - 1) return w;
      return {
        ...w,
        letters: w.letters.map((l) => ({ ...l })),
      };
    });

    const activeWord = newWords[currentWordIndex];
    if (!activeWord) return;

    // 1. If currently inside the active word
    if (currentLetterIndex > 0) {
      // In confidence "on", cannot backspace past confirmed letters
      if (confidenceMode === "on") {
        const targetLetter = activeWord.letters[currentLetterIndex - 1];
        if (targetLetter && targetLetter.state === "correct") {
          return;
        }
      }

      // Check if current letter at caret is in error
      if (
        currentLetterIndex < activeWord.letters.length &&
        activeWord.letters[currentLetterIndex].state === "error"
      ) {
        activeWord.letters[currentLetterIndex] = {
          char: activeWord.letters[currentLetterIndex].char,
          state: "pending",
        };
        activeWord.hasErrors = activeWord.letters.some((l) => l.state === "error");
        set({ words: newWords });
        return;
      }

      // Move back 1 letter
      const prevIdx = currentLetterIndex - 1;
      const targetLetter = activeWord.letters[prevIdx];

      // If it was an extra letter appended beyond original word
      if (prevIdx >= activeWord.word.length) {
        activeWord.letters.splice(prevIdx, 1);
      } else if (targetLetter) {
        activeWord.letters[prevIdx] = {
          char: targetLetter.char,
          state: "pending",
        };
      }

      activeWord.hasErrors = activeWord.letters.some((l) => l.state === "error");

      set({
        words: newWords,
        currentLetterIndex: prevIdx,
      });
      return;
    }

    // 2. At word boundary (currentLetterIndex === 0): backspace across word boundary
    if (currentLetterIndex === 0 && currentWordIndex > 0) {
      if (confidenceMode === "on") {
        // Cannot backspace across word boundary if confidence mode is on
        return;
      }

      const prevWordIndex = currentWordIndex - 1;
      const prevWord = newWords[prevWordIndex];
      if (!prevWord) return;

      prevWord.isCompleted = false;

      set({
        words: newWords,
        currentWordIndex: prevWordIndex,
        currentLetterIndex: prevWord.letters.length,
      });
    }
  },

  toggleVocabHint: () => {
    set((state) => ({ showVocabHint: !state.showVocabHint }));
  },

  setShowVocabHint: (show: boolean) => {
    set({ showVocabHint: show });
  },

  setIsSpeaking: (isSpeaking: boolean) => {
    set({ isSpeaking });
  },

  nextSentence: () => {
    const { sentenceQueue, queueIndex } = get();
    const nextIdx = queueIndex + 1;

    if (nextIdx < sentenceQueue.length) {
      const nextSentence = sentenceQueue[nextIdx];
      const targetText = getTargetText(nextSentence);
      const tokenized = tokenizeSentence(targetText);

      sentenceStartTime = null;
      totalKeystrokesCount = 0;
      correctKeystrokesCount = 0;
      backspacesCount = 0;

      set({
        queueIndex: nextIdx,
        currentSentence: nextSentence,
        currentWordIndex: 0,
        currentLetterIndex: 0,
        words: tokenized,
        isSentenceComplete: false,
        showVocabHint: false,
        isSpeaking: false,
        stats: {
          wpm: 0,
          accuracy: 100,
          errors: 0,
          elapsedMs: 0,
        },
      });
    } else {
      set({ isSessionComplete: true });
    }
  },

  skipSentence: async () => {
    const { currentSentence, practiceType, activeCategory, stats } = get();
    if (!currentSentence) return;

    const targetText = getTargetText(currentSentence);
    try {
      await db.sentenceHistory.add({
        sentenceId: currentSentence.id,
        type: practiceType,
        category: activeCategory,
        wpm: 0,
        accuracy: 0,
        errors: stats.errors + 1,
        elapsedMs: 1000,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Non-blocking
    }

    get().nextSentence();
  },

  restartSession: () => {
    const { sentenceQueue } = get();
    if (sentenceQueue.length === 0) return;

    const firstSentence = sentenceQueue[0];
    const targetText = getTargetText(firstSentence);
    const tokenized = tokenizeSentence(targetText);

    sentenceStartTime = null;
    totalKeystrokesCount = 0;
    correctKeystrokesCount = 0;
    backspacesCount = 0;

    set({
      queueIndex: 0,
      currentSentence: firstSentence,
      currentWordIndex: 0,
      currentLetterIndex: 0,
      words: tokenized,
      isSentenceComplete: false,
      isSessionComplete: false,
      showVocabHint: false,
      isSpeaking: false,
      stats: {
        wpm: 0,
        accuracy: 100,
        errors: 0,
        elapsedMs: 0,
      },
    });
  },
}));
