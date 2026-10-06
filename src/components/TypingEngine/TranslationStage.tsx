"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Volume2,
  BookOpen,
  ArrowRight,
  RotateCcw,
  Trophy,
  CheckCircle2,
  Sparkles,
  Languages,
  HelpCircle,
  Eye,
  EyeOff,
  Headphones,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useSentenceStore } from "@/store/useSentenceStore";
import { useSettingsStore, SMOOTH_CARET_DURATIONS } from "@/store/useSettingsStore";
import { useKeyStore } from "@/store/useKeyStore";
import { playMechanicalClick, playErrorThud, TTSController } from "@/lib/audio";
import { getTargetText } from "@/store/useSentenceStore";
import { gradeSentence, calculateSentenceXP } from "@/lib/sentenceGrader";
import type { BilingualSentence } from "@/lib/sentenceDictionary";

interface CaretCoordinates {
  left: number;
  top: number;
  width: number;
  height: number;
}

export const TranslationStage: React.FC = () => {
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

  const {
    caretStyle,
    smoothCaret,
    confidenceMode,
    stopOnError,
    fontSize,
    soundVolume,
    soundOnClick,
    soundOnError,
    speechRate,
    ttsVoiceURI,
  } = useSettingsStore();

  const setActiveKey = useKeyStore((s) => s.setActiveKey);

  // Focus & element refs
  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const letterRefs = useRef<Map<string, HTMLSpanElement>>(new Map());

  // Show literal translation toggle (hidden by default to avoid revealing translation)
  const [showLiteral, setShowLiteral] = useState<boolean>(false);

  // Reset showLiteral when sentence changes
  useEffect(() => {
    setShowLiteral(false);
  }, [currentSentence]);

  // Caret visual position
  const [caretPos, setCaretPos] = useState<CaretCoordinates>({
    left: 0,
    top: 0,
    width: 2,
    height: 24,
  });
  const [isFocused, setIsFocused] = useState<boolean>(true);

  const bilingualSentence = currentSentence as BilingualSentence | null;
  const arabicText = bilingualSentence && "arabic" in bilingualSentence ? bilingualSentence.arabic : "";
  const literalMeaning =
    bilingualSentence && "literalMeaning" in bilingualSentence ? bilingualSentence.literalMeaning : "";
  const vocabCards =
    bilingualSentence && "vocabularyCards" in bilingualSentence
      ? bilingualSentence.vocabularyCards || []
      : [];
  const targetEnglish = getTargetText(currentSentence);

  // Speak full target English sentence
  const speakFullSentence = useCallback(
    (slow = false) => {
      if (!targetEnglish) return;
      setIsSpeaking(true);
      setTimeout(() => {
        TTSController.speakWord(targetEnglish, {
          rate: speechRate,
          voiceURI: ttsVoiceURI,
          slow,
          onStart: () => setIsSpeaking(true),
          onEnd: () => setIsSpeaking(false),
        });
      }, 50);
    },
    [targetEnglish, speechRate, ttsVoiceURI, setIsSpeaking]
  );

  // Mid-sentence replay from active word to the end
  const speakRemainingSentence = useCallback(
    (slow = false) => {
      const remainingWords = words.slice(currentWordIndex).map((w) => w.word).join(" ");
      const textToSpeak = remainingWords.trim() || targetEnglish;
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
    [words, currentWordIndex, targetEnglish, speechRate, ttsVoiceURI, setIsSpeaking]
  );

  // Speak full sentence once on mount / new sentence & ensure input focus
  useEffect(() => {
    if (currentSentence && !isSentenceComplete && !isSessionComplete) {
      speakFullSentence(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [currentSentence, isSentenceComplete, isSessionComplete, speakFullSentence]);

  // Celebratory confetti on batch complete
  useEffect(() => {
    if (isSessionComplete) {
      try {
        confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#38bdf8", "#88c0d0", "#ffffff", "#e2b714"],
        });
      } catch {
        // Safe fallback
      }
    }
  }, [isSessionComplete]);

  // Multi-line Caret Math calculation
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

      targetEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    } else {
      // Caret is at end of word waiting for Space
      const activeWord = words[currentWordIndex];
      if (activeWord && activeWord.letters.length > 0) {
        const lastKey = `${currentWordIndex}-${activeWord.letters.length - 1}`;
        const lastEl = letterRefs.current.get(lastKey);
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

  // Caret position updates on changes and resize
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

      // Replay Audio (Tab = normal from current word, Shift+Tab = 0.72x slow from current word)
      if (key === "Tab") {
        e.preventDefault();
        speakRemainingSentence(e.shiftKey);
        return;
      }

      // Vocabulary Hint Toggle (Alt+H)
      if ((e.altKey || e.ctrlKey) && (key === "h" || key === "H")) {
        e.preventDefault();
        toggleVocabHint();
        return;
      }

      // Next Sentence on Enter when complete
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

      // Single printable character
      if (key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();

        const activeWord = words[currentWordIndex];
        const targetLetter = activeWord?.letters[currentLetterIndex];
        if (targetLetter) {
          const isCorrect =
            key === targetLetter.char ||
            (/['’‘`]/.test(targetLetter.char) && /['`]/.test(key)) ||
            (/["“”«»]/.test(targetLetter.char) && key === '"') ||
            (/[-–—]/.test(targetLetter.char) && key === "-");

          if (isCorrect) {
            if (soundOnClick) playMechanicalClick(soundVolume);
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
    return (
      <div className="w-full max-w-3xl flex flex-col items-center justify-center py-10 px-4 animate-fadeIn">
        <div className="w-full bg-sub/10 border border-sub/20 rounded-3xl p-8 backdrop-blur-md shadow-2xl flex flex-col items-center text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-main/20 text-main flex items-center justify-center shadow-lg shadow-main/10">
            <Languages className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-text mb-1">Translation Session Completed!</h2>
            <p className="text-sm text-sub">
              Completed all {sentenceQueue.length} Arabic-to-English translations in this batch.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 w-full max-w-lg pt-2">
            <div className="p-4 rounded-xl bg-sub/15 border border-sub/20">
              <span className="text-xs text-sub uppercase font-bold tracking-wider">Translation WPM</span>
              <p className="text-2xl font-black text-main mt-1">{stats.wpm}</p>
            </div>
            <div className="p-4 rounded-xl bg-sub/15 border border-sub/20">
              <span className="text-xs text-sub uppercase font-bold tracking-wider">Accuracy</span>
              <p className="text-2xl font-black text-text mt-1">{stats.accuracy}%</p>
            </div>
            <div className="p-4 rounded-xl bg-sub/15 border border-sub/20">
              <span className="text-xs text-sub uppercase font-bold tracking-wider">SM-2 Scheduled</span>
              <p className="text-2xl font-black text-text mt-1">{sentenceQueue.length}</p>
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
        <span>Loading translation sentences...</span>
      </div>
    );
  }

  const sentenceGrade = gradeSentence({
    charCount: targetEnglish.length,
    correctChars: Math.max(1, targetEnglish.length - stats.errors),
    totalKeystrokes: targetEnglish.length + stats.errors,
    errors: stats.errors,
    elapsedMs: stats.elapsedMs,
  });
  const sentenceXP = calculateSentenceXP({
    charCount: targetEnglish.length,
    difficulty: currentSentence.difficulty,
    accuracy: stats.accuracy,
    errors: stats.errors,
  });

  return (
    <div
      className="w-full max-w-4xl flex flex-col items-center justify-center px-4 py-6 select-none"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Hidden input to capture keystrokes */}
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

      {/* Prominent Arabic Cue Card */}
      <div className="w-full bg-sub/10 border border-sub/20 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-xl mb-6 relative overflow-hidden">
        {/* Top Badges & Audio / Vocab Controls */}
        <div className="flex items-center justify-between mb-4 text-xs font-mono text-sub">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-main/15 text-main text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Languages className="w-3 h-3" />
              <span>Arabic Cue</span>
            </span>

            <span className="font-semibold text-text ml-1">
              {queueIndex + 1} of {sentenceQueue.length}
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

          <div className="flex items-center gap-2">
            {/* Audio Dictation Pill (Remaining Words) */}
            <button
              type="button"
              onClick={() => speakRemainingSentence(false)}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-2 transition-all text-xs font-medium border ${
                isSpeaking
                  ? "bg-main/25 text-main border-main/40 shadow-md shadow-main/20 animate-pulse"
                  : "bg-sub/15 text-sub hover:text-text border-sub/20 hover:border-sub/40"
              }`}
              title="Hear remaining words: Tab for normal, Shift+Tab for slow motion (0.72x)"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{isSpeaking ? "Speaking..." : "Dictation"}</span>
              <kbd className="hidden sm:inline px-1 py-0.5 bg-sub/20 text-[10px] rounded text-sub">Tab</kbd>
            </button>

            {/* Full Audio Pill (Whole sentence from start) */}
            <button
              type="button"
              onClick={() => speakFullSentence(false)}
              className="px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all text-xs font-medium border bg-sub/15 text-sub hover:text-text border-sub/20 hover:border-sub/40"
              title="Full Audio: Replay entire sentence from the beginning"
            >
              <Headphones className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Full Audio</span>
            </button>

            {/* Vocabulary Hints Toggle */}
            <button
              type="button"
              onClick={toggleVocabHint}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-2 transition-all text-xs font-medium border ${
                showVocabHint
                  ? "bg-amber-500/25 text-amber-400 border-amber-500/40"
                  : "bg-sub/15 text-sub hover:text-text border-sub/20 hover:border-sub/40"
              }`}
              title="Show vocabulary translation cards (Alt+H)"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Vocab</span>
              <kbd className="hidden sm:inline px-1 py-0.5 bg-sub/20 text-[10px] rounded text-sub">Alt+H</kbd>
            </button>
          </div>
        </div>

        {/* Prominent Arabic Sentence typography rendered with dir="rtl" in font-thmanyah */}
        <div
          dir="rtl"
          className="font-thmanyah text-2xl sm:text-3xl md:text-4xl text-text font-bold text-right leading-loose py-3 select-text tracking-wide"
          style={{ fontFamily: "var(--font-thmanyah), 'Thmanyah Sans', sans-serif" }}
        >
          {arabicText}
        </div>

        {/* Literal Meaning Footer inside Cue Card (Hidden by default to avoid spoilers) */}
        {literalMeaning && (
          <div className="mt-4 pt-3 border-t border-sub/15 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-sub/70">
              <span className="text-[10px] uppercase font-bold text-sub/50 tracking-wider">Literal meaning:</span>
              {showLiteral ? (
                <span className="italic text-sub hover:text-text transition-colors">
                  "{literalMeaning}"
                </span>
              ) : (
                <span className="italic text-sub/40 transition-colors select-none">
                  (hidden · click eye to reveal)
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowLiteral(!showLiteral)}
              className="text-sub/50 hover:text-sub text-[11px] flex items-center gap-1 transition-colors ml-2"
              title={showLiteral ? "Hide literal meaning" : "Reveal literal meaning"}
            >
              {showLiteral ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span className="text-[10px] hidden sm:inline">{showLiteral ? "Hide" : "Reveal"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Vocabulary Cards Popover / Dropdown (Alt+H) */}
      <AnimatePresence>
        {showVocabHint && vocabCards.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -8 }}
            className="w-full mb-6 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-text font-mono text-xs overflow-hidden shadow-lg"
          >
            <div className="flex items-center gap-2 text-amber-400 font-bold mb-3">
              <BookOpen className="w-4 h-4" />
              <span>Vocabulary Flashcards</span>
              <span className="text-sub/70 font-normal ml-1">({vocabCards.length} key words)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {vocabCards.map((card, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-sub/15 border border-sub/20 flex flex-col justify-between"
                >
                  <span
                    dir="rtl"
                    className="font-thmanyah text-base font-bold text-text text-right mb-1"
                    style={{ fontFamily: "var(--font-thmanyah), 'Thmanyah Sans', sans-serif" }}
                  >
                    {card.ar}
                  </span>
                  <span className="text-main text-xs font-semibold">{card.en}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* English Translation Multi-word Typing Buffer */}
      <div
        ref={containerRef}
        className="w-full relative min-h-[160px] p-8 rounded-3xl bg-sub/5 border border-sub/20 backdrop-blur-sm shadow-xl flex flex-col justify-center overflow-hidden cursor-text transition-all"
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

        {/* Word Wrapped English Target Buffer with Word Masking */}
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
      </div>

      {/* Live Stats Footer */}
      <div className="w-full mt-6 flex items-center justify-between text-xs font-mono text-sub">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5">
            <span className="text-sub/60 uppercase text-[10px]">WPM:</span>
            <span className="text-main font-bold text-sm">{stats.wpm}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sub/60 uppercase text-[10px]">Accuracy:</span>
            <span className="text-text font-bold text-sm">{stats.accuracy}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sub/60 uppercase text-[10px]">Errors:</span>
            <span className={`font-bold text-sm ${stats.errors > 0 ? "text-error" : "text-sub"}`}>
              {stats.errors}
            </span>
          </div>
        </div>

        <div className="text-[11px] text-sub/50 hidden sm:block">
          <kbd className="px-1 bg-sub/10 rounded">Tab</kbd> Dictation ·{" "}
          <kbd className="px-1 bg-sub/10 rounded">Shift+Tab</kbd> Slow (0.72x) ·{" "}
          <kbd className="px-1 bg-sub/10 rounded">Alt+H</kbd> Vocab ·{" "}
          <kbd className="px-1 bg-sub/10 rounded">Esc</kbd> Skip
        </div>
      </div>

      {/* Translation Complete Interstitial */}
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
                  {stats.wpm} WPM · {stats.accuracy}% Accuracy · {stats.errors} error{stats.errors === 1 ? "" : "s"}
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
                <span>Next Translation</span>
                <ArrowRight className="w-3.5 h-3.5" />
                <kbd className="px-1.5 py-0.5 bg-bg/20 text-[10px] rounded text-bg">Enter</kbd>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
