import { create } from "zustand";
import { type WordRecord, db } from "@/lib/db";
import { buildSessionQueue } from "@/lib/sessionQueue";
import { calculateSM2, getNextReviewDateString } from "@/lib/sm2";
import { gradeWord, type GradingResult } from "@/lib/grader";

export interface CompletedWordItem {
  word: WordRecord;
  grade: number;
  label: string;
  errors: number;
  backspaces: number;
  wpm: number;
  accuracy: number;
  wasRetry: boolean;
  wasSkipped?: boolean;
}

export interface SessionState {
  mainQueue: WordRecord[];
  retryQueue: WordRecord[];
  currentIndex: number;
  currentWord: WordRecord | null;
  isRetryAttempt: boolean;
  completedWords: CompletedWordItem[];
  startTime: number | null;
  endTime: number | null;
  isLoading: boolean;
  isSessionActive: boolean;
  isSessionComplete: boolean;

  // Actions
  initSession: (category: string, sessionSize: number) => Promise<void>;
  completeCurrentWord: (stats: {
    errors: number;
    backspaces: number;
    elapsedMs: number;
    wasSkipped?: boolean;
  }) => Promise<{ gradeResult: GradingResult; isNextAvailable: boolean }>;
  skipCurrentWord: () => Promise<void>;
  startRetryMistakes: () => void;
  restartSession: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  mainQueue: [],
  retryQueue: [],
  currentIndex: 0,
  currentWord: null,
  isRetryAttempt: false,
  completedWords: [],
  startTime: null,
  endTime: null,
  isLoading: false,
  isSessionActive: false,
  isSessionComplete: false,

  initSession: async (category: string, sessionSize: number) => {
    set({ isLoading: true });
    try {
      const plan = await buildSessionQueue(category, sessionSize);
      const firstWord = plan.queue[0] || null;

      set({
        mainQueue: plan.queue,
        retryQueue: [],
        currentIndex: 0,
        currentWord: firstWord,
        isRetryAttempt: false,
        completedWords: [],
        startTime: Date.now(),
        endTime: null,
        isLoading: false,
        isSessionActive: plan.queue.length > 0,
        isSessionComplete: plan.queue.length === 0,
      });
    } catch (err) {
      console.error("Failed to init session:", err);
      set({ isLoading: false });
    }
  },

