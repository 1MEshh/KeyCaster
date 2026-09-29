"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useSettingsStore, SMOOTH_CARET_DURATIONS } from "@/store/useSettingsStore";
import { useSessionStore } from "@/store/useSessionStore";
import { useKeyStore } from "@/store/useKeyStore";
import { playMechanicalClick, playErrorThud, TTSController } from "@/lib/audio";
import { AudioIndicator } from "@/components/HUD/AudioIndicator";
import { LiveStats } from "@/components/HUD/LiveStats";
import { VirtualKeyboard } from "@/components/VirtualKeyboard/VirtualKeyboard";

interface LetterStatus {
  char: string;
  state: "pending" | "correct" | "error";
  typedChar?: string;
}

export const TypingStage: React.FC = () => {
  const {
    caretStyle,
    smoothCaret,
    confidenceMode,
    blindMode,
    stopOnError,
    fontSize,
    soundVolume,
    soundOnClick,
    soundOnError,
    speechRate,
    ttsVoiceURI,
  } = useSettingsStore();

  const {
    currentWord,
    currentIndex,
    mainQueue,
    retryQueue,
    isRetryAttempt,
    completeCurrentWord,
    skipCurrentWord,
    isSessionActive,
    isSessionComplete,
  } = useSessionStore();

  const setActiveKey = useKeyStore((s) => s.setActiveKey);

  // Focus & element refs
  const inputRef = useRef<HTMLInputElement | null>(null);
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Active word typing state
  const [typedLetters, setTypedLetters] = useState<LetterStatus[]>([]);
  const [caretIndex, setCaretIndex] = useState<number>(0);
  const [caretLeft, setCaretLeft] = useState<number>(0);
  const [caretWidth, setCaretWidth] = useState<number>(2);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState<boolean>(true);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Transition & timing refs
  const isTransitioningRef = useRef<boolean>(false);
  const firstKeyTimeRef = useRef<number | null>(null);
  const errorCountRef = useRef<number>(0);
  const backspaceCountRef = useRef<number>(0);
  const totalKeystrokesRef = useRef<number>(0);
  const correctKeystrokesRef = useRef<number>(0);

  // Session-wide live stats
  const [liveWpm, setLiveWpm] = useState<number>(0);
  const [liveAccuracy, setLiveAccuracy] = useState<number>(100);
  const [liveStreak, setLiveStreak] = useState<number>(0);

  // Ref sync for event handlers to prevent closure staleness with 0 latency
  const stateRef = useRef({
    currentWord,
    caretIndex,
    hasError,
    typedLetters,
    stopOnError,
    confidenceMode,
    soundVolume,
    soundOnClick,
    soundOnError,
    speechRate,
    ttsVoiceURI,
    isSpeaking,
  });

  stateRef.current = {
    currentWord,
    caretIndex,
    hasError,
    typedLetters,
    stopOnError,
    confidenceMode,
    soundVolume,
    soundOnClick,
    soundOnError,
    speechRate,
    ttsVoiceURI,
    isSpeaking,
  };

  // Play audio for current word
  const speakCurrentWord = useCallback(() => {
    if (!currentWord?.word) return;
    setIsSpeaking(true);
    // Slight timeout allows previous synthesis cancellation to settle cleanly in browser
    setTimeout(() => {
      TTSController.speakWord(currentWord.word, {
        rate: speechRate,
        voiceURI: ttsVoiceURI,
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
      });
    }, 40);
  }, [currentWord?.word, speechRate, ttsVoiceURI]);

  // Initialize new word
  useEffect(() => {
    if (!currentWord) return;

    isTransitioningRef.current = false;
    letterRefs.current = [];
    firstKeyTimeRef.current = null;
    errorCountRef.current = 0;
    backspaceCountRef.current = 0;

    const chars = currentWord.word.split("").map((c) => ({
      char: c,
      state: "pending" as const,
    }));

    setTypedLetters(chars);
    setCaretIndex(0);
    setCaretLeft(0);
    setHasError(false);
    setIsShaking(false);

    // Speak word on load
    speakCurrentWord();

    // Ensure hidden input stays focused
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }, [currentWord, speakCurrentWord]);

  // Update Caret visual coordinates
  useEffect(() => {
    if (letterRefs.current.length === 0 || !containerRef.current) return;

    const targetEl = letterRefs.current[caretIndex];
    const container = containerRef.current;

    if (targetEl) {
      const containerRect = container.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();
      const left = targetRect.left - containerRect.left;
      setCaretLeft(left);
      setCaretWidth(targetRect.width);
    } else if (caretIndex >= letterRefs.current.length) {
      // Past last letter
      const lastEl = letterRefs.current[letterRefs.current.length - 1];
      if (lastEl) {
        const containerRect = container.getBoundingClientRect();
        const lastRect = lastEl.getBoundingClientRect();
        setCaretLeft(lastRect.right - containerRect.left);
        setCaretWidth(2);
      }
    }
  }, [caretIndex, typedLetters, fontSize]);

  // Handle Keystrokes with zero-latency
  const handleKeyDown = useCallback(
    async (e: React.KeyboardEvent<HTMLInputElement>) => {
      const {
        currentWord: curWord,
        caretIndex: idx,
        hasError: isErr,
        stopOnError: stopMode,
        confidenceMode: confMode,
        soundVolume: vol,
        soundOnClick: clickSfx,
        soundOnError: errSfx,
      } = stateRef.current;

      if (!curWord || !isSessionActive || isSessionComplete || isTransitioningRef.current) {
        return;
      }

      const key = e.key;
      setActiveKey(key);

      // Replay audio shortcut
      if (key === "Tab") {
        e.preventDefault();
        speakCurrentWord();
        return;
      }

      // Skip word shortcut
      if (key === "Escape") {
        e.preventDefault();
        isTransitioningRef.current = true;
        await skipCurrentWord();
        return;
      }

      // Backspace handling
      if (key === "Backspace") {
        e.preventDefault();
        backspaceCountRef.current += 1;

        if (confMode === "max") {
          // Backspace completely disabled
          return;
        }

        if (isErr) {
          // Clear active error state
          setHasError(false);
          setIsShaking(false);
          setTypedLetters((prev) => {
            const copy = [...prev];
            if (copy[idx]) {
              copy[idx] = { ...copy[idx], state: "pending", typedChar: undefined };
            }
            return copy;
          });
          return;
        }

        if (confMode === "on") {
          // Cannot backspace past past mistakes or confirmed letters
          return;
        }

        // Standard backspace
        if (idx > 0) {
          const nextIdx = idx - 1;
          setCaretIndex(nextIdx);
          setTypedLetters((prev) => {
            const copy = [...prev];
            copy[nextIdx] = { ...copy[nextIdx], state: "pending", typedChar: undefined };
            return copy;
          });
        }
        return;
      }

      // Ignore modifiers and non-printable characters
      if (e.ctrlKey || e.altKey || e.metaKey || key.length !== 1) {
        return;
      }

      e.preventDefault();

      // Start timing from first typed character to ignore speech listening idle time
      if (!firstKeyTimeRef.current) {
        firstKeyTimeRef.current = Date.now();
      }

      totalKeystrokesRef.current += 1;

      // In strict letter mode, if in error state, require backspace first!
      if (isErr && stopMode === "letter") {
        if (errSfx) playErrorThud(vol);
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 200);
        return;
      }

      const targetChar = curWord.word[idx]?.toLowerCase();
      const pressedChar = key.toLowerCase();

      if (pressedChar === targetChar) {
        // Correct character typed
        correctKeystrokesRef.current += 1;
        if (clickSfx) playMechanicalClick(vol);

        setTypedLetters((prev) => {
          const copy = [...prev];
          if (copy[idx]) {
            copy[idx] = { ...copy[idx], state: "correct", typedChar: key };
          }
          return copy;
        });

        const nextIndex = idx + 1;
        setCaretIndex(nextIndex);

        // Update live stats
        const currentStreakVal = liveStreak + 1;
        setLiveStreak(currentStreakVal);

        const totalKeys = totalKeystrokesRef.current;
        const correctKeys = correctKeystrokesRef.current;
        const newAcc = Math.round((correctKeys / Math.max(1, totalKeys)) * 100);
        setLiveAccuracy(newAcc);

        // Check if word is completed!
        if (nextIndex >= curWord.word.length) {
          isTransitioningRef.current = true;
          const typingDuration = Math.max(150, Date.now() - (firstKeyTimeRef.current || Date.now()));
          const currentWordWpm = Math.round((curWord.word.length / 5) / (typingDuration / 60000));
          setLiveWpm(currentWordWpm);

          // Seamless transition directly to next word (no grade badge delay)
          setTimeout(async () => {
            await completeCurrentWord({
              errors: errorCountRef.current,
              backspaces: backspaceCountRef.current,
              elapsedMs: typingDuration,
            });
          }, 80);
        }
      } else {
        // Mistake / Error made!
        errorCountRef.current += 1;
        setLiveStreak(0);

        if (errSfx) playErrorThud(vol);
        setHasError(true);
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 250);

        if (stopMode === "letter") {
          // Strict letter mode: halt cursor progression, show error char in red
          setTypedLetters((prev) => {
            const copy = [...prev];
            if (copy[idx]) {
              copy[idx] = { ...copy[idx], state: "error", typedChar: key };
            }
            return copy;
          });
        } else if (stopMode === "off") {
          // Allow typing forward with red letter
          setTypedLetters((prev) => {
            const copy = [...prev];
            if (copy[idx]) {
              copy[idx] = { ...copy[idx], state: "error", typedChar: key };
            }
            return copy;
          });
          setCaretIndex(idx + 1);
        }
      }
    },
    [
      isSessionActive,
      isSessionComplete,
      setActiveKey,
      speakCurrentWord,
      skipCurrentWord,
      liveStreak,
      completeCurrentWord,
    ]
  );

  const handleKeyUp = useCallback(() => {
    setActiveKey(null);
  }, [setActiveKey]);

  if (!currentWord || isSessionComplete) {
    return null;
  }

  const caretDuration = SMOOTH_CARET_DURATIONS[smoothCaret] || "130ms";
  const expectedNextChar = blindMode ? null : (currentWord.word[caretIndex] || null);
  const wordKey = currentWord.id ? `${currentWord.id}-${currentWord.word}` : currentWord.word;

  return (
    <div
      className="w-full flex flex-col items-center justify-center py-6 px-4"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Hidden input to capture keystrokes without virtual DOM re-render drag */}
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
        onKeyUp={handleKeyUp}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />

      {/* Live Stats Bar */}
      <div className="mb-8 w-full max-w-2xl">
        <LiveStats
          wpm={liveWpm}
          accuracy={liveAccuracy}
          streak={liveStreak}
          currentWordIndex={currentIndex}
          totalWords={mainQueue.length}
          retryCount={retryQueue.length}
          isRetryAttempt={isRetryAttempt}
        />
      </div>

      {/* Audio Speaker & Replay Badge */}
      <div className="mb-6">
        <AudioIndicator isPlaying={isSpeaking} onReplay={speakCurrentWord} />
      </div>

      {/* Unfocused Warning Prompt */}
      {!isFocused && (
        <div className="mb-4 text-xs font-mono text-main bg-main/10 border border-main/30 px-3 py-1.5 rounded-full animate-bounce">
          Click or press any key to focus
        </div>
      )}

      {/* Word Box & Caret Container */}
      <div className="relative min-h-[120px] flex flex-col items-center justify-center">
        {/* Word Display with Framer Motion Shake on Mistake */}
        <motion.div
          key={wordKey}
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

          {/* Letter Elements */}
          {typedLetters.map((l, i) => {
            const isCurrent = i === caretIndex;
            const isSpace = l.char === " ";
            let displayChar = l.char;
            let colorClass = "text-sub/40";

            if (blindMode) {
              if (l.state === "correct") {
                displayChar = isSpace ? "\u00A0" : (l.typedChar || l.char);
                colorClass = "text-text font-medium";
              } else if (l.state === "error") {
                displayChar = l.typedChar || (isSpace ? "␣" : l.char);
                colorClass = "text-error font-bold bg-error/15 rounded px-0.5";
              } else {
                // Untyped in blind mode: keep spaces visible between words, letters as underscores
                displayChar = isSpace ? "\u00A0" : "_";
                colorClass = isCurrent ? "text-main/70 font-bold" : "text-sub/30";
              }
            } else {
              if (l.state === "correct") {
                displayChar = isSpace ? "\u00A0" : l.char;
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

      {/* Keyboard Shortcuts Hint */}
      <div className="flex items-center gap-6 mt-4 text-[11px] font-mono text-sub/60">
        <span>
          <kbd className="px-1.5 py-0.5 rounded bg-sub/10 border border-sub/20 text-sub">Tab</kbd> Replay
        </span>
        <span>
          <kbd className="px-1.5 py-0.5 rounded bg-sub/10 border border-sub/20 text-sub">Esc</kbd> Skip
        </span>
      </div>

      {/* Dynamic Virtual Keyboard */}
      <VirtualKeyboard expectedNextChar={expectedNextChar} />
    </div>
  );
};
