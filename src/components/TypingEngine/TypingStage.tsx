"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";
import { useSettingsStore, SMOOTH_CARET_DURATIONS } from "@/store/useSettingsStore";
import { useSessionStore } from "@/store/useSessionStore";
import { useProfileStore } from "@/store/useProfileStore";
import { useKeyStore } from "@/store/useKeyStore";
import {
  playMechanicalClick,
  playErrorThud,
  playStreakChord,
  playSuccessChime,
  TTSController,
} from "@/lib/audio";
import { getWordMetadata } from "@/lib/wordDictionary";
import { AudioIndicator } from "@/components/HUD/AudioIndicator";
import { LiveStats } from "@/components/HUD/LiveStats";
import { VirtualKeyboard } from "@/components/VirtualKeyboard/VirtualKeyboard";
import { SessionEndActions } from "@/components/TypingEngine/SessionEndActions";

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
    blindModePro,
    stopOnError,
    fontSize,
    soundVolume,
    soundOnClick,
    soundOnError,
    speechRate,
    ttsVoiceURI,
    switchSound,
    paceCarMode,
    activeCategory,
    sessionSize,
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
    completedWords,
    initSession,
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
  const [showHint, setShowHint] = useState<boolean>(false);

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

  // Pace Car / Shadow Typist State
  const pbWpm = useProfileStore((s) => s.personalBestWpm) || 70;
  const targetWpm = useMemo(() => {
    if (paceCarMode === "pb") return pbWpm;
    if (paceCarMode === "target_60") return 60;
    if (paceCarMode === "target_80") return 80;
    if (paceCarMode === "target_100") return 100;
    if (paceCarMode === "target_120") return 120;
    return 0;
  }, [paceCarMode, pbWpm]);

  const [ghostCharIndex, setGhostCharIndex] = useState(0);
  const [ghostLeft, setGhostLeft] = useState<number>(0);
  const [ghostWidth, setGhostWidth] = useState<number>(2);

  useEffect(() => {
    if (paceCarMode === "off" || !firstKeyTimeRef.current || isSessionComplete || !currentWord) {
      setGhostCharIndex(0);
      return;
    }

    const interval = setInterval(() => {
      if (!firstKeyTimeRef.current || !currentWord?.word) return;
      const elapsedSec = (Date.now() - firstKeyTimeRef.current) / 1000;
      const charPace = (targetWpm * 5) / 60;
      const expected = Math.min(currentWord.word.length, Math.floor(elapsedSec * charPace));
      setGhostCharIndex(expected);
    }, 100);

    return () => clearInterval(interval);
  }, [paceCarMode, targetWpm, currentWord, isSessionComplete]);

  // Sync ghost cursor coordinates to expected char element
  useEffect(() => {
    if (paceCarMode === "off" || !containerRef.current) return;
    const targetEl = letterRefs.current[ghostCharIndex];
    if (targetEl && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const elRect = targetEl.getBoundingClientRect();
      setGhostLeft(elRect.left - containerRect.left);
      setGhostWidth(elRect.width);
    }
  }, [ghostCharIndex, paceCarMode]);

  const paceDeltaChars = caretIndex - ghostCharIndex;

  // Ref sync for event handlers to prevent closure staleness with 0 latency
  const stateRef = useRef({
    currentWord,
    caretIndex,
    hasError,
    typedLetters,
    stopOnError,
    confidenceMode,
    blindMode,
    blindModePro,
    soundVolume,
    soundOnClick,
    soundOnError,
    speechRate,
    ttsVoiceURI,
    switchSound,
    isSpeaking,
  });

  stateRef.current = {
    currentWord,
    caretIndex,
    hasError,
    typedLetters,
    stopOnError,
    confidenceMode,
    blindMode,
    blindModePro,
    soundVolume,
    soundOnClick,
    soundOnError,
    speechRate,
    ttsVoiceURI,
    switchSound,
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

  // Play slow-motion audio for current word (0.7x)
  const speakCurrentWordSlow = useCallback(() => {
    if (!currentWord?.word) return;
    setIsSpeaking(true);
    setTimeout(() => {
      TTSController.speakWord(currentWord.word, {
        rate: speechRate,
        voiceURI: ttsVoiceURI,
        slow: true,
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
    setShowHint(false);

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
        switchSound: swSound,
      } = stateRef.current;

      if (!curWord || !isSessionActive || isSessionComplete || isTransitioningRef.current) {
        return;
      }

      const key = e.key;
      setActiveKey(key);

      // Replay audio shortcut (Tab = normal, Shift+Tab = slow 0.7x)
      if (key === "Tab") {
        e.preventDefault();
        if (e.shiftKey) {
          speakCurrentWordSlow();
        } else {
          speakCurrentWord();
        }
        return;
      }

      // Skip word shortcut
      if (key === "Escape") {
        e.preventDefault();
        isTransitioningRef.current = true;
        await skipCurrentWord();
        return;
      }

      // Word definition & hint shortcut (Alt+H)
      if ((e.altKey || e.ctrlKey) && (key === "h" || key === "H")) {
        e.preventDefault();
        setShowHint((prev) => !prev);
        return;
      }

      // Backspace handling
      if (key === "Backspace") {
        e.preventDefault();
        backspaceCountRef.current += 1;

        const { blindMode: isBlind, blindModePro: isBlindPro } = stateRef.current;
        if (confMode === "max" || (isBlind && isBlindPro)) {
          // Backspace completely disabled in Confidence Max and Blind Mode Pro
          setIsShaking(true);
          setTimeout(() => setIsShaking(false), 200);
          return;
        }

        if (confMode === "on" && !isErr) {
          // In confidence mode, cannot backspace past confirmed letters
          return;
        }

        // 1. If current letter at caret is in error or typed, delete it back to pending
        if (typedLetters[idx]?.state !== "pending") {
          setHasError(false);
          setIsShaking(false);
          setTypedLetters((prev) => {
            const copy = [...prev];
            for (let i = idx; i < copy.length; i++) {
              if (copy[i]?.state !== "pending") {
                copy[i] = { char: copy[i].char, state: "pending" };
              }
            }
            return copy;
          });
          return;
        }

        // 2. Current letter is already pending, move back 1 letter and clear it
        if (idx > 0) {
          const nextIdx = idx - 1;
          setCaretIndex(nextIdx);
          setHasError(false);
          setIsShaking(false);
          setTypedLetters((prev) => {
            const copy = [...prev];
            for (let i = nextIdx; i < copy.length; i++) {
              if (copy[i]?.state !== "pending") {
                copy[i] = { char: copy[i].char, state: "pending" };
              }
            }
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

      const targetChar = curWord.word[idx]?.toLowerCase();
      const pressedChar = key.toLowerCase();

      if (pressedChar === targetChar) {
        // Correct character typed (clean instant overwrite if in error)
        setHasError(false);
        setIsShaking(false);
        correctKeystrokesRef.current += 1;
        if (clickSfx) playMechanicalClick(vol, swSound);

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

        // Milestone harmonic chord on streaks
        if (
          clickSfx &&
          (currentStreakVal === 10 ||
            currentStreakVal === 25 ||
            currentStreakVal === 50 ||
            currentStreakVal === 100 ||
            (currentStreakVal > 100 && currentStreakVal % 50 === 0))
        ) {
          playStreakChord(currentStreakVal, vol);
        }

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

          // Acoustic feedback: flawless completion chime
          if (clickSfx && errorCountRef.current === 0) {
            playSuccessChime(vol);
          }

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

  if (isSessionComplete) {
    const finalWpm =
      completedWords.length > 0
        ? Math.round(completedWords.reduce((acc, c) => acc + c.wpm, 0) / completedWords.length)
        : liveWpm;
    const finalAcc =
      completedWords.length > 0
        ? Math.round(completedWords.reduce((acc, c) => acc + c.accuracy, 0) / completedWords.length)
        : liveAccuracy;

    return (
      <div className="w-full flex flex-col items-center justify-center py-6 px-4">
        {/* Live Stats Bar with 100% Progress */}
        <div className="mb-8 w-full max-w-2xl">
          <LiveStats
            wpm={finalWpm}
            accuracy={finalAcc}
            streak={liveStreak}
            currentWordIndex={mainQueue.length}
            totalWords={mainQueue.length || sessionSize}
            retryCount={0}
            isRetryAttempt={false}
            isComplete={true}
          />
        </div>

        {/* 15-Word Completion Actions (Preview & Next) */}
        <SessionEndActions
          onNextSession={() => initSession(activeCategory, sessionSize)}
        />
      </div>
    );
  }

  if (!currentWord) {
    return null;
  }

  const caretDuration = SMOOTH_CARET_DURATIONS[smoothCaret] || "130ms";
  const expectedNextChar = blindMode ? null : (currentWord.word[caretIndex] || null);
  const wordKey = currentWord.id ? `${currentWord.id}-${currentWord.word}` : currentWord.word;

  const wordMeta = currentWord
    ? getWordMetadata(currentWord.word) || {
        definition: currentWord.definition,
        partOfSpeech: currentWord.partOfSpeech,
        hint: currentWord.hint,
        phonetic: currentWord.phonetic,
      }
    : null;
  const isHomophone = Boolean(wordMeta?.isHomophone);
  const displayHint = wordMeta?.hint || wordMeta?.definition;

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
      <div className="mb-4 w-full max-w-2xl">
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

      {/* Pace Car Race Delta Indicator */}
      {paceCarMode !== "off" && firstKeyTimeRef.current && (
        <div className="mb-6 flex items-center justify-center animate-fadeIn">
          <div
            className={`text-xs font-mono px-3.5 py-1 rounded-full border flex items-center gap-2 backdrop-blur-md shadow-sm transition-all ${
              paceDeltaChars >= 0
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                : "bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.15)]"
            }`}
          >
            <span>🏎️</span>
            <span className="font-semibold">
              {paceDeltaChars >= 0 ? `+${paceDeltaChars} chars ahead` : `${paceDeltaChars} chars behind`}
            </span>
            <span className="text-[10px] opacity-70">
              ({targetWpm} WPM {paceCarMode === "pb" ? "PB" : "Target"})
            </span>
          </div>
        </div>
      )}

      {/* Audio Speaker, Replay & Context Hint */}
      <div className="mb-6 flex flex-col items-center gap-2.5">
        <div className="flex items-center gap-2">
          <AudioIndicator isPlaying={isSpeaking} onReplay={speakCurrentWord} />
          <button
            type="button"
            onClick={speakCurrentWordSlow}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-sub/30 bg-bg text-sub hover:text-text hover:border-sub/60 text-xs font-mono transition-all shadow-sm active:scale-95"
            title="Slow-Motion Pronunciation (Shift+Tab)"
          >
            <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-1 py-0.5 rounded border border-amber-400/20">0.7x</span>
            <span>Slow</span>
          </button>
          {displayHint && (
            <button
              type="button"
              onClick={() => setShowHint((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full border text-xs font-mono transition-all shadow-sm active:scale-95 ${
                showHint || isHomophone
                  ? "border-main/50 bg-main/10 text-main font-semibold"
                  : "border-sub/30 bg-bg text-sub hover:text-text hover:border-sub/60"
              }`}
              title="Toggle Word Meaning & Hint (Alt+H)"
            >
              <Lightbulb className="w-3.5 h-3.5 text-main" />
              <span>Hint</span>
            </button>
          )}
        </div>

        {/* Word Meaning & Homophone Context Pill */}
        {(isHomophone || showHint) && displayHint && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-main/10 border border-main/30 text-xs font-mono text-text shadow-sm max-w-md text-center"
          >
            <Lightbulb className="w-3.5 h-3.5 text-main shrink-0" />
            <span>
              {wordMeta?.partOfSpeech && (
                <span className="text-sub uppercase text-[10px] font-bold mr-1.5">
                  [{wordMeta.partOfSpeech}]
                </span>
              )}
              <span className="text-text font-medium">{displayHint}</span>
            </span>
          </motion.div>
        )}
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

          {/* PB Pace Car / Shadow Ghost Caret */}
          {paceCarMode !== "off" && firstKeyTimeRef.current && (
            <div
              className="absolute pointer-events-none transition-all duration-150 border-r-2 border-dashed border-cyan-400/80 h-[1.1em] z-10 -ml-[1px]"
              style={{
                left: `${ghostLeft}px`,
                width: `${ghostWidth}px`,
              }}
            >
              <span className="absolute -top-4 -left-1 text-[8px] font-mono px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 whitespace-nowrap shadow-sm">
                🏎️ {targetWpm}
              </span>
            </div>
          )}

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
      <div className="flex items-center gap-5 mt-4 text-[11px] font-mono text-sub/60">
        <span>
          <kbd className="px-1.5 py-0.5 rounded bg-sub/10 border border-sub/20 text-sub">Tab</kbd> Replay
        </span>
        <span>
          <kbd className="px-1.5 py-0.5 rounded bg-sub/10 border border-sub/20 text-sub">Shift+Tab</kbd> Slow
        </span>
        <span>
          <kbd className="px-1.5 py-0.5 rounded bg-sub/10 border border-sub/20 text-sub">Esc</kbd> Skip
        </span>
        <span>
          <kbd className="px-1.5 py-0.5 rounded bg-sub/10 border border-sub/20 text-sub">Alt+H</kbd> Hint
        </span>
      </div>

      {/* Dynamic Virtual Keyboard */}
      <VirtualKeyboard expectedNextChar={expectedNextChar} />
    </div>
  );
};
