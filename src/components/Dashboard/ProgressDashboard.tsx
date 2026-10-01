"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  TrendingUp,
  Layers,
  BarChart3,
  Keyboard,
  History,
  AlertTriangle,
  Play,
} from "lucide-react";
import { db, type WordRecord, type SessionHistoryRecord } from "@/lib/db";
import { isDue } from "@/lib/sm2";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useSessionStore } from "@/store/useSessionStore";
import { HeatmapTab } from "./HeatmapTab";
import { ChartsTab } from "./ChartsTab";
import { HistoryTab } from "./HistoryTab";

interface ProgressDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  onStartCategory: (category: string) => void;
}

interface CategoryStats {
  category: string;
  name: string;
  total: number;
  mastered: number;
  learning: number;
  unseen: number;
  dueToday: number;
}

type DashboardTab = "overview" | "charts" | "heatmap" | "history";

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  isOpen,
  onClose,
  onStartCategory,
}) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [stats, setStats] = useState<CategoryStats[]>([]);
  const [hardestWords, setHardestWords] = useState<WordRecord[]>([]);
  const [allWords, setAllWords] = useState<WordRecord[]>([]);
  const [history, setHistory] = useState<SessionHistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { activeCategory, setActiveCategory, sessionSize } = useSettingsStore();
  const initSession = useSessionStore((s) => s.initSession);

  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const words = await db.words.toArray();
        const customDecks = await db.customDecks.toArray();
        const sessionHistory = await db.sessionHistory.reverse().toArray();

        // Build category map including Coding
        const categories = [
          { id: "daily", name: "Daily" },
          { id: "common_misspellings", name: "Common Misspellings" },
          { id: "gaming", name: "Gaming" },
          { id: "coding", name: "Coding" },
          ...customDecks.map((d) => ({ id: `custom_${d.id}`, name: d.name })),
        ];

        const catStats: CategoryStats[] = categories.map((cat) => {
          const catWords = words.filter((w) => w.category === cat.id);
          let mastered = 0;
          let learning = 0;
          let unseen = 0;
          let dueToday = 0;

          for (const w of catWords) {
            if (w.repetitions === 0) {
              unseen++;
            } else if (w.interval >= 21) {
              mastered++;
            } else {
              learning++;
            }

            if (isDue(w.nextReviewDate)) {
              dueToday++;
            }
          }

          return {
            category: cat.id,
            name: cat.name,
            total: catWords.length,
            mastered,
            learning,
            unseen,
            dueToday,
          };
        });

        // Hardest words (at least 1 review and mistakes > 0)
        const sortedHardest = words
          .filter((w) => w.totalMistakes > 0 && w.totalReviews > 0)
          .sort((a, b) => b.totalMistakes / b.totalReviews - a.totalMistakes / a.totalReviews)
          .slice(0, 8);

        setAllWords(words);
        setStats(catStats);
        setHardestWords(sortedHardest);
        setHistory(sessionHistory);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
        setIsLoading(false);
      }
    };

    loadData();
  }, [isOpen]);

  if (!isOpen) return null;

  const TABS = [
    { id: "overview", label: "Overview", icon: Layers },
    { id: "charts", label: "Charts", icon: BarChart3 },
    { id: "heatmap", label: "Heatmap", icon: Keyboard },
    { id: "history", label: "History", icon: History },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-bg border border-sub/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] font-mono">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-sub/20 bg-bg">
          <div className="flex items-center gap-2.5">
            <TrendingUp className="w-5 h-5 text-main" />
            <h2 className="text-base font-bold text-text">Analytics & Progress</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-sub hover:text-text hover:bg-sub/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-sub/20 bg-sub/5 px-6 overflow-x-auto gap-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-3 text-xs font-mono border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? "border-main text-main font-semibold"
                    : "border-transparent text-sub hover:text-text"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="py-12 text-center text-sub text-xs">Loading analytics...</div>
          ) : activeTab === "charts" ? (
            <ChartsTab history={history} />
          ) : activeTab === "heatmap" ? (
            <HeatmapTab words={allWords} />
          ) : activeTab === "history" ? (
            <HistoryTab history={history} />
          ) : (
            /* TAB 1: Overview */
            <div className="space-y-6 text-xs animate-fadeIn">
              {/* Category Mastery Breakdown */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="uppercase text-sub font-semibold tracking-wider text-[11px]">
                    Deck Mastery Breakdown
                  </span>
                  <div className="flex items-center gap-4 text-[10px] text-sub">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded bg-main inline-block" /> Mastered (21d+)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded bg-sub/60 inline-block" /> Learning
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded bg-sub/20 inline-block" /> Unseen
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {stats.map((cat) => {
                    const total = cat.total || 1;
                    const mPct = (cat.mastered / total) * 100;
                    const lPct = (cat.learning / total) * 100;
                    const uPct = (cat.unseen / total) * 100;

                    return (
                      <div
                        key={cat.category}
                        className="p-4 rounded-xl border border-sub/20 bg-sub/5 space-y-2 hover:border-sub/40 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-text text-sm">{cat.name}</span>
                            <span className="text-[10px] text-sub font-normal">
                              ({cat.total} words)
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {cat.dueToday > 0 && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-main/15 text-main font-semibold">
                                {cat.dueToday} due today
                              </span>
                            )}
                            <button
                              onClick={async () => {
                                setActiveCategory(cat.category);
                                await initSession(cat.category, sessionSize);
                                onClose();
                              }}
                              className="px-2.5 py-1 rounded-lg bg-main text-bg font-bold text-xs flex items-center gap-1 hover:opacity-90 transition-opacity"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>Practice</span>
                            </button>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-2 w-full rounded-full bg-sub/10 overflow-hidden flex">
                          <div
                            style={{ width: `${mPct}%` }}
                            className="bg-main h-full transition-all duration-300"
                            title={`Mastered: ${cat.mastered}`}
                          />
                          <div
                            style={{ width: `${lPct}%` }}
                            className="bg-sub/60 h-full transition-all duration-300"
                            title={`Learning: ${cat.learning}`}
                          />
                          <div
                            style={{ width: `${uPct}%` }}
                            className="bg-sub/20 h-full transition-all duration-300"
                            title={`Unseen: ${cat.unseen}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Hardest Words List */}
              {hardestWords.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2 text-sub font-semibold uppercase text-[11px]">
                    <AlertTriangle className="w-4 h-4 text-error" />
                    <span>Words Needing Attention (Highest Mistake Rate)</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {hardestWords.map((hw) => (
                      <div
                        key={hw.id}
                        className="p-2.5 rounded-lg border border-error/25 bg-error/5 flex flex-col justify-between"
                      >
                        <div className="font-bold text-text text-sm truncate">{hw.word}</div>
                        <div className="text-[10px] text-sub mt-1 flex justify-between">
                          <span>{hw.totalMistakes} mistakes</span>
                          <span className="text-main">{hw.interval}d interval</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
