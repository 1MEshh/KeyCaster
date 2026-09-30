"use client";

import React from "react";
import { useSettingsStore } from "@/store/useSettingsStore";

interface LiveStatsProps {
  wpm: number;
  accuracy: number;
  streak: number;
  currentWordIndex: number;
  totalWords: number;
  retryCount: number;
  isRetryAttempt: boolean;
  isComplete?: boolean;
}

export const LiveStats: React.FC<LiveStatsProps> = ({
  wpm,
  accuracy,
  streak,
  currentWordIndex,
  totalWords,
  retryCount,
  isRetryAttempt,
  isComplete = false,
}) => {
  const { liveStats } = useSettingsStore();

  if (liveStats === "off") return null;

  const completedCount = isComplete ? totalWords : currentWordIndex;
  const progressPercent =
    totalWords > 0 ? Math.min(100, Math.round((completedCount / totalWords) * 100)) : 0;

  if (liveStats === "mini") {
    return (
      <div className="flex flex-col items-center gap-1.5 select-none transition-all">
        <div className="flex items-center justify-center gap-6 text-sm font-mono text-sub/80">
          <span className="flex items-center gap-1.5">
            <span className="text-main font-semibold">{wpm}</span>
            <span className="text-[11px] uppercase opacity-70">wpm</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-text font-semibold">{accuracy}%</span>
            <span className="text-[11px] uppercase opacity-70">acc</span>
          </span>
          {streak > 2 && (
            <span className="text-main flex items-center gap-1">
              <span>🔥</span>
              <span>{streak}</span>
            </span>
          )}
          <span className="text-xs opacity-60">
            {isComplete ? totalWords : currentWordIndex + 1}/{totalWords}
            {retryCount > 0 && !isComplete && <span className="text-error ml-1">+{retryCount}</span>}
          </span>
        </div>
        <div className="w-48 bg-sub/20 h-1 rounded-full overflow-hidden">
          <div
            className="h-full bg-main transition-all duration-300 ease-out rounded-full shadow-[0_0_6px_var(--main)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-6 sm:gap-8 py-2.5 px-6 rounded-full bg-sub/10 border border-sub/20 text-xs font-mono select-none transition-all shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-sub uppercase tracking-wider text-[10px]">WPM</span>
        <span className="text-main font-bold text-base">{wpm}</span>
      </div>

      <div className="h-4 w-px bg-sub/30" />

      <div className="flex items-center gap-2">
        <span className="text-sub uppercase tracking-wider text-[10px]">Accuracy</span>
        <span className="text-text font-bold text-base">{accuracy}%</span>
      </div>

      <div className="h-4 w-px bg-sub/30" />

      <div className="flex items-center gap-2">
        <span className="text-sub uppercase tracking-wider text-[10px]">Streak</span>
        <span className="text-text font-bold text-base flex items-center gap-1">
          {streak > 0 && "🔥"}
          {streak}
        </span>
      </div>

      <div className="h-4 w-px bg-sub/30" />

      <div className="flex flex-col gap-1 min-w-[100px]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sub uppercase tracking-wider text-[10px]">Queue</span>
          <span className="text-sub font-semibold text-xs">
            {isComplete ? totalWords : Math.min(currentWordIndex + 1, totalWords)} / {totalWords}
            {retryCount > 0 && !isComplete && (
              <span className="text-error font-semibold ml-1 text-[10px] bg-error/10 px-1 py-0.5 rounded">
                +{retryCount}
              </span>
            )}
          </span>
          {isRetryAttempt && !isComplete && (
            <span className="ml-1 text-[9px] bg-main/20 text-main px-1 py-0.5 rounded uppercase font-semibold">
              Retry
            </span>
          )}
        </div>
        {/* Sleek Minimal Progress Bar */}
        <div className="w-full bg-sub/20 h-1.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-main transition-all duration-300 ease-out rounded-full shadow-[0_0_8px_var(--main)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};
