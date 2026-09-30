"use client";

import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  ArrowRight,
  Eye,
  EyeOff,
  Volume2,
  Trophy,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useSessionStore } from "@/store/useSessionStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { getAudioContext } from "@/lib/audio";

interface SessionEndActionsProps {
  onNextSession: () => void;
}

export const SessionEndActions: React.FC<SessionEndActionsProps> = ({ onNextSession }) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [speakingWord, setSpeakingWord] = useState<string | null>(null);

  const { completedWords, startTime, endTime } = useSessionStore();
  const { activeCategory, speechRate, ttsVoiceURI } = useSettingsStore();

  // Fire celebratory micro-confetti on mount
  useEffect(() => {
    try {
      confetti({
        particleCount: 65,
        spread: 60,
        origin: { y: 0.65 },
        colors: ["#ffffff", "#71717a", "#38bdf8", "#e2b714"],
      });
    } catch {
      // Confetti fallback
    }
  }, []);

  // Keyboard shortcut listener for Enter (Next) and P (Preview)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is inside an input or textarea
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        onNextSession();
      } else if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        setIsPreviewOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onNextSession]);

  const speakWord = (wordText: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      getAudioContext();
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(wordText);
      utterance.rate = speechRate || 0.95;
      utterance.lang = "en-US";

      if (ttsVoiceURI) {
        const voices = window.speechSynthesis.getVoices();
        const selected = voices.find((v) => v.voiceURI === ttsVoiceURI);
        if (selected) utterance.voice = selected;
      }

      setSpeakingWord(wordText);
      utterance.onend = () => setSpeakingWord(null);
      utterance.onerror = () => setSpeakingWord(null);

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("Speech synthesis error:", err);
      setSpeakingWord(null);
    }
  };

  const totalWords = completedWords.length;
  const avgWpm = Math.round(
    completedWords.reduce((acc, c) => acc + c.wpm, 0) / Math.max(1, totalWords)
  );
  const avgAccuracy = Math.round(
    completedWords.reduce((acc, c) => acc + c.accuracy, 0) / Math.max(1, totalWords)
  );
  const durationSec = Math.round(((endTime || Date.now()) - (startTime || Date.now())) / 1000);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-2xl mx-auto flex flex-col items-center select-none"
    >
      {/* Session Complete Card */}
      <div className="w-full bg-sub/10 border border-sub/30 rounded-2xl p-6 sm:p-8 backdrop-blur-sm shadow-xl flex flex-col items-center text-center">
        {/* Top Trophy & Completion Indicator */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-main/15 text-main flex items-center justify-center border border-main/20">
            <Trophy className="w-4 h-4 text-main" />
          </div>
          <span className="text-xs uppercase tracking-widest text-sub font-semibold">
            {activeCategory.replace("_", " ").toUpperCase()} SESSION COMPLETE
          </span>
        </div>

        <h3 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight mb-2">
          15 Words Mastered
        </h3>

        {/* Quick Compact Stats Pill */}
        <div className="flex items-center gap-4 sm:gap-6 py-2 px-5 rounded-full bg-sub/15 border border-sub/20 text-xs text-sub mb-6">
          <span>
            <strong className="text-main font-bold text-sm">{avgWpm}</strong> WPM
          </span>
          <span className="h-3 w-px bg-sub/30" />
          <span>
            <strong className="text-text font-bold text-sm">{avgAccuracy}%</strong> Accuracy
          </span>
          <span className="h-3 w-px bg-sub/30" />
          <span>
            <strong className="text-text font-bold text-sm">{durationSec}s</strong> Time
          </span>
        </div>

        {/* 2 Animated Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full max-w-md">
          {/* Button 1: Preview Words */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsPreviewOpen((prev) => !prev)}
            className={`flex-1 w-full py-3 px-5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2.5 transition-colors ${
              isPreviewOpen
                ? "bg-sub/20 border-sub text-text"
                : "bg-transparent border-sub/40 text-sub hover:text-text hover:border-sub"
            }`}
          >
            {isPreviewOpen ? (
              <>
                <EyeOff className="w-4 h-4" />
                <span>Hide Words</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                <span>Preview 15 Words</span>
              </>
            )}
            <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-sub/20 text-sub border border-sub/20 font-mono">
              P
            </kbd>
          </motion.button>

          {/* Button 2: Next 15 Words */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onNextSession}
            className="flex-1 w-full py-3 px-5 rounded-xl bg-main text-bg text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg hover:opacity-95 transition-opacity"
          >
            <Sparkles className="w-4 h-4" />
            <span>Next 15 Words</span>
            <ArrowRight className="w-4 h-4" />
            <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-bg/20 text-bg border border-bg/30 font-mono">
              ↵
            </kbd>
          </motion.button>
        </div>
      </div>

      {/* Expandable 15-Word Preview Grid with Audio Playback */}
      <AnimatePresence>
        {isPreviewOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -8 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="w-full mt-4 overflow-hidden"
          >
            <div className="bg-sub/5 border border-sub/25 rounded-2xl p-4 sm:p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-[11px] uppercase tracking-wider text-sub font-semibold">
                  Session Words Review ({completedWords.length})
                </span>
                <span className="text-[10px] text-sub/70">Click speaker to replay voice</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-80 overflow-y-auto pr-1">
                {completedWords.map((item, idx) => {
                  const isSpeaking = speakingWord === item.word.word;
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-sub/10 border border-sub/15 hover:border-sub/35 transition-all text-xs group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          type="button"
                          onClick={() => speakWord(item.word.word)}
                          title="Listen to pronunciation"
                          className={`p-1.5 rounded-lg border transition-all ${
                            isSpeaking
                              ? "bg-main text-bg border-main scale-105"
                              : "bg-sub/10 text-sub border-sub/20 hover:text-text hover:bg-sub/20"
                          }`}
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-bold text-text truncate tracking-wide">
                          {item.word.word}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0 text-[11px]">
                        <span className="text-sub font-mono">{item.wpm} wpm</span>
                        <span
                          className={`font-semibold px-1.5 py-0.5 rounded text-[10px] font-mono ${
                            item.grade >= 4
                              ? "bg-main/15 text-main"
                              : item.grade === 3
                              ? "bg-sub/20 text-sub"
                              : "bg-error/20 text-error"
                          }`}
                        >
                          {item.accuracy}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
