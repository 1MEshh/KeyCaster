import { create } from "zustand";
import categoriesData from "@/data/categories.json";
import { db } from "@/lib/db";
import { useProfileStore } from "@/store/useProfileStore";

export type GameModeType = "srs" | "time_attack" | "sudden_death" | "endless";

interface GameModeState {
  mode: GameModeType;
  isActive: boolean;
  isGameOver: boolean;
  timeLeft: number;
  score: number;
  wordsCompleted: number;
  currentStreak: number;
  highestStreak: number;
  errors: number;
  totalKeystrokes: number;
  correctKeystrokes: number;
  currentWordIndex: number;
  words: string[];
  startTime: number | null;
  endTime: number | null;

  // Actions
  startMode: (mode: GameModeType) => void;
  resetMode: () => void;
  exitToSRS: () => void;
  tickTimer: () => void;
  submitWord: (wordStats: { errors: number; chars: number }) => void;
  recordMistake: () => void;
  recordKeystroke: (isCorrect: boolean) => void;
  endGame: () => void;
}

function getRandomWordPool(): string[] {
  const all = [
    ...categoriesData.daily.words,
    ...categoriesData.common_misspellings.words,
    ...categoriesData.gaming.words,
    ...categoriesData.coding.words,
  ];
  // Shuffle
  const shuffled = [...all];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function recordArcadeCompletion(state: GameModeState, endTime: number) {
  const { mode, startTime, wordsCompleted, errors, totalKeystrokes, correctKeystrokes } = state;
  const start = startTime || endTime;
  const totalSecs = Math.max(1, Math.round((endTime - start) / 1000));
  const finalWpm = Math.round((correctKeystrokes / 5) / (totalSecs / 60));
  const accuracy = totalKeystrokes > 0 ? Math.round((correctKeystrokes / totalKeystrokes) * 100) : 100;

  if (wordsCompleted > 0 || totalKeystrokes > 5) {
    db.sessionHistory.add({
      timestamp: new Date().toISOString(),
      wpm: finalWpm,
      rawWpm: finalWpm,
      accuracy,
      consistency: 85,
      totalWords: wordsCompleted,
      errors,
      category: `arcade_${mode}`,
      duration: totalSecs,
    }).catch(() => {});

    useProfileStore.getState().recordSessionCompletion({
      wpm: finalWpm,
      accuracy,
      totalWords: wordsCompleted,
      category: `arcade_${mode}`,
      blindMode: false,
    });
  }
}

export const useGameModeStore = create<GameModeState>((set, get) => ({
  mode: "srs",
  isActive: false,
  isGameOver: false,
  timeLeft: 60,
  score: 0,
  wordsCompleted: 0,
  currentStreak: 0,
  highestStreak: 0,
  errors: 0,
  totalKeystrokes: 0,
  correctKeystrokes: 0,
  currentWordIndex: 0,
  words: [],
  startTime: null,
  endTime: null,

  startMode: (mode: GameModeType) => {
    if (mode === "srs") {
      set({ mode: "srs", isActive: false, isGameOver: false });
      return;
    }

    const words = getRandomWordPool();
    set({
      mode,
      isActive: true,
      isGameOver: false,
      timeLeft: mode === "time_attack" ? 60 : 0,
      score: 0,
      wordsCompleted: 0,
      currentStreak: 0,
      highestStreak: 0,
      errors: 0,
      totalKeystrokes: 0,
      correctKeystrokes: 0,
      currentWordIndex: 0,
      words,
      startTime: Date.now(),
      endTime: null,
    });
  },

  resetMode: () => {
    const { mode } = get();
    get().startMode(mode);
  },

  exitToSRS: () => {
    set({
      mode: "srs",
      isActive: false,
      isGameOver: false,
      words: [],
    });
  },

  tickTimer: () => {
    const { mode, timeLeft, isGameOver, isActive } = get();
    if (!isActive || isGameOver || mode !== "time_attack") return;

    if (timeLeft <= 1) {
      const now = Date.now();
      const st = get();
      recordArcadeCompletion(st, now);
      set({ timeLeft: 0, isGameOver: true, endTime: now });
    } else {
      set({ timeLeft: timeLeft - 1 });
    }
  },

  submitWord: ({ errors, chars }) => {
    const {
      currentWordIndex,
      words,
      score,
      wordsCompleted,
      currentStreak,
      highestStreak,
      errors: totalErrors,
    } = get();

    const streakBonus = Math.floor(currentStreak / 5) * 50;
    const wordScore = Math.max(10, (chars * 10) - (errors * 20)) + streakBonus;
    const nextStreak = errors === 0 ? currentStreak + 1 : 0;

    let nextIndex = currentWordIndex + 1;
    let pool = words;
    if (nextIndex >= words.length) {
      // Loop word pool
      pool = getRandomWordPool();
      nextIndex = 0;
    }

    set({
      currentWordIndex: nextIndex,
      words: pool,
      score: score + wordScore,
      wordsCompleted: wordsCompleted + 1,
      currentStreak: nextStreak,
      highestStreak: Math.max(highestStreak, nextStreak),
    });
  },

  recordMistake: () => {
    const { mode, errors } = get();
    if (mode === "sudden_death") {
      const now = Date.now();
      const st = { ...get(), errors: errors + 1 };
      recordArcadeCompletion(st, now);
      set({
        errors: errors + 1,
        isGameOver: true,
        endTime: now,
      });
    } else {
      set({ errors: errors + 1, currentStreak: 0 });
    }
  },

  recordKeystroke: (isCorrect: boolean) => {
    set((state) => ({
      totalKeystrokes: state.totalKeystrokes + 1,
      correctKeystrokes: state.correctKeystrokes + (isCorrect ? 1 : 0),
    }));
  },

  endGame: () => {
    const { isGameOver } = get();
    if (!isGameOver) {
      const now = Date.now();
      recordArcadeCompletion(get(), now);
      set({ isGameOver: true, endTime: now });
    }
  },
}));
