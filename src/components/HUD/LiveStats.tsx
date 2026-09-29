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
}

export const LiveStats: React.FC<LiveStatsProps> = ({
  wpm,
  accuracy,
  streak,
  currentWordIndex,
  totalWords,
  retryCount,
  isRetryAttempt,
}) => {
  const { liveStats } = useSettingsStore();

  if (liveStats === "off") return null;

  if (liveStats === "mini") {
    return (
      <div className="flex items-center justify-center gap-6 text-sm font-mono text-sub/80 select-none transition-all">
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
          {currentWordIndex + 1}/{totalWords}
          {retryCount > 0 && <span className="text-error ml-1">+{retryCount}</span>}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-8 py-2 px-6 rounded-full bg-sub/10 border border-sub/20 text-xs font-mono select-none transition-all">
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

      <div className="flex items-center gap-2">
        <span className="text-sub uppercase tracking-wider text-[10px]">Queue</span>
        <span className="text-sub font-medium text-sm">
          {currentWordIndex + 1} / {totalWords}
          {retryCount > 0 && (
            <span className="text-error font-semibold ml-1.5 text-xs bg-error/10 px-1.5 py-0.5 rounded">
              {retryCount} to retry
            </span>
          )}
        </span>
        {isRetryAttempt && (
          <span className="ml-1 text-[10px] bg-main/20 text-main px-1.5 py-0.5 rounded font-mono uppercase font-semibold">
            Retry Round
          </span>
        )}
      </div>
    </div>
  );
};
