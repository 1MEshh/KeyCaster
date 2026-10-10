"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Volume2,
  Lightbulb,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Trophy,
  CheckCircle2,
  BookOpen,
  Headphones,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useSentenceStore } from "@/store/useSentenceStore";
import { useSettingsStore, SMOOTH_CARET_DURATIONS } from "@/store/useSettingsStore";
import { useProfileStore } from "@/store/useProfileStore";
import { useKeyStore } from "@/store/useKeyStore";
import {
  playMechanicalClick,
  playErrorThud,
  playSuccessChime,
  TTSController,
} from "@/lib/audio";
import { getTargetText } from "@/store/useSentenceStore";
import { gradeSentence, calculateSentenceXP } from "@/lib/sentenceGrader";
import { AcousticVisualizer } from "@/components/HUD/AcousticVisualizer";
import { VirtualKeyboard } from "@/components/VirtualKeyboard/VirtualKeyboard";
import { LiveStats } from "@/components/HUD/LiveStats";

interface CaretCoordinates {
  left: number;
  top: number;
  width: number;
  height: number;
}

export const SentenceStage: React.FC = () => {
  const {
    currentSentence,
    sentenceQueue,
    queueIndex,
    words,
    currentWordIndex,
    currentLetterIndex,
    isSessionActive,
    isSentenceComplete,
    isSessionComplete,
    showVocabHint,
    isSpeaking,
    stats,
    handleKeyStroke,
    handleSpace,
    handleBackspace,
    toggleVocabHint,
    setIsSpeaking,
    nextSentence,
    restartSession,
    skipSentence,
    initSentenceSession,
    practiceType,
    activeCategory,
    activeDifficulty,
  } = useSentenceStore();

  const streak = useProfileStore((s) => s.streak);

  const {
    caretStyle,
    smoothCaret,
    confidenceMode,
    stopOnError,
    fontSize,
    soundVolume,
    soundOnClick,
    soundOnError,
    switchSound,
    paceCarMode,
    speechRate,
    ttsVoiceURI,
  } = useSettingsStore();

  const setActiveKey = useKeyStore((s) => s.setActiveKey);

  // Focus & element refs
  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const letterRefs = useRef<Map<string, HTMLSpanElement>>(new Map());

  // Caret visual position
  const [caretPos, setCaretPos] = useState<CaretCoordinates>({
    left: 0,
    top: 0,
    width: 2,
    height: 24,
  });
  const [isFocused, setIsFocused] = useState<boolean>(true);

  // Pace Car / Shadow Typist Calculation
  const pbWpm = useProfileStore((s) => s.personalBestWpm) || 70;
  const targetWpm = useMemo(() => {
    if (paceCarMode === "pb") return pbWpm;
    if (paceCarMode === "target_60") return 60;
    if (paceCarMode === "target_80") return 80;
    if (paceCarMode === "target_100") return 100;
    if (paceCarMode === "target_120") return 120;
    return 0;
  }, [paceCarMode, pbWpm]);

  const targetSentenceText = currentSentence ? getTargetText(currentSentence) : "";
  const sentencePaceDelta = useMemo(() => {
    if (paceCarMode === "off" || !stats.elapsedMs || stats.elapsedMs <= 0) return 0;
    const charPace = (targetWpm * 5) / 60;
    const expectedChars = Math.min(
      targetSentenceText.length,
      Math.floor((stats.elapsedMs / 1000) * charPace)
    );
    const typedChars =
      words.slice(0, currentWordIndex).reduce((acc, w) => acc + w.word.length + 1, 0) +
      currentLetterIndex;
    return typedChars - expectedChars;
  }, [
    paceCarMode,
    stats.elapsedMs,
    targetWpm,
    targetSentenceText.length,
    words,
    currentWordIndex,
    currentLetterIndex,
  ]);

  // Audio synthesis: speak full target sentence
  const speakFullSentence = useCallback(
    (slow = false) => {
      const targetText = getTargetText(currentSentence);
      if (!targetText) return;

      setIsSpeaking(true);
      setTimeout(() => {
        TTSController.speakWord(targetText, {
          rate: speechRate,
          voiceURI: ttsVoiceURI,
          slow,
          onStart: () => setIsSpeaking(true),
          onEnd: () => setIsSpeaking(false),
        });
      }, 50);
    },
    [currentSentence, speechRate, ttsVoiceURI, setIsSpeaking]
  );

  // Audio synthesis: speak remaining sentence from active word
  const speakRemainingSentence = useCallback(
    (slow = false) => {
      const remainingWords = words.slice(currentWordIndex).map((w) => w.word).join(" ");
      const targetText = getTargetText(currentSentence);
      const textToSpeak = remainingWords.trim() || targetText;
      if (!textToSpeak) return;

      setIsSpeaking(true);
      setTimeout(() => {
        TTSController.speakWord(textToSpeak, {
          rate: speechRate,
          voiceURI: ttsVoiceURI,
          slow,
          onStart: () => setIsSpeaking(true),
          onEnd: () => setIsSpeaking(false),
        });
      }, 50);
    },
    [words, currentWordIndex, currentSentence, speechRate, ttsVoiceURI, setIsSpeaking]
  );

  // Speak full sentence on initial mount / new sentence
  useEffect(() => {
    if (currentSentence && !isSentenceComplete && !isSessionComplete) {
      speakFullSentence(false);
      // Ensure focus on new sentence
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [currentSentence, isSentenceComplete, isSessionComplete, speakFullSentence]);

  // Trigger celebration chime upon sentence completion
  useEffect(() => {
    if (isSentenceComplete && soundOnClick) {
      playSuccessChime(soundVolume);
    }
  }, [isSentenceComplete, soundOnClick, soundVolume]);

  // Trigger celebration micro-confetti upon completing batch
  useEffect(() => {
    if (isSessionComplete) {
      try {
        confetti({
          particleCount: 70,
          spread: 65,
          origin: { y: 0.6 },
          colors: ["#38bdf8", "#88c0d0", "#ffffff", "#e2b714"],
        });
      } catch {
        // Safe fallback
      }
    }
  }, [isSessionComplete]);

  // Multi-line Caret math calculation
  const updateCaretPosition = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const currentKey = `${currentWordIndex}-${currentLetterIndex}`;
    const targetEl = letterRefs.current.get(currentKey);

    if (targetEl) {
      const containerRect = container.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();

      setCaretPos({
        left: targetRect.left - containerRect.left,
        top: targetRect.top - containerRect.top,
        width: caretStyle === "block" ? targetRect.width : 2,
        height: targetRect.height,
      });

      // Smoothly scroll active word into view if needed
      targetEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    } else {
      // Caret is past the word characters (waiting for Space or at end of word)
      const activeWord = words[currentWordIndex];
      if (activeWord && activeWord.letters.length > 0) {
        const lastLetterKey = `${currentWordIndex}-${activeWord.letters.length - 1}`;
        const lastEl = letterRefs.current.get(lastLetterKey);
        if (lastEl) {
          const containerRect = container.getBoundingClientRect();
          const lastRect = lastEl.getBoundingClientRect();

          setCaretPos({
            left: lastRect.right - containerRect.left,
            top: lastRect.top - containerRect.top,
            width: 2,
            height: lastRect.height,
          });
        }
      }
    }
  }, [currentWordIndex, currentLetterIndex, words, caretStyle]);

  // Recalculate Caret on index changes or resize
  useEffect(() => {
    updateCaretPosition();
  }, [updateCaretPosition, fontSize]);

  useEffect(() => {
    const handleResize = () => updateCaretPosition();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateCaretPosition]);

  // Handle typing input
  const handleKeyDown = useCallback(
    async (e: React.KeyboardEvent<HTMLInputElement>) => {
      const key = e.key;
      setActiveKey(key);

      // Replay audio (Tab = normal from current word, Shift+Tab = 0.72x slow from current word)
      if (key === "Tab") {
        e.preventDefault();
        speakRemainingSentence(e.shiftKey);
        return;
      }

      // Hint toggle shortcut (Alt+H)
      if ((e.altKey || e.ctrlKey) && (key === "h" || key === "H")) {
        e.preventDefault();
        toggleVocabHint();
        return;
      }

      // Advance to next sentence on Enter when complete
      if (key === "Enter" && isSentenceComplete) {
        e.preventDefault();
        nextSentence();
        return;
      }

      // Skip current sentence on Escape
      if (key === "Escape") {
        e.preventDefault();
        await skipSentence();
        return;
      }

      // Backspace
      if (key === "Backspace") {
        e.preventDefault();
        handleBackspace(confidenceMode);
        return;
      }

      // Space
      if (key === " ") {
        e.preventDefault();
        await handleSpace(stopOnError);
        return;
      }

      // Printable character typing
      if (key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();

        // Sound FX detection
        const activeWord = words[currentWordIndex];
        const targetLetter = activeWord?.letters[currentLetterIndex];
        if (targetLetter) {
          const isCorrect =
            key === targetLetter.char ||
            (/['’‘`]/.test(targetLetter.char) && /['`]/.test(key)) ||
            (/["“”«»]/.test(targetLetter.char) && key === '"') ||
            (/[-–—]/.test(targetLetter.char) && key === "-");

          if (isCorrect) {
            if (soundOnClick) playMechanicalClick(soundVolume, switchSound);
          } else {
            if (soundOnError) playErrorThud(soundVolume);
          }
        }

        await handleKeyStroke(key, stopOnError, confidenceMode);
      }
    },
    [
      setActiveKey,
      speakRemainingSentence,
      toggleVocabHint,
      isSentenceComplete,
      nextSentence,
      skipSentence,
      handleBackspace,
      confidenceMode,
      handleSpace,
      stopOnError,
      words,
      currentWordIndex,
      currentLetterIndex,
      soundOnClick,
      soundVolume,
      soundOnError,
      handleKeyStroke,
    ]
  );

  const handleKeyUp = useCallback(() => {
    setActiveKey(null);
  }, [setActiveKey]);

  // Session Complete Batch Summary View
  if (isSessionComplete) {
    const totalWordsCount = sentenceQueue.reduce((acc, s) => {
      const text = getTargetText(s);
      return acc + text.split(/\s+/).length;
    }, 0);

    return (
      <div className="w-full max-w-3xl flex flex-col items-center justify-center py-10 px-4 animate-fadeIn">
        <div className="w-full bg-sub/10 border border-sub/20 rounded-3xl p-8 backdrop-blur-md shadow-2xl flex flex-col items-center text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-main/20 text-main flex items-center justify-center shadow-lg shadow-main/10">
            <Trophy className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-text mb-1">Sentence Practice Completed!</h2>
            <p className="text-sm text-sub">
              Completed all {sentenceQueue.length} practice sentences in this batch.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 w-full max-w-lg pt-2">
            <div className="p-4 rounded-xl bg-sub/15 border border-sub/20">
              <span className="text-xs text-sub uppercase font-bold tracking-wider">Speed</span>
              <p className="text-2xl font-black text-main mt-1">{stats.wpm} <span className="text-xs font-normal text-sub">WPM</span></p>
            </div>
            <div className="p-4 rounded-xl bg-sub/15 border border-sub/20">
              <span className="text-xs text-sub uppercase font-bold tracking-wider">Accuracy</span>
              <p className="text-2xl font-black text-text mt-1">{stats.accuracy}%</p>
            </div>
            <div className="p-4 rounded-xl bg-sub/15 border border-sub/20">
              <span className="text-xs text-sub uppercase font-bold tracking-wider">Total Words</span>
              <p className="text-2xl font-black text-text mt-1">{totalWordsCount}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 w-full max-w-sm">
            <button
              onClick={() => initSentenceSession(practiceType, activeCategory, activeDifficulty)}
              className="w-full py-3 px-5 rounded-xl bg-main text-bg font-bold flex items-center justify-center gap-2 hover:opacity-95 transition-opacity shadow-lg shadow-main/20"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Next Batch</span>
            </button>
            <button
              onClick={restartSession}
              className="w-full py-3 px-5 rounded-xl border border-sub/30 text-sub hover:text-text font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <span>Retry Session</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentSentence || words.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-sub font-mono text-sm">
        <div className="w-6 h-6 border-2 border-main border-t-transparent rounded-full animate-spin mb-3" />
        <span>Loading practice sentences...</span>
      </div>
    );
  }

  const targetText = getTargetText(currentSentence);
  const sentenceGrade = gradeSentence({
    charCount: targetText.length,
    correctChars: Math.max(1, targetText.length - stats.errors),
    totalKeystrokes: targetText.length + stats.errors,
    errors: stats.errors,
    elapsedMs: stats.elapsedMs,
  });
  const sentenceXP = calculateSentenceXP({
    charCount: targetText.length,
    difficulty: currentSentence.difficulty,
    accuracy: stats.accuracy,
    errors: stats.errors,
  });

  const expectedNextChar = useMemo(() => {
    if (isSentenceComplete) return null;
    const curWordObj = words[currentWordIndex];
    if (!curWordObj) return null;
    const curLetter = curWordObj.letters[currentLetterIndex];
    return curLetter?.char || null;
  }, [words, currentWordIndex, currentLetterIndex, isSentenceComplete]);

  return (
    <div
      className="w-full max-w-4xl flex flex-col items-center justify-center px-4 py-6 select-none"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Hidden input to capture keyboard events with zero latency */}
      <input
        ref={inputRef}
        type="text"
        className="opacity-0 absolute -top-96 left-0 pointer-events-none"
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck="false"
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />

      {/* Top HUD: Queue Progress, Category & Difficulty Badges */}
      <div className="w-full flex items-center justify-between mb-6 text-xs text-sub font-mono">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-text">
            Sentence {queueIndex + 1}
          </span>
          <span className="opacity-40">/</span>
          <span className="opacity-70">{sentenceQueue.length}</span>

          <span className="ml-3 px-2 py-0.5 rounded-full bg-sub/15 text-sub text-[11px] uppercase tracking-wider font-semibold">
            {currentSentence.category}
          </span>

          <span
            className={`px-2 py-0.5 rounded-full text-[11px] uppercase tracking-wider font-semibold ${
              currentSentence.difficulty === "beginner"
                ? "bg-emerald-500/15 text-emerald-400"
                : currentSentence.difficulty === "intermediate"
                ? "bg-amber-500/15 text-amber-400"
                : "bg-purple-500/15 text-purple-400"
            }`}
          >
            {currentSentence.difficulty}
          </span>
        </div>

        {/* Audio Dictation & Hint Buttons */}
        <div className="flex items-center gap-2">
          {/* Audio Listen Pill (Remaining Words) */}
          <button
            type="button"
            onClick={() => speakRemainingSentence(false)}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all text-xs font-medium border ${
              isSpeaking
                ? "bg-main/20 text-main border-main/40 shadow-sm shadow-main/20"
                : "bg-sub/10 text-sub hover:text-text border-sub/20 hover:border-sub/40"
            }`}
            title="Press Tab to listen remaining words, Shift+Tab for slow motion (0.72x)"
          >
            {isSpeaking ? (
              <AcousticVisualizer isPlaying={true} size="sm" />
            ) : (
              <Volume2 className="w-3.5 h-3.5" />
            )}
            <span>{isSpeaking ? "Speaking..." : "Listen"}</span>
            <kbd className="hidden sm:inline px-1 py-0.5 bg-sub/20 text-[10px] rounded text-sub">Tab</kbd>
          </button>

          {/* Full Audio Pill (Whole sentence from start) */}
          <button
            type="button"
            onClick={() => speakFullSentence(false)}
            className="px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all text-xs font-medium border bg-sub/10 text-sub hover:text-text border-sub/20 hover:border-sub/40"
            title="Full Audio: Replay entire sentence from the beginning"
          >
            <Headphones className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Full Audio</span>
          </button>

          <button
            type="button"
            onClick={toggleVocabHint}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all text-xs font-medium border ${
              showVocabHint
                ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                : "bg-sub/10 text-sub hover:text-text border-sub/20 hover:border-sub/40"
            }`}
            title="Toggle Hint (Alt+H)"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Hint</span>
            <kbd className="hidden sm:inline px-1 py-0.5 bg-sub/20 text-[10px] rounded text-sub">Alt+H</kbd>
          </button>
        </div>
      </div>

      {/* Live Stats Bar & Dynamic Tachometer */}
      <div className="w-full max-w-2xl mb-5">
        <LiveStats
          wpm={stats.wpm}
          accuracy={stats.accuracy}
          streak={streak}
          currentWordIndex={currentWordIndex}
          totalWords={words.length}
          retryCount={0}
          isRetryAttempt={false}
          isComplete={isSentenceComplete}
        />
      </div>

      {/* Interactive Multi-word Typing Board */}
      <div
        ref={containerRef}
        className="w-full relative min-h-[180px] p-8 rounded-3xl bg-sub/5 border border-sub/20 backdrop-blur-sm shadow-xl flex flex-col justify-center overflow-hidden cursor-text transition-all"
        style={{ fontSize: `${fontSize * 1.35}rem` }}
      >
        {/* Multi-line Caret Cursor */}
        {!isSentenceComplete && (
          <div
            className={`absolute pointer-events-none transition-all z-10 ${
              caretStyle === "block"
                ? "bg-caret/25 border border-caret rounded-sm"
                : caretStyle === "underline"
                ? "border-b-2 border-caret"
                : caretStyle === "outline"
                ? "border-2 border-caret rounded-sm bg-transparent"
                : "bg-caret rounded-full shadow-sm shadow-caret"
            } ${isFocused ? "opacity-100" : "opacity-40 animate-pulse"}`}
            style={{
              left: `${caretPos.left}px`,
              top: `${caretPos.top}px`,
              width: caretStyle === "default" ? "2px" : `${caretPos.width}px`,
              height: `${caretPos.height}px`,
              transitionDuration: SMOOTH_CARET_DURATIONS[smoothCaret] || "100ms",
              transitionTimingFunction: "cubic-bezier(0.2, 0, 0, 1)",
            }}
          />
        )}

        {/* Word Wrapped Multi-word Sentence with Word Masking */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-3 font-mono leading-relaxed select-none">
          {words.map((w, wIdx) => {
            const isActiveWord = wIdx === currentWordIndex;
            return (
              <div
                key={wIdx}
                className={`flex items-center px-1.5 py-0.5 rounded-lg transition-colors ${
                  isActiveWord ? "bg-sub/15 ring-1 ring-main/30" : ""
                }`}
              >
                {w.letters.map((l, lIdx) => {
                  const isCurrentCaret = isActiveWord && lIdx === currentLetterIndex;
                  let displayChar: string;
                  let letterClass: string;

                  if (l.state === "correct") {
                    displayChar = l.typedChar || l.char;
                    letterClass = "text-text font-semibold";
                  } else if (l.state === "error") {
                    displayChar = l.typedChar || l.char;
                    letterClass = "text-error font-bold bg-error/20 rounded px-0.5";
                  } else {
                    // state === "pending"
                    if (l.char === " ") {
                      displayChar = "\u00A0";
                      letterClass = "text-sub/40";
                    } else if (/[.,?!'"\-;:—–’“”«»]/.test(l.char)) {
                      displayChar = l.char;
                      letterClass = "text-sub/50";
                    } else {
                      displayChar = "_";
                      letterClass = isCurrentCaret ? "text-main/60 font-semibold" : "text-sub/40";
                    }
                  }

                  return (
                    <span
                      key={lIdx}
                      ref={(el) => {
                        if (el) letterRefs.current.set(`${wIdx}-${lIdx}`, el);
                        else letterRefs.current.delete(`${wIdx}-${lIdx}`);
                      }}
                      className={`transition-colors duration-75 inline-block ${letterClass}`}
                    >
                      {displayChar}
                    </span>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Author Quote Attribution (if present) */}
        {"author" in currentSentence && currentSentence.author && (
          <div className="mt-6 text-right text-xs font-mono text-sub/60 italic">
            — {currentSentence.author}
          </div>
        )}
      </div>

      {/* Vocabulary / Grammar Hint Drawer (Alt+H) */}
      <AnimatePresence>
        {showVocabHint && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            className="w-full mt-4 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-text font-mono text-xs overflow-hidden"
          >
            <div className="flex items-center gap-2 text-amber-400 font-bold mb-2">
              <BookOpen className="w-4 h-4" />
              <span>Sentence Study Guide</span>
            </div>
            <p className="text-sub leading-relaxed mb-3">
              Target length: <span className="text-text font-semibold">{targetText.length} characters</span> across{" "}
              <span className="text-text font-semibold">{words.length} words</span>.
            </p>
            <div className="flex flex-wrap gap-2">
              {words.map((w, i) => (
                <span key={i} className="px-2 py-1 rounded bg-sub/15 text-text text-xs border border-sub/15">
                  {w.word.replace(/[.,?!;:"]+/g, "")}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Sentence Performance Footer */}
      <div className="w-full mt-6 flex items-center justify-between text-xs font-mono text-sub">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5">
            <span className="text-sub/60 uppercase text-[10px]">WPM:</span>
            <span className="text-main font-bold text-sm">{stats.wpm}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sub/60 uppercase text-[10px]">Acc:</span>
            <span className="text-text font-bold text-sm">{stats.accuracy}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sub/60 uppercase text-[10px]">Errors:</span>
            <span className={`font-bold text-sm ${stats.errors > 0 ? "text-error" : "text-sub"}`}>
              {stats.errors}
            </span>
          </div>

          {/* Pace Car Race Delta Indicator */}
          {paceCarMode !== "off" && stats.elapsedMs > 500 && (
            <div
              className={`px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 text-[11px] transition-all ${
                sentencePaceDelta >= 0
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/30"
              }`}
            >
              <span>🏎️</span>
              <span className="font-semibold">
                {sentencePaceDelta >= 0 ? `+${sentencePaceDelta} chars ahead` : `${sentencePaceDelta} chars behind`}
              </span>
              <span className="text-[9px] opacity-70">
                ({targetWpm} WPM {paceCarMode === "pb" ? "PB" : "Target"})
              </span>
            </div>
          )}
        </div>

        <div className="text-[11px] text-sub/50 hidden sm:block">
          <kbd className="px-1 bg-sub/10 rounded">Tab</kbd> Audio ·{" "}
          <kbd className="px-1 bg-sub/10 rounded">Shift+Tab</kbd> Slow (0.72x) ·{" "}
          <kbd className="px-1 bg-sub/10 rounded">Esc</kbd> Skip
        </div>
      </div>

      {/* Sentence Complete Interstitial Modal */}
      <AnimatePresence>
        {isSentenceComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-full mt-6 p-6 rounded-2xl bg-sub/15 border border-main/30 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl shadow-main/5 animate-fadeIn"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-main/20 text-main flex items-center justify-center font-bold">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base text-text">{sentenceGrade.label}</span>
                  <span className="px-2 py-0.5 rounded bg-main/20 text-main text-xs font-bold">
                    +{sentenceXP} XP
                  </span>
                </div>
                <p className="text-xs text-sub mt-0.5">
                  {stats.wpm} WPM {sentenceGrade.rawWpm ? `(${sentenceGrade.rawWpm} Raw)` : ""} · {stats.accuracy}% Accuracy · {sentenceGrade.consistency ?? 100}% Consistency · {stats.errors} error{stats.errors === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => speakFullSentence(false)}
                className="px-4 py-2.5 rounded-xl border border-sub/30 text-sub hover:text-text text-xs font-semibold flex items-center gap-2 transition-colors"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Replay</span>
              </button>
              <button
                onClick={nextSentence}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-main text-bg text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-main/20"
              >
                <span>Next Sentence</span>
                <ArrowRight className="w-3.5 h-3.5" />
                <kbd className="px-1.5 py-0.5 bg-bg/20 text-[10px] rounded text-bg">Enter</kbd>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Virtual Keyboard with Touch Zones & Heatmap */}
      <VirtualKeyboard expectedNextChar={expectedNextChar} />
    </div>
  );
};
