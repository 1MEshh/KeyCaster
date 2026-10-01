import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ACHIEVEMENTS, type Achievement } from "@/lib/achievements";

export type TypingRank = "Novice" | "Apprentice" | "Adept" | "Expert" | "Master" | "Grandmaster";

interface ProfileState {
  xp: number;
  level: number;
  streak: number;
  lastActiveDate: string | null;
  unlockedAchievements: string[];
  recentUnlocked: Achievement | null;
  recentXpGained: number | null;
  didLevelUp: boolean;
  totalWordsTyped: number;
  totalSessions: number;
  lifetimeAvgWpm: number;

  // Actions
  recordSessionCompletion: (stats: {
    wpm: number;
    accuracy: number;
    totalWords: number;
    category: string;
    blindMode: boolean;
  }) => void;
  checkStreak: () => void;
  clearRecentToasts: () => void;
  getRank: () => TypingRank;
  getXpForNextLevel: () => number;
}

export function calculateLevel(xp: number): number {
  // Level threshold: each level requires 150 * level XP
  let lvl = 1;
  let req = 150;
  let currentXp = xp;
  while (currentXp >= req) {
    currentXp -= req;
    lvl++;
    req = lvl * 150;
  }
  return lvl;
}

export function getRankFromWpm(wpm: number): TypingRank {
  if (wpm >= 120) return "Grandmaster";
  if (wpm >= 100) return "Master";
  if (wpm >= 80) return "Expert";
  if (wpm >= 60) return "Adept";
  if (wpm >= 40) return "Apprentice";
  return "Novice";
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      xp: 0,
      level: 1,
      streak: 1,
      lastActiveDate: null,
      unlockedAchievements: [],
      recentUnlocked: null,
      recentXpGained: null,
      didLevelUp: false,
      totalWordsTyped: 0,
      totalSessions: 0,
      lifetimeAvgWpm: 0,

      checkStreak: () => {
        const today = new Date().toISOString().split("T")[0];
        const { lastActiveDate, streak } = get();

        if (!lastActiveDate) {
          set({ lastActiveDate: today, streak: 1 });
          return;
        }

        if (lastActiveDate === today) {
          // Already logged in today
          return;
        }

        const lastDate = new Date(lastActiveDate);
        const currDate = new Date(today);
        const diffDays = Math.round((currDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          // Consecutive day!
          set({ streak: streak + 1, lastActiveDate: today });
        } else if (diffDays > 1) {
          // Missed a day
          set({ streak: 1, lastActiveDate: today });
        }
      },

      recordSessionCompletion: ({ wpm, accuracy, totalWords, category, blindMode }) => {
        const state = get();
        state.checkStreak();

        // Calculate XP
        // Base 10 XP per word + accuracy bonus + speed bonus
        const wordXp = totalWords * 10;
        const accBonus = Math.round((accuracy / 100) * (totalWords * 5));
        const speedBonus = Math.round((wpm / 10) * 5);
        const blindBonus = blindMode ? totalWords * 5 : 0;
        const xpGained = wordXp + accBonus + speedBonus + blindBonus;

        const nextXp = state.xp + xpGained;
        const oldLevel = state.level;
        const newLevel = calculateLevel(nextXp);
        const didLevelUp = newLevel > oldLevel;

        const nextTotalWords = state.totalWordsTyped + totalWords;
        const nextTotalSessions = state.totalSessions + 1;
        const nextAvgWpm = Math.round((state.lifetimeAvgWpm * state.totalSessions + wpm) / nextTotalSessions);

        // Check for new achievements
        const newlyUnlocked: string[] = [];
        let toastAchievement: Achievement | null = null;

        const checkAchievement = (id: string, condition: boolean) => {
          if (condition && !state.unlockedAchievements.includes(id) && !newlyUnlocked.includes(id)) {
            newlyUnlocked.push(id);
            const found = ACHIEVEMENTS.find((a) => a.id === id);
            if (found && !toastAchievement) {
              toastAchievement = found;
            }
          }
        };

        checkAchievement("first_session", true);
        checkAchievement("flawless", accuracy === 100);
        checkAchievement("speed_demon_80", wpm >= 80);
        checkAchievement("century_club", wpm >= 100);
        checkAchievement("grandmaster_120", wpm >= 120);
        checkAchievement("streak_3", state.streak >= 3);
        checkAchievement("streak_7", state.streak >= 7);
        checkAchievement("words_50", nextTotalWords >= 50);
        checkAchievement("words_250", nextTotalWords >= 250);
        checkAchievement("blind_master", blindMode);

        const currentHour = new Date().getHours();
        checkAchievement("night_owl", currentHour >= 0 && currentHour < 5);

        set({
          xp: nextXp,
          level: newLevel,
          didLevelUp,
          recentXpGained: xpGained,
          recentUnlocked: toastAchievement,
          unlockedAchievements: [...state.unlockedAchievements, ...newlyUnlocked],
          totalWordsTyped: nextTotalWords,
          totalSessions: nextTotalSessions,
          lifetimeAvgWpm: nextAvgWpm,
        });
      },

      clearRecentToasts: () => {
        set({ recentUnlocked: null, recentXpGained: null, didLevelUp: false });
      },

      getRank: () => {
        const { lifetimeAvgWpm } = get();
        return getRankFromWpm(lifetimeAvgWpm);
      },

      getXpForNextLevel: () => {
        const { level } = get();
        return level * 150;
      },
    }),
    {
      name: "keycaster_profile_v1",
    }
  )
);
