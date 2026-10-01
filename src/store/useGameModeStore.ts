import { create } from "zustand";
import categoriesData from "@/data/categories.json";

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
      set({ timeLeft: 0, isGameOver: true, endTime: Date.now() });
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
      set({
        errors: errors + 1,
        isGameOver: true,
        endTime: Date.now(),
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
    set({ isGameOver: true, endTime: Date.now() });
  },
}));
