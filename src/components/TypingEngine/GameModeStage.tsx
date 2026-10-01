"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, Zap, Skull, Infinity as InfinityIcon, RotateCcw, ArrowLeft, Volume2, Trophy } from "lucide-react";
import { useGameModeStore } from "@/store/useGameModeStore";
import { useSettingsStore, SMOOTH_CARET_DURATIONS } from "@/store/useSettingsStore";
import { playMechanicalClick, playErrorThud, TTSController } from "@/lib/audio";

export const GameModeStage: React.FC = () => {
  const {
    mode,
    isActive,
    isGameOver,
    timeLeft,
    score,
    wordsCompleted,
    currentStreak,
    highestStreak,
    errors,
    totalKeystrokes,
    correctKeystrokes,
    currentWordIndex,
    words,
    startTime,
    endTime,
    tickTimer,
    submitWord,
    recordMistake,
    recordKeystroke,
    resetMode,
    exitToSRS,
  } = useGameModeStore();

  const {
    caretStyle,
    smoothCaret,
    soundVolume,
    soundOnClick,
    soundOnError,
    speechRate,
    ttsVoiceURI,
    fontSize,
  } = useSettingsStore();

  const currentWord = words[currentWordIndex] || "";
  const inputRef = useRef<HTMLInputElement | null>(null);
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [caretIndex, setCaretIndex] = useState(0);
  const [caretLeft, setCaretLeft] = useState(0);
  const [caretWidth, setCaretWidth] = useState(2);
  const [typedLetters, setTypedLetters] = useState<Array<{ char: string; state: "pending" | "correct" | "error"; typedChar?: string }>>([]);
  const [isShaking, setIsShaking] = useState(false);
  const [wordErrors, setWordErrors] = useState(0);

  // Time Attack interval ticker
  useEffect(() => {
    if (!isActive || isGameOver || mode !== "time_attack") return;
    const interval = setInterval(() => {
      tickTimer();
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive, isGameOver, mode, tickTimer]);

  // Audio pronunciation for new word
  const speakCurrentWord = useCallback(() => {
    if (!currentWord) return;
    setTimeout(() => {
      TTSController.speakWord(currentWord, {
        rate: speechRate,
        voiceURI: ttsVoiceURI,
      });
    }, 40);
  }, [currentWord, speechRate, ttsVoiceURI]);

  // Initialize word state on currentWord change
  useEffect(() => {
    if (!currentWord || isGameOver) return;
    const chars = currentWord.split("").map((c) => ({
      char: c,
      state: "pending" as const,
    }));
    setTypedLetters(chars);
    setCaretIndex(0);
    setCaretLeft(0);
    setWordErrors(0);
    speakCurrentWord();

    setTimeout(() => {
      inputRef.current?.focus();
    }, 30);
  }, [currentWord, isGameOver, speakCurrentWord]);

  // Caret coordinate tracking
  useEffect(() => {
    if (letterRefs.current.length === 0 || !containerRef.current) return;
    const targetEl = letterRefs.current[caretIndex];
    const container = containerRef.current;
    if (targetEl) {
      const containerRect = container.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();
      setCaretLeft(targetRect.left - containerRect.left);
      setCaretWidth(targetRect.width);
    } else if (caretIndex >= letterRefs.current.length) {
      const lastEl = letterRefs.current[letterRefs.current.length - 1];
      if (lastEl) {
        const containerRect = container.getBoundingClientRect();
        const lastRect = lastEl.getBoundingClientRect();
        setCaretLeft(lastRect.right - containerRect.left);
        setCaretWidth(2);
      }
    }
  }, [caretIndex, typedLetters, fontSize]);

  // Keystroke handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isGameOver) {
      if (e.key === "Enter") {
        e.preventDefault();
        resetMode();
      } else if (e.key === "Escape") {
        e.preventDefault();
        exitToSRS();
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      exitToSRS();
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      speakCurrentWord();
      return;
    }

    if (e.key === "Backspace") {
      e.preventDefault();
      if (caretIndex > 0) {
        const nextIdx = caretIndex - 1;
        setCaretIndex(nextIdx);
        setTypedLetters((prev) => {
          const copy = [...prev];
          if (copy[nextIdx]) {
            copy[nextIdx] = { ...copy[nextIdx], state: "pending", typedChar: undefined };
          }
          return copy;
        });
      }
      return;
    }

    if (e.ctrlKey || e.altKey || e.metaKey || e.key.length !== 1) return;
    e.preventDefault();

    const targetChar = currentWord[caretIndex]?.toLowerCase();
    const pressedChar = e.key.toLowerCase();

    if (pressedChar === targetChar) {
      recordKeystroke(true);
      if (soundOnClick) playMechanicalClick(soundVolume);

      setTypedLetters((prev) => {
        const copy = [...prev];
        if (copy[caretIndex]) {
          copy[caretIndex] = { ...copy[caretIndex], state: "correct", typedChar: e.key };
        }
        return copy;
      });

      const nextIndex = caretIndex + 1;
      setCaretIndex(nextIndex);

      if (nextIndex >= currentWord.length) {
        // Complete word
        submitWord({ errors: wordErrors, chars: currentWord.length });
      }
    } else {
      // Mistake
      recordKeystroke(false);
      setWordErrors((prev) => prev + 1);
      recordMistake();

      if (soundOnError) playErrorThud(soundVolume);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 200);

      setTypedLetters((prev) => {
        const copy = [...prev];
        if (copy[caretIndex]) {
          copy[caretIndex] = { ...copy[caretIndex], state: "error", typedChar: e.key };
        }
        return copy;
      });
    }
  };

  const caretDuration = SMOOTH_CARET_DURATIONS[smoothCaret] || "130ms";

  // Final stats calculation
  const totalSecs = Math.max(1, Math.round(((endTime || Date.now()) - (startTime || Date.now())) / 1000));
  const finalWpm = Math.round((correctKeystrokes / 5) / (totalSecs / 60));
  const accuracy = totalKeystrokes > 0 ? Math.round((correctKeystrokes / totalKeystrokes) * 100) : 100;

  return (
    <div
      className="w-full flex flex-col items-center justify-center py-6 px-4"
      onClick={() => inputRef.current?.focus()}
    >
      <input
        ref={inputRef}
        type="text"
        autoFocus
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
        className="absolute opacity-0 pointer-events-none -left-[9999px]"
        onKeyDown={handleKeyDown}
      />

      {/* Top Game Bar */}
      <div className="w-full max-w-2xl mb-8 flex items-center justify-between font-mono bg-sub/5 border border-sub/20 rounded-2xl p-4">
        {/* Mode Title & Return */}
        <div className="flex items-center gap-3">
          <button
            onClick={exitToSRS}
            className="p-1.5 rounded-lg border border-sub/30 text-sub hover:text-text hover:bg-sub/10 transition-colors"
            title="Exit to Spaced Repetition (Esc)"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            {mode === "time_attack" && <Timer className="w-4 h-4 text-amber-400" />}
            {mode === "sudden_death" && <Skull className="w-4 h-4 text-red-500" />}
            {mode === "endless" && <InfinityIcon className="w-4 h-4 text-main" />}
            <span className="font-bold text-xs capitalize text-text">
              {mode.replace("_", " ")}
            </span>
          </div>
        </div>

        {/* Live HUD Counters */}
        <div className="flex items-center gap-6 text-xs font-mono">
          {mode === "time_attack" && (
            <div className="flex items-center gap-1.5">
              <span className="text-sub">Time:</span>
              <span className={`font-black text-sm ${timeLeft <= 10 ? "text-error animate-pulse" : "text-text"}`}>
                {timeLeft}s
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <span className="text-sub">Words:</span>
            <span className="font-bold text-text">{wordsCompleted}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-sub">Streak:</span>
            <span className="font-bold text-main">{currentStreak}x</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-sub">Score:</span>
            <span className="font-black text-text">{score}</span>
          </div>
        </div>
      </div>

      {/* Game Over Modal / Card */}
      <AnimatePresence>
        {isGameOver && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-md bg-bg border border-sub/30 rounded-2xl p-6 shadow-2xl font-mono text-center space-y-6 my-6"
          >
            <div className="w-12 h-12 rounded-xl bg-main/15 text-main flex items-center justify-center mx-auto">
              {mode === "sudden_death" ? <Skull className="w-6 h-6 text-error" /> : <Trophy className="w-6 h-6" />}
            </div>

            <div>
              <h2 className="text-xl font-bold text-text capitalize">
                {mode === "sudden_death" ? "Sudden Death Over" : "Time Up!"}
              </h2>
              <p className="text-xs text-sub mt-1">
                {mode === "sudden_death"
                  ? `You survived ${wordsCompleted} words before mistyping.`
                  : `Completed ${wordsCompleted} words with ${finalWpm} WPM.`}
              </p>
            </div>

            {/* Score Grid */}
            <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-sub/5 border border-sub/20 text-xs">
              <div>
                <div className="text-[10px] text-sub uppercase">Score</div>
                <div className="text-lg font-bold text-main">{score}</div>
              </div>
              <div>
                <div className="text-[10px] text-sub uppercase">Speed</div>
                <div className="text-lg font-bold text-text">{finalWpm} <span className="text-[10px] text-sub font-normal">wpm</span></div>
              </div>
              <div>
                <div className="text-[10px] text-sub uppercase">Accuracy</div>
                <div className="text-lg font-bold text-text">{accuracy}%</div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={resetMode}
                className="px-5 py-2.5 rounded-xl bg-main text-bg font-bold text-xs flex items-center gap-2 hover:opacity-90 transition-opacity"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Play Again (Enter)</span>
              </button>
              <button
                onClick={exitToSRS}
                className="px-4 py-2.5 rounded-xl border border-sub/30 text-sub hover:text-text text-xs transition-colors"
              >
                <span>Exit (Esc)</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Word Typing Area */}
      {!isGameOver && (
        <div className="relative min-h-[160px] flex flex-col items-center justify-center">
          {/* Audio hint */}
          <button
            onClick={speakCurrentWord}
            className="mb-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-main/10 border border-main/20 text-main text-xs font-mono hover:bg-main/20 transition-colors"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Replay Audio (Tab)</span>
          </button>

          <motion.div
            key={currentWord}
            ref={containerRef}
            animate={{ x: isShaking ? [-6, 6, -5, 5, -2, 2, 0] : 0 }}
            transition={{ duration: 0.25 }}
            className="relative inline-flex items-center justify-center p-3 font-mono tracking-wider select-none"
            style={{ fontSize: `${fontSize}rem` }}
          >
            {/* Custom Caret */}
            <div
              className={`absolute pointer-events-none transition-all ${
                caretStyle === "default"
                  ? "w-[2.5px] bg-caret h-[1.1em] -ml-[1px]"
                  : caretStyle === "block"
                  ? "bg-caret/25 border border-caret/70 rounded h-[1.2em]"
                  : caretStyle === "underline"
                  ? "h-[3px] bg-caret bottom-2"
                  : "border-2 border-caret rounded h-[1.2em]"
              }`}
              style={{
                left: `${caretLeft}px`,
                width: caretStyle === "default" ? "2.5px" : `${caretWidth}px`,
                transitionDuration: caretDuration,
                transitionTimingFunction: "cubic-bezier(0.2, 0, 0, 1)",
              }}
            />

            {/* Letters */}
            {typedLetters.map((l, i) => {
              const isCurrent = i === caretIndex;
              const isSpace = l.char === " ";
              let displayChar = l.char;
              let colorClass = "text-sub/40";

              if (l.state === "correct") {
                displayChar = isSpace ? "\u00A0" : (l.typedChar || l.char);
                colorClass = "text-text font-medium";
              } else if (l.state === "error") {
                displayChar = l.typedChar || (isSpace ? "␣" : l.char);
                colorClass = "text-error font-bold bg-error/15 rounded px-0.5";
              } else if (isCurrent) {
                displayChar = isSpace ? "\u00A0" : l.char;
                colorClass = "text-sub font-medium";
              } else {
                displayChar = isSpace ? "\u00A0" : l.char;
                colorClass = "text-sub/40";
              }

              return (
                <span
                  key={i}
                  ref={(el) => {
                    letterRefs.current[i] = el;
                  }}
                  className={`relative px-[0.08em] transition-colors duration-100 ${colorClass}`}
                >
                  {displayChar}
                </span>
              );
            })}
          </motion.div>
        </div>
      )}
    </div>
  );
};
