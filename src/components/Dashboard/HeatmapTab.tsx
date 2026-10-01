"use client";

import React, { useMemo } from "react";
import { type WordRecord } from "@/lib/db";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface HeatmapTabProps {
  words: WordRecord[];
}

const KEYBOARD_ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m"],
];

export const HeatmapTab: React.FC<HeatmapTabProps> = ({ words }) => {
  // Compute error distribution per letter
  const letterStats = useMemo(() => {
    const errorMap: Record<string, number> = {};
    const seenMap: Record<string, number> = {};

    // Initialize all lowercase letters
    for (let i = 97; i <= 122; i++) {
      const char = String.fromCharCode(i);
      errorMap[char] = 0;
      seenMap[char] = 0;
    }

    words.forEach((w) => {
      const chars = new Set(w.word.toLowerCase().replace(/[^a-z]/g, "").split(""));
      chars.forEach((c) => {
        seenMap[c] = (seenMap[c] || 0) + (w.totalReviews || 1);
        if (w.totalMistakes > 0) {
          errorMap[c] = (errorMap[c] || 0) + w.totalMistakes;
        }
      });
    });

    const maxErrors = Math.max(1, ...Object.values(errorMap));
    return { errorMap, maxErrors, seenMap };
  }, [words]);

  const sortedWeakest = useMemo(() => {
    return Object.entries(letterStats.errorMap)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [letterStats]);

  const getKeyColor = (char: string) => {
    const errors = letterStats.errorMap[char] || 0;
    if (errors === 0) {
      return "bg-sub/10 border-sub/20 text-sub";
    }
    const ratio = errors / letterStats.maxErrors;
    if (ratio > 0.6) {
      return "bg-red-500/25 border-red-500/60 text-red-400 font-bold shadow-sm shadow-red-500/20";
    }
    if (ratio > 0.3) {
      return "bg-amber-500/20 border-amber-500/50 text-amber-400 font-semibold";
    }
    return "bg-main/15 border-main/40 text-main";
  };

  return (
    <div className="space-y-6 animate-fadeIn font-mono">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-text">Keyboard Mistake Heatmap</h3>
          <p className="text-xs text-sub mt-0.5">
            Keys colored by frequency of errors in words you've practiced.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[10px]">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-sub/10 border border-sub/20" />
            <span className="text-sub">Clean</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-main/15 border border-main/40" />
            <span className="text-sub">Low</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/50" />
            <span className="text-sub">Moderate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-red-500/25 border border-red-500/60" />
            <span className="text-sub">High</span>
          </div>
        </div>
      </div>

      {/* Visual Keyboard */}
      <div className="p-6 rounded-2xl border border-sub/20 bg-sub/5 flex flex-col items-center gap-2 select-none">
        {KEYBOARD_ROWS.map((row, rIdx) => (
          <div
            key={rIdx}
            className="flex gap-1.5 sm:gap-2 justify-center"
            style={{
              paddingLeft: rIdx === 1 ? "1.5rem" : rIdx === 2 ? "3rem" : "0",
            }}
          >
            {row.map((char) => {
              const errors = letterStats.errorMap[char] || 0;
              return (
                <div
                  key={char}
                  className={`w-9 h-11 sm:w-11 sm:h-13 rounded-xl border flex flex-col items-center justify-center transition-all ${getKeyColor(
                    char
                  )}`}
                  title={`${char.toUpperCase()}: ${errors} recorded mistakes`}
                >
                  <span className="text-xs sm:text-sm uppercase font-bold">{char}</span>
                  {errors > 0 && (
                    <span className="text-[9px] opacity-70 leading-none">{errors}</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Weakest Keys Diagnosis */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-sub/20 bg-sub/5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-text">
            <AlertCircle className="w-4 h-4 text-error" />
            <span>Most Missed Keys</span>
          </div>
          {sortedWeakest.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {sortedWeakest.map(([char, count]) => (
                <div
                  key={char}
                  className="px-2.5 py-1 rounded-lg border border-red-500/30 bg-red-500/10 text-xs flex items-center gap-2 text-text"
                >
                  <span className="font-bold text-red-400 uppercase">{char}</span>
                  <span className="text-[10px] text-sub">{count} mistakes</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-sub italic">No mistakes recorded yet! Perfect run.</p>
          )}
        </div>

        <div className="p-4 rounded-xl border border-sub/20 bg-sub/5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-text">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Accuracy Tip</span>
          </div>
          <p className="text-xs text-sub leading-relaxed">
            {sortedWeakest.length > 0
              ? `Your accuracy dips most around the letter "${sortedWeakest[0][0].toUpperCase()}". Practice words with this key in Blind Mode to reinforce muscle memory.`
              : "Keep practicing consistently to maintain high accuracy and build automatic finger reflexes."}
          </p>
        </div>
      </div>
    </div>
  );
};
