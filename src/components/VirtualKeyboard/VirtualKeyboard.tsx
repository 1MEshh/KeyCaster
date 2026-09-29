"use client";

import React from "react";
import { useSettingsStore, type KeyboardLayout } from "@/store/useSettingsStore";
import { useKeyStore } from "@/store/useKeyStore";

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

interface VirtualKeyboardProps {
  expectedNextChar?: string | null;
}

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({ expectedNextChar }) => {
  const { showKeyboard, keyboardLayout } = useSettingsStore();
  const activeKey = useKeyStore((s) => s.activeKey);

  if (!showKeyboard) return null;

  const rows = KEYBOARD_LAYOUTS[keyboardLayout] || KEYBOARD_LAYOUTS.qwerty;
  const normalizedActive = activeKey ? activeKey.toLowerCase() : null;
  const normalizedNext = expectedNextChar ? expectedNextChar.toLowerCase() : null;

  return (
    <div className="w-full max-w-2xl mx-auto mt-8 p-4 rounded-xl border border-sub/20 bg-bg/40 backdrop-blur-sm select-none transition-all">
      <div className="flex items-center justify-between mb-2 px-1 text-xs text-sub">
        <span className="font-mono uppercase tracking-wider">{keyboardLayout}</span>
        <span className="font-mono text-[10px] opacity-70">Interactive Keymap</span>
      </div>

      <div className="flex flex-col gap-1.5 items-center">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-1.5 justify-center">
            {row.map((char) => {
              const isPressed = normalizedActive === char;
              const isNext = normalizedNext === char;

              let keyStyle = "bg-bg border border-sub/30 text-sub";
              if (isPressed) {
                keyStyle = "bg-main text-bg border-main scale-95 shadow-md shadow-main/20 font-bold";
              } else if (isNext) {
                keyStyle = "bg-sub/10 border-main/60 text-text ring-1 ring-main/30";
              }

              return (
                <div
                  key={char}
                  className={`w-9 h-10 sm:w-10 sm:h-11 rounded-lg flex items-center justify-center font-mono text-xs sm:text-sm uppercase transition-all duration-75 ${keyStyle}`}
                >
                  {char}
                </div>
              );
            })}
          </div>
        ))}

        {/* Space and functional keys row */}
        <div className="flex gap-1.5 w-full justify-center mt-1">
          <div
            className={`h-9 px-4 rounded-lg flex items-center justify-center font-mono text-xs border border-sub/30 text-sub transition-all duration-75 ${
              normalizedActive === "backspace" ? "bg-error text-bg border-error scale-95" : "bg-bg"
            }`}
          >
            Bksp
          </div>
          <div
            className={`h-9 w-44 sm:w-56 rounded-lg flex items-center justify-center font-mono text-xs border border-sub/30 text-sub transition-all duration-75 ${
              normalizedActive === " " ? "bg-main text-bg border-main scale-95" : "bg-bg"
            }`}
          >
            Space
          </div>
          <div
            className={`h-9 px-4 rounded-lg flex items-center justify-center font-mono text-xs border border-sub/30 text-sub transition-all duration-75 ${
              normalizedActive === "tab" ? "bg-main text-bg border-main scale-95" : "bg-bg"
            }`}
          >
            Tab (Audio)
          </div>
        </div>
      </div>
    </div>
  );
};
