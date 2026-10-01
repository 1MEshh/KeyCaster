"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Trophy, Zap, X } from "lucide-react";
import { useProfileStore } from "@/store/useProfileStore";

export const XPToastBadge: React.FC = () => {
  const {
    recentXpGained,
    didLevelUp,
    level,
    recentUnlocked,
    clearRecentToasts,
  } = useProfileStore();

  useEffect(() => {
    if (recentXpGained || recentUnlocked || didLevelUp) {
      const timer = setTimeout(() => {
        clearRecentToasts();
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [recentXpGained, recentUnlocked, didLevelUp, clearRecentToasts]);

  const hasToasts = recentXpGained !== null || recentUnlocked !== null || didLevelUp;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none font-mono">
      <AnimatePresence>
        {/* XP Gained & Level Up Toast */}
        {recentXpGained !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="pointer-events-auto p-3.5 rounded-2xl bg-bg border border-main/40 shadow-2xl flex items-center gap-3 backdrop-blur-md"
          >
            <div className="w-9 h-9 rounded-xl bg-main/20 text-main flex items-center justify-center shrink-0">
              {didLevelUp ? <Sparkles className="w-5 h-5 text-amber-400 animate-spin" /> : <Zap className="w-5 h-5" />}
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm text-main">+{recentXpGained} XP</span>
                {didLevelUp && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-400 font-bold uppercase tracking-wider">
                    Level Up! Lvl {level}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-sub">Session Completed</span>
            </div>

            <button
              onClick={clearRecentToasts}
              className="p-1 rounded text-sub/60 hover:text-text transition-colors ml-2"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}

        {/* Achievement Unlocked Toast */}
        {recentUnlocked && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="pointer-events-auto p-4 rounded-2xl bg-bg border border-amber-400/40 shadow-2xl flex items-center gap-3.5 backdrop-blur-md max-w-xs"
          >
            <div className="text-2xl shrink-0 p-2 rounded-xl bg-amber-400/10 border border-amber-400/30">
              {recentUnlocked.icon}
            </div>

            <div className="flex flex-col flex-1">
              <div className="flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                  Achievement Unlocked!
                </span>
              </div>
              <span className="font-bold text-xs text-text">{recentUnlocked.title}</span>
              <span className="text-[10px] text-sub leading-tight mt-0.5">
                {recentUnlocked.description}
              </span>
            </div>

            <button
              onClick={clearRecentToasts}
              className="p-1 rounded text-sub/60 hover:text-text transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
