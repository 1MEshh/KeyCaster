"use client";

import React from "react";
import { type SessionHistoryRecord } from "@/lib/db";
import { History, Calendar, Clock, Zap, Target, AlertTriangle } from "lucide-react";

interface HistoryTabProps {
  history: SessionHistoryRecord[];
}

export const HistoryTab: React.FC<HistoryTabProps> = ({ history }) => {
  return (
    <div className="space-y-4 animate-fadeIn font-mono">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-text">Session History Log</h3>
          <p className="text-xs text-sub mt-0.5">
            Complete record of your past sessions stored locally in IndexedDB.
          </p>
        </div>
        <div className="text-xs text-sub font-semibold">
          {history.length} {history.length === 1 ? "session" : "sessions"} logged
        </div>
      </div>

      {history.length === 0 ? (
        <div className="p-12 text-center border border-sub/20 bg-sub/5 rounded-2xl space-y-2">
          <History className="w-8 h-8 text-sub/40 mx-auto" />
          <p className="text-xs text-sub">No session history recorded yet.</p>
        </div>
      ) : (
        <div className="border border-sub/20 rounded-2xl overflow-hidden bg-sub/5">
          <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-sub/10 text-sub uppercase text-[10px] sticky top-0 backdrop-blur-sm z-10 border-b border-sub/20">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Date & Time</th>
                  <th className="py-2.5 px-4 font-semibold">Deck</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Words</th>
                  <th className="py-2.5 px-4 font-semibold text-right">WPM</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Accuracy</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Errors</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sub/10">
                {history.map((s, idx) => {
                  const date = new Date(s.timestamp);
                  const dateStr = date.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  });
                  const timeStr = date.toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <tr
                      key={s.id || idx}
                      className="hover:bg-sub/10 transition-colors"
                    >
                      <td className="py-2.5 px-4 text-text whitespace-nowrap">
                        <span className="font-medium">{dateStr}</span>{" "}
                        <span className="text-[10px] text-sub">{timeStr}</span>
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-main/10 text-main border border-main/20">
                          {s.category.replace("custom_", "custom: ")}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-medium text-text">
                        {s.totalWords}
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-main">
                        {s.wpm}
                      </td>
                      <td className="py-2.5 px-4 text-right font-medium text-text">
                        {s.accuracy}%
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <span
                          className={`font-semibold ${
                            s.errors > 0 ? "text-error" : "text-sub"
                          }`}
                        >
                          {s.errors}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right text-sub">
                        {s.duration}s
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
