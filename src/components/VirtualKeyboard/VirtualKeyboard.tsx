"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSettingsStore, type KeyboardLayout } from "@/store/useSettingsStore";
import { useKeyStore } from "@/store/useKeyStore";
import { db } from "@/lib/db";
import { Flame, Hand, Keyboard as KeyboardIcon } from "lucide-react";

export type KeyboardDisplayMode = "classic" | "fingers" | "heatmap";
export type FingerZone =
  | "left_pinky"
  | "left_ring"
  | "left_middle"
  | "left_index"
  | "thumb"
  | "right_index"
  | "right_middle"
  | "right_ring"
  | "right_pinky";

const KEYBOARD_LAYOUTS: Record<KeyboardLayout, string[][]> = {
  qwerty: [
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
    ["z", "x", "c", "v", "b", "n", "m"],
  ],
  dvorak: [
    ["'", ",", ".", "p", "y", "f", "g", "c", "r", "l"],
    ["a", "o", "e", "u", "i", "d", "h", "t", "n", "s"],
    [";", "q", "j", "k", "x", "b", "m", "w", "v", "z"],
  ],
  colemak: [
    ["q", "w", "f", "p", "g", "j", "l", "u", "y", ";"],
    ["a", "r", "s", "t", "d", "h", "n", "e", "i", "o"],
    ["z", "x", "c", "v", "b", "k", "m"],
  ],
};

const FINGER_MAP: Record<string, FingerZone> = {
  // Left Pinky
  "1": "left_pinky", "q": "left_pinky", "a": "left_pinky", "z": "left_pinky",
  // Left Ring
  "2": "left_ring", "w": "left_ring", "s": "left_ring", "x": "left_ring",
  // Left Middle
  "3": "left_middle", "e": "left_middle", "d": "left_middle", "c": "left_middle",
  // Left Index
  "4": "left_index", "5": "left_index", "r": "left_index", "t": "left_index", "f": "left_index", "g": "left_index", "v": "left_index", "b": "left_index",
  // Thumbs
  " ": "thumb",
  // Right Index
  "6": "right_index", "7": "right_index", "y": "right_index", "u": "right_index", "h": "right_index", "j": "right_index", "n": "right_index", "m": "right_index",
  // Right Middle
  "8": "right_middle", "i": "right_middle", "k": "right_middle", ",": "right_middle",
  // Right Ring
  "9": "right_ring", "o": "right_ring", "l": "right_ring", ".": "right_ring",
  // Right Pinky
  "0": "right_pinky", "-": "right_pinky", "=": "right_pinky", "p": "right_pinky", "[": "right_pinky", "]": "right_pinky", "\\": "right_pinky", ";": "right_pinky", "'": "right_pinky", "/": "right_pinky",
};

const FINGER_COLORS: Record<FingerZone, { border: string; bg: string; text: string; label: string }> = {
  left_pinky: { border: "border-pink-500/40", bg: "bg-pink-500/10", text: "text-pink-400", label: "Pinky" },
  left_ring: { border: "border-purple-500/40", bg: "bg-purple-500/10", text: "text-purple-400", label: "Ring" },
  left_middle: { border: "border-blue-500/40", bg: "bg-blue-500/10", text: "text-blue-400", label: "Middle" },
  left_index: { border: "border-cyan-500/40", bg: "bg-cyan-500/10", text: "text-cyan-400", label: "Index" },
  thumb: { border: "border-amber-500/40", bg: "bg-amber-500/10", text: "text-amber-400", label: "Thumbs" },
  right_index: { border: "border-cyan-500/40", bg: "bg-cyan-500/10", text: "text-cyan-400", label: "Index" },
  right_middle: { border: "border-blue-500/40", bg: "bg-blue-500/10", text: "text-blue-400", label: "Middle" },
  right_ring: { border: "border-purple-500/40", bg: "bg-purple-500/10", text: "text-purple-400", label: "Ring" },
  right_pinky: { border: "border-pink-500/40", bg: "bg-pink-500/10", text: "text-pink-400", label: "Pinky" },
};