  completeCurrentWord: async ({ errors, backspaces, elapsedMs, wasSkipped = false }) => {
    const { currentWord, isRetryAttempt, mainQueue, retryQueue, currentIndex, completedWords } = get();

    if (!currentWord) {
      return {
        gradeResult: { grade: 0, label: "", avgMsPerChar: 0, wpm: 0, accuracy: 0 },
        isNextAvailable: false,
      };
    }

    // 1. Grade performance
    const gradeResult = wasSkipped
      ? { grade: 1, label: "Skipped", avgMsPerChar: 0, wpm: 0, accuracy: 0 }
      : gradeWord({
          word: currentWord.word,
          errors,
          backspaces,
          elapsedMs,
          wasRetry: isRetryAttempt,
        });

    // 2. SM-2 Calculation
    const sm2 = calculateSM2(
      gradeResult.grade,
      currentWord.easeFactor,
      currentWord.interval,
      currentWord.repetitions
    );

    const nextReviewDate = getNextReviewDateString(sm2.interval);
    const updatedWordRecord: WordRecord = {
      ...currentWord,
      easeFactor: sm2.easeFactor,
      interval: sm2.interval,
      repetitions: sm2.repetitions,
      nextReviewDate,
      lastReviewedDate: new Date().toISOString(),
      totalMistakes: currentWord.totalMistakes + errors,
      totalReviews: currentWord.totalReviews + 1,
    };

    // 3. Persist to Dexie.js IndexedDB
    if (currentWord.id) {
      await db.words.update(currentWord.id, {
        easeFactor: updatedWordRecord.easeFactor,
        interval: updatedWordRecord.interval,
        repetitions: updatedWordRecord.repetitions,
        nextReviewDate: updatedWordRecord.nextReviewDate,
        lastReviewedDate: updatedWordRecord.lastReviewedDate,
        totalMistakes: updatedWordRecord.totalMistakes,
        totalReviews: updatedWordRecord.totalReviews,
      });
    }

    // 4. Save retry record if needed for targeted "Retry Mistakes" button
    const nextRetryQueue = [...retryQueue];
    if (errors > 0 || gradeResult.grade < 3 || wasSkipped) {
      nextRetryQueue.push(updatedWordRecord);
    }

    const newCompletedWords: CompletedWordItem[] = [
      ...completedWords,
      {
        word: currentWord,
        grade: gradeResult.grade,
        label: gradeResult.label,
        errors,
        backspaces,
        wpm: gradeResult.wpm,
        accuracy: gradeResult.accuracy,
        wasRetry: isRetryAttempt,
        wasSkipped,
      },
    ];

    // Determine next word in queue
    let nextWord: WordRecord | null = null;
    let nextIsRetry = isRetryAttempt;
    let nextIndex = currentIndex;

    if (!isRetryAttempt) {
      // Main 15-word queue: advance straight to next word or finish at word 15
      if (currentIndex + 1 < mainQueue.length) {
        nextIndex = currentIndex + 1;
        nextWord = mainQueue[nextIndex];
        nextIsRetry = false;
      } else {
        // Main queue completed!
        nextWord = null;
      }
    } else {
      // In explicit retry round
      if (currentIndex + 1 < mainQueue.length) {
        nextIndex = currentIndex + 1;
        nextWord = mainQueue[nextIndex];
      } else {
        nextWord = null;
      }
    }

    const isComplete = !nextWord;

    if (isComplete) {
      // Save session history
      const totalWords = newCompletedWords.length;
      const totalErrors = newCompletedWords.reduce((acc, c) => acc + c.errors, 0);
      const avgWpm = Math.round(
        newCompletedWords.reduce((acc, c) => acc + c.wpm, 0) / Math.max(1, totalWords)
      );
      const avgAcc = Math.round(
        newCompletedWords.reduce((acc, c) => acc + c.accuracy, 0) / Math.max(1, totalWords)
      );
      const duration = Math.round((Date.now() - (get().startTime || Date.now())) / 1000);

      await db.sessionHistory.add({
        timestamp: new Date().toISOString(),
        wpm: avgWpm,
        accuracy: avgAcc,
        totalWords,
        errors: totalErrors,
        category: currentWord.category,
        duration,
      });
    }

    set({
      retryQueue: nextRetryQueue,
      currentIndex: nextIndex,
      currentWord: nextWord,
      isRetryAttempt: nextIsRetry,
      completedWords: newCompletedWords,
      isSessionComplete: isComplete,
      endTime: isComplete ? Date.now() : null,
    });

    return { gradeResult, isNextAvailable: !isComplete };
  },

  skipCurrentWord: async () => {
    // Treat skip as Grade 1 and record wasSkipped
    const { completeCurrentWord } = get();
    await completeCurrentWord({
      errors: 1,
      backspaces: 0,
      elapsedMs: 2000,
      wasSkipped: true,
    });
  },

  startRetryMistakes: () => {
    const { retryQueue, completedWords } = get();
    const mistakes =
      retryQueue.length > 0
        ? [...retryQueue]
        : completedWords
            .filter((c) => c.grade < 3 || c.errors > 0 || c.wasSkipped)
            .map((c) => c.word);

    // Deduplicate by word string
    const uniqueMistakes: WordRecord[] = [];
    const seen = new Set<string>();
    for (const w of mistakes) {
      if (!seen.has(w.word)) {
        seen.add(w.word);
        uniqueMistakes.push(w);
      }
    }

    if (uniqueMistakes.length > 0) {
      set({
        mainQueue: uniqueMistakes,
        retryQueue: [],
        currentIndex: 0,
        currentWord: uniqueMistakes[0],
        isRetryAttempt: true,
        completedWords: [],
        startTime: Date.now(),
        endTime: null,
        isSessionActive: true,
        isSessionComplete: false,
      });
    }
  },

  restartSession: () => {
    const { mainQueue } = get();
    if (mainQueue.length > 0) {
      set({
        currentIndex: 0,
        currentWord: mainQueue[0],
        retryQueue: [],
        completedWords: [],
        startTime: Date.now(),
        endTime: null,
        isSessionActive: true,
        isSessionComplete: false,
        isRetryAttempt: false,
      });
    }
  },
}));
