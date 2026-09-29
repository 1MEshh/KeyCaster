"use client";

import React, { useEffect, useState } from "react";
import { X, TrendingUp, Calendar, AlertTriangle, Play } from "lucide-react";
import { db, type WordRecord, type SessionHistoryRecord } from "@/lib/db";
import { isDue } from "@/lib/sm2";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useSessionStore } from "@/store/useSessionStore";

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

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  isOpen,
  onClose,
  onStartCategory,
}) => {
  const [stats, setStats] = useState<CategoryStats[]>([]);
  const [hardestWords, setHardestWords] = useState<WordRecord[]>([]);
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
        const sessionHistory = await db.sessionHistory.reverse().limit(10).toArray();

        // Build category map
        const categories = [
          { id: "daily", name: "Daily" },
          { id: "common_misspellings", name: "Common Misspellings" },
          { id: "gaming", name: "Gaming" },
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-bg border border-sub/30 rounded-2xl shadow-2xl p-6 sm:p-8 font-mono flex flex-col gap-6 max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-sub/20">
          <div className="flex items-center gap-2.5">
            <TrendingUp className="w-5 h-5 text-main" />
            <h2 className="text-lg font-bold text-text">Spaced Repetition Dashboard</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-sub hover:text-text hover:bg-sub/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-sub text-xs">Loading analytics...</div>
        ) : (
          <div className="space-y-6 text-xs">
            {/* Category Mastery Bars */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="uppercase text-sub font-semibold tracking-wider text-[11px]">
                  Category Mastery Breakdown
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
                  const total = Math.max(1, cat.total);
                  const mPct = Math.round((cat.mastered / total) * 100);
                  const lPct = Math.round((cat.learning / total) * 100);
                  const uPct = Math.max(0, 100 - mPct - lPct);

                  return (
                    <div
                      key={cat.category}
                      className="p-3 rounded-xl border border-sub/20 bg-sub/5 hover:border-sub/40 transition-all flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-text">{cat.name}</span>
                          <span className="text-[10px] text-sub">({cat.total} words)</span>
                        </div>

                        <div className="flex items-center gap-3">
                          {cat.dueToday > 0 && (
                            <span className="text-[10px] bg-main/15 text-main font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {cat.dueToday} due today
                            </span>
                          )}
                          <button
                            onClick={() => {
                              onStartCategory(cat.category);
                              onClose();
                            }}
                            className="px-2.5 py-1 rounded bg-main text-bg text-[10px] font-bold hover:opacity-90 transition-opacity flex items-center gap-1"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Practice</span>
                          </button>
                        </div>
                      </div>

                      {/* Stacked Progress Bar */}
                      <div className="w-full h-2 rounded-full bg-sub/20 overflow-hidden flex">
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

            {/* Recent Sessions Table */}
            {history.length > 0 && (
              <div>
                <div className="text-sub font-semibold uppercase text-[11px] mb-2">
                  Recent Practice History
                </div>
                <div className="rounded-xl border border-sub/20 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-sub/10 text-sub text-[10px] uppercase">
                      <tr>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Category</th>
                        <th className="py-2 px-3">WPM</th>
                        <th className="py-2 px-3">Accuracy</th>
                        <th className="py-2 px-3">Words</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sub/10 text-[11px]">
                      {history.map((sess, idx) => (
                        <tr key={idx} className="hover:bg-sub/5 transition-colors">
                          <td className="py-2 px-3 text-sub">
                            {sess.timestamp.split("T")[0]}
                          </td>
                          <td className="py-2 px-3 text-text capitalize">
                            {sess.category.replace("_", " ")}
                          </td>
                          <td className="py-2 px-3 text-main font-bold">{sess.wpm}</td>
                          <td className="py-2 px-3 text-text">{sess.accuracy}%</td>
                          <td className="py-2 px-3 text-sub">{sess.totalWords}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