interface VirtualKeyboardProps {
  expectedNextChar?: string | null;
}

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({ expectedNextChar }) => {
  const { showKeyboard, keyboardLayout } = useSettingsStore();
  const activeKey = useKeyStore((s) => s.activeKey);
  const [displayMode, setDisplayMode] = useState<KeyboardDisplayMode>("classic");
  const [mistakeCounts, setMistakeCounts] = useState<Record<string, number>>({});

  // Query mistake records from Dexie IndexedDB
  useEffect(() => {
    let isMounted = true;
    async function loadMistakes() {
      try {
        const words = await db.words.toArray();
        const counts: Record<string, number> = {};
        for (const w of words) {
          if (w.totalMistakes > 0) {
            for (const char of w.word.toLowerCase()) {
              counts[char] = (counts[char] || 0) + w.totalMistakes;
            }
          }
        }
        if (isMounted) setMistakeCounts(counts);
      } catch {
        // Non-blocking fallback
      }
    }
    loadMistakes();
    return () => {
      isMounted = false;
    };
  }, []);

  const maxMistakes = useMemo(() => {
    const vals = Object.values(mistakeCounts);
    return vals.length > 0 ? Math.max(...vals, 1) : 1;
  }, [mistakeCounts]);

  if (!showKeyboard) return null;

  const rows = KEYBOARD_LAYOUTS[keyboardLayout] || KEYBOARD_LAYOUTS.qwerty;
  const normalizedActive = activeKey ? activeKey.toLowerCase() : null;
  const normalizedNext = expectedNextChar ? expectedNextChar.toLowerCase() : null;

  return (
    <div className="w-full max-w-2xl mx-auto mt-6 p-4 rounded-2xl border border-sub/20 bg-bg/50 backdrop-blur-md select-none transition-all shadow-lg shadow-black/20">
      {/* Top Controls: Layout Indicator & Mode Selector */}
      <div className="flex items-center justify-between mb-3 px-1 text-xs text-sub">
        <div className="flex items-center gap-2">
          <span className="font-mono uppercase font-bold text-main tracking-wider">{keyboardLayout}</span>
          <span className="text-sub/40">·</span>
          <span className="font-mono text-[11px] opacity-70">Touch-Typing Matrix</span>
        </div>

        {/* View Mode Segmented Pill */}
        <div className="flex items-center p-0.5 rounded-lg bg-sub/10 border border-sub/20 text-[10px] font-mono">
          <button
            onClick={() => setDisplayMode("classic")}
            className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all ${
              displayMode === "classic"
                ? "bg-main text-bg font-bold shadow-xs"
                : "text-sub hover:text-text"
            }`}
          >
            <KeyboardIcon className="w-3 h-3" />
            <span>Classic</span>
          </button>
          <button
            onClick={() => setDisplayMode("fingers")}
            className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all ${
              displayMode === "fingers"
                ? "bg-main text-bg font-bold shadow-xs"
                : "text-sub hover:text-text"
            }`}
          >
            <Hand className="w-3 h-3" />
            <span>Fingers</span>
          </button>
          <button
            onClick={() => setDisplayMode("heatmap")}
            className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all ${
              displayMode === "heatmap"
                ? "bg-main text-bg font-bold shadow-xs"
                : "text-sub hover:text-text"
            }`}
          >
            <Flame className="w-3 h-3" />
            <span>Heatmap</span>
          </button>
        </div>
      </div>

      {/* Key Matrix */}
      <div className="flex flex-col gap-1.5 items-center">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-1.5 justify-center">
            {row.map((char) => {
              const isPressed = normalizedActive === char;
              const isNext = normalizedNext === char;
              const finger = FINGER_MAP[char];
              const fingerColor = finger ? FINGER_COLORS[finger] : null;

              // Heatmap intensity calculation
              const mistakeCount = mistakeCounts[char] || 0;
              const heatRatio = mistakeCount / maxMistakes;

              let keyStyle = "bg-bg/80 border border-sub/30 text-sub";

              if (isPressed) {
                keyStyle = "bg-main text-bg border-main scale-95 shadow-md shadow-main/30 font-bold";
              } else if (isNext) {
                keyStyle = "bg-main/15 border-main text-main font-bold ring-2 ring-main/30 animate-pulse";
              } else if (displayMode === "fingers" && fingerColor) {
                keyStyle = `${fingerColor.bg} ${fingerColor.border} ${fingerColor.text} font-medium`;
              } else if (displayMode === "heatmap" && mistakeCount > 0) {
                if (heatRatio > 0.6) {
                  keyStyle = "bg-red-500/25 border-red-500/60 text-red-300 font-bold shadow-[0_0_8px_rgba(239,68,68,0.25)]";
                } else if (heatRatio > 0.3) {
                  keyStyle = "bg-amber-500/20 border-amber-500/50 text-amber-300 font-semibold";
                } else {
                  keyStyle = "bg-yellow-500/10 border-yellow-500/30 text-yellow-300/80";
                }
              }

              return (
                <div
                  key={char}
                  className={`relative w-9 h-10 sm:w-10 sm:h-11 rounded-lg flex items-center justify-center font-mono text-xs sm:text-sm uppercase transition-all duration-75 ${keyStyle}`}
                >
                  <span>{char}</span>
                  {displayMode === "heatmap" && mistakeCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 text-[8px] font-mono px-1 rounded-full bg-red-500/80 text-white font-bold leading-none py-0.5">
                      {mistakeCount}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {/* Space, Backspace & Tab Functional Keys Row */}
        <div className="flex gap-1.5 w-full justify-center mt-1">
          <div
            className={`h-9 px-4 rounded-lg flex items-center justify-center font-mono text-xs border border-sub/30 text-sub transition-all duration-75 ${
              normalizedActive === "backspace"
                ? "bg-error text-bg border-error scale-95 font-bold"
                : displayMode === "fingers"
                ? "border-pink-500/30 bg-pink-500/5 text-pink-400"
                : "bg-bg/80"
            }`}
          >
            Bksp
          </div>
          <div
            className={`h-9 w-44 sm:w-56 rounded-lg flex items-center justify-center font-mono text-xs border border-sub/30 text-sub transition-all duration-75 ${
              normalizedActive === " "
                ? "bg-main text-bg border-main scale-95 font-bold shadow-md shadow-main/20"
                : displayMode === "fingers"
                ? "border-amber-500/40 bg-amber-500/10 text-amber-400 font-medium"
                : "bg-bg/80"
            }`}
          >
            Space
          </div>
          <div
            className={`h-9 px-4 rounded-lg flex items-center justify-center font-mono text-xs border border-sub/30 text-sub transition-all duration-75 ${
              normalizedActive === "tab"
                ? "bg-main text-bg border-main scale-95 font-bold"
                : displayMode === "fingers"
                ? "border-pink-500/30 bg-pink-500/5 text-pink-400"
                : "bg-bg/80"
            }`}
          >
            Tab
          </div>
        </div>
      </div>

      {/* Touch-Typing Finger Placement Guide Legend */}
      {displayMode === "fingers" && (
        <div className="mt-3 pt-3 border-t border-sub/15 flex items-center justify-center gap-3 text-[10px] font-mono text-sub/80 flex-wrap">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-pink-400" /> Pinky
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-400" /> Ring
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-400" /> Middle
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400" /> Index
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> Thumbs
          </span>
        </div>
      )}

      {/* Heatmap Error Density Legend */}
      {displayMode === "heatmap" && (
        <div className="mt-3 pt-3 border-t border-sub/15 flex items-center justify-center gap-4 text-[10px] font-mono text-sub/80">
          <span className="opacity-70">Error Intensity:</span>
          <span className="flex items-center gap-1 text-yellow-300">
            <span className="w-2 h-2 rounded-full bg-yellow-400/60" /> Low
          </span>
          <span className="flex items-center gap-1 text-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> Moderate
          </span>
          <span className="flex items-center gap-1 text-red-300">
            <span className="w-2 h-2 rounded-full bg-red-500" /> Frequent Typos
          </span>
        </div>
      )}
    </div>
  );
};
