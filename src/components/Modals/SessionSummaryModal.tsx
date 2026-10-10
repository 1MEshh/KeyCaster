"use client";

import React, { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import {
  Trophy,
  RotateCcw,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Activity,
  Download,
  Copy,
  Check,
  Share2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useSessionStore } from "@/store/useSessionStore";
import { useSettingsStore, THEME_VARIABLES } from "@/store/useSettingsStore";
import {
  formatSessionSummaryText,
  exportScoreCardCanvas,
  downloadDataUrl,
} from "@/lib/scoreCardExporter";

interface SessionSummaryModalProps {
  isOpen: boolean;
  onNewSession: () => void;
  onOpenDashboard: () => void;
}

export const SessionSummaryModal: React.FC<SessionSummaryModalProps> = ({
  isOpen,
  onNewSession,
  onOpenDashboard,
}) => {
  const { completedWords, startTime, endTime, startRetryMistakes } = useSessionStore();
  const { activeCategory, theme } = useSettingsStore();
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [expandedWordIdx, setExpandedWordIdx] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#88c0d0", "#e2b714", "#bd93f9", "#38bdf8"],
        });
      } catch {
        // Confetti fallback
      }
    }
  }, [isOpen]);

  if (!isOpen || completedWords.length === 0) return null;

  const totalWords = completedWords.length;
  const totalErrors = completedWords.reduce((acc, c) => acc + c.errors, 0);
  const avgWpm = Math.round(
    completedWords.reduce((acc, c) => acc + c.wpm, 0) / Math.max(1, totalWords)
  );
  const avgAccuracy = Math.round(
    completedWords.reduce((acc, c) => acc + c.accuracy, 0) / Math.max(1, totalWords)
  );
  const avgConsistency = Math.round(
    completedWords.reduce((acc, c) => acc + (c.consistency ?? 100), 0) / Math.max(1, totalWords)
  );
  const avgRawWpm = Math.round(
    completedWords.reduce((acc, c) => acc + (c.rawWpm ?? c.wpm), 0) / Math.max(1, totalWords)
  );
  const durationSec = Math.round(((endTime || Date.now()) - (startTime || Date.now())) / 1000);

  const masteredWords = completedWords.filter((c) => c.grade >= 3);
  const failedWords = completedWords.filter((c) => c.grade < 3);

  const handleCopySummary = async () => {
    try {
      const text = formatSessionSummaryText({
        deckName: activeCategory,
        wpm: avgWpm,
        rawWpm: avgRawWpm,
        accuracy: avgAccuracy,
        consistency: avgConsistency,
        durationSec,
        totalWords,
        passedWords: masteredWords.length,
        failedWords: failedWords.length,
      });
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard fallback
    }
  };

  const handleExportCard = () => {
    setIsExporting(true);
    try {
      const themeColors = THEME_VARIABLES[theme] || THEME_VARIABLES.cyberpunk;
      const dataUrl = exportScoreCardCanvas({
        deckName: activeCategory,
        wpm: avgWpm,
        rawWpm: avgRawWpm,
        accuracy: avgAccuracy,
        consistency: avgConsistency,
        durationSec,
        totalWords,
        passedWords: masteredWords.length,
        failedWords: failedWords.length,
        themeMainColor: themeColors.main,
        themeBgColor: themeColors.bg,
      });
      if (dataUrl) {
        downloadDataUrl(dataUrl, `keycaster-scorecard-${activeCategory}-${Date.now()}.png`);
      }
    } finally {
      setTimeout(() => setIsExporting(false), 600);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-bg border border-sub/30 rounded-2xl shadow-2xl p-6 sm:p-8 font-mono flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-main/15 text-main flex items-center justify-center">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text">Session Complete!</h2>
            <p className="text-xs text-sub">Deck: {activeCategory.replace("_", " ").toUpperCase()}</p>
          </div>
        </div>

        {/* Big Key Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-sub/5 border border-sub/20 text-center">
          <div>
            <div className="text-[10px] uppercase text-sub font-semibold tracking-wider">WPM (Net/Raw)</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-main mt-0.5">
              {avgWpm}
              <span className="text-xs font-normal text-sub ml-1">/{avgRawWpm}</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-sub font-semibold tracking-wider">Accuracy</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-text mt-0.5">{avgAccuracy}%</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-sub font-semibold tracking-wider flex items-center justify-center gap-1">
              <Activity className="w-3 h-3 text-cyan-400" />
              <span>Consistency</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400 mt-0.5">{avgConsistency}%</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-sub font-semibold tracking-wider">Duration</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-sub mt-0.5">{durationSec}s</div>
          </div>
        </div>

        {/* Rhythm & Cadence Diagnostics */}
        <div className="p-3.5 rounded-xl border border-cyan-500/20 bg-cyan-500/5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-text">
                {avgConsistency >= 90
                  ? "Metronomic Cadence (Elite Steady)"
                  : avgConsistency >= 80
                  ? "Rhythmic Flow (Consistent)"
                  : avgConsistency >= 65
                  ? "Moderate Cadence Variance"
                  : "Variable Burst Rhythm"}
              </div>
              <div className="text-[10px] text-sub">
                Keystroke standard deviation variance ratio: {avgConsistency}%
              </div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1 font-mono text-[10px] text-cyan-400/80 bg-cyan-500/10 px-2.5 py-1 rounded-md">
            <span>Rhythm Score</span>
          </div>
        </div>

        {/* SRS Interval Summary */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg border border-sub/20 bg-main/5 flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-main flex-shrink-0" />
            <div>
              <div className="font-bold text-text">{masteredWords.length} Words Advanced</div>
              <div className="text-[10px] text-sub">Interval increased in SRS</div>
            </div>
          </div>

          <div className="p-3 rounded-lg border border-sub/20 bg-error/5 flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-error flex-shrink-0" />
            <div>
              <div className="font-bold text-text">{failedWords.length} Review Tomorrow</div>
              <div className="text-[10px] text-sub">Interval reset to 1 day</div>
            </div>
          </div>
        </div>

        {/* Targeted Practice: Drill Failed Words */}
        {failedWords.length > 0 && (
          <button
            type="button"
            onClick={() => startRetryMistakes()}
            className="w-full py-2.5 px-4 rounded-xl border border-error/40 bg-error/10 hover:bg-error/20 text-error font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
            title="Launch an immediate queue containing only words that failed in this session"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Practice Only Failed Words ({failedWords.length})</span>
          </button>
        )}

        {/* Word Results Breakdown */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase text-sub font-semibold">Word Breakdown</span>
            <span className="text-[10px] text-sub/60">Click word to inspect mistakes</span>
          </div>
          <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
            {completedWords.map((item, idx) => {
              const isExpanded = expandedWordIdx === idx;
              return (
                <div
                  key={idx}
                  className={`rounded-xl border transition-all text-xs overflow-hidden ${
                    isExpanded
                      ? "bg-sub/10 border-main/40 shadow-sm"
                      : "bg-sub/5 border-sub/15 hover:border-sub/30"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedWordIdx(isExpanded ? null : idx)}
                    className="w-full flex items-center justify-between p-2.5 text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          item.grade >= 4 ? "bg-main" : item.grade === 3 ? "bg-sub" : "bg-error"
                        }`}
                      />
                      <span className="font-bold text-text">{item.word.word}</span>
                      {item.wasRetry && (
                        <span className="text-[9px] bg-sub/20 text-sub px-1 py-0.5 rounded">retry</span>
                      )}
                      {item.errors > 0 && (
                        <span className="text-[9px] bg-error/20 text-error px-1.5 py-0.5 rounded font-bold">
                          {item.errors} {item.errors === 1 ? "error" : "errors"}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5 text-sub text-[11px]">
                      <span>{item.wpm} wpm</span>
                      {item.consistency !== undefined && (
                        <span className="text-cyan-400">{item.consistency}%</span>
                      )}
                      <span>{item.accuracy}% acc</span>
                      <span className="font-semibold text-text">{item.label}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5 text-main ml-1" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-sub/60 ml-1" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Drill-down Details */}
                  {isExpanded && (
                    <div className="px-3 pb-3 pt-1 border-t border-sub/15 bg-sub/5 space-y-2 text-[11px] font-mono">
                      {/* Hint & Phonetic */}
                      <div className="text-sub flex items-center gap-2">
                        {item.word.phonetic && (
                          <span className="text-main font-semibold">/{item.word.phonetic}/</span>
                        )}
                        <span className="text-text/90 italic">
                          {item.word.definition || item.word.hint || "Vocabulary term"}
                        </span>
                      </div>

                      {/* Diagnostic details grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[10px]">
                        <div className="p-1.5 rounded bg-sub/10 border border-sub/15">
                          <span className="text-sub/70 block">ERRORS:</span>
                          <span className={`font-bold ${item.errors > 0 ? "text-error" : "text-main"}`}>
                            {item.errors}
                          </span>
                        </div>
                        <div className="p-1.5 rounded bg-sub/10 border border-sub/15">
                          <span className="text-sub/70 block">BACKSPACES:</span>
                          <span className="text-text font-bold">{item.backspaces}</span>
                        </div>
                        <div className="p-1.5 rounded bg-sub/10 border border-sub/15">
                          <span className="text-cyan-400 block">SM-2 EASE:</span>
                          <span className="text-cyan-400 font-bold">
                            {(item.word.easeFactor ?? 2.5).toFixed(1)}
                          </span>
                        </div>
                        <div className="p-1.5 rounded bg-sub/10 border border-sub/15">
                          <span className="text-sub/70 block">INTERVAL:</span>
                          <span className="text-text font-bold">{item.word.interval ?? 1}d</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Social Share & Score Card Export */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 p-3 rounded-xl bg-sub/5 border border-sub/20">
          <button
            type="button"
            onClick={handleExportCard}
            disabled={isExporting}
            className="w-full sm:flex-1 py-2 px-3 rounded-lg border border-main/30 bg-main/10 hover:bg-main/20 text-main font-semibold text-xs transition-colors flex items-center justify-center gap-2"
            title="Download high-resolution 1200x675 PNG scorecard for Twitter/Discord/LinkedIn"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? "Generating PNG..." : "Export Score Card (PNG)"}</span>
          </button>

          <button
            type="button"
            onClick={handleCopySummary}
            className="w-full sm:w-auto py-2 px-3.5 rounded-lg border border-sub/30 bg-sub/10 hover:bg-sub/20 text-text font-semibold text-xs transition-colors flex items-center justify-center gap-2"
            title="Copy clean summary to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-main" />
                <span className="text-main">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-sub" />
                <span>Copy Summary</span>
              </>
            )}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-sub/20">
          <button
            onClick={onOpenDashboard}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-sub/30 text-sub hover:text-text hover:border-sub/60 text-xs transition-colors flex items-center justify-center gap-2"
          >
            <span>View SRS Dashboard</span>
          </button>

          <button
            onClick={onNewSession}
            className="w-full sm:flex-1 px-5 py-2.5 rounded-lg bg-main text-bg text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Start Next Review</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
