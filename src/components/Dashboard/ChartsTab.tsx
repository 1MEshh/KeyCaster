"use client";

import React, { useMemo, useState } from "react";
import { type SessionHistoryRecord } from "@/lib/db";
import { Zap, Target, Flame, Clock, Activity } from "lucide-react";

interface ChartsTabProps {
  history: SessionHistoryRecord[];
}

export const ChartsTab: React.FC<ChartsTabProps> = ({ history }) => {
  const [activeMetric, setActiveMetric] = useState<"wpm" | "accuracy" | "consistency">("wpm");

  // Chronological order for charting (oldest to newest)
  const chartData = useMemo(() => {
    return [...history].reverse().slice(-30);
  }, [history]);

  // Aggregate stats
  const stats = useMemo(() => {
    if (history.length === 0) {
      return { avgWpm: 0, peakWpm: 0, avgAcc: 100, avgCons: 100, totalMinutes: 0 };
    }
    const totalWpm = history.reduce((acc, h) => acc + (h.wpm || 0), 0);
    const peakWpm = Math.max(...history.map((h) => h.wpm || 0));
    const totalAcc = history.reduce((acc, h) => acc + (h.accuracy || 0), 0);
    const totalCons = history.reduce((acc, h) => acc + (h.consistency ?? 90), 0);
    const totalSecs = history.reduce((acc, h) => acc + (h.duration || 0), 0);

    return {
      avgWpm: Math.round(totalWpm / history.length),
      peakWpm,
      avgAcc: Math.round(totalAcc / history.length),
      avgCons: Math.round(totalCons / history.length),
      totalMinutes: Math.round(totalSecs / 60),
    };
  }, [history]);

  // SVG Chart Dimensions
  const width = 640;
  const height = 180;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };

  const chartPoints = useMemo(() => {
    if (chartData.length === 0) return { path: "", points: [], minVal: 0, maxVal: 100 };

    const values = chartData.map((d) => {
      if (activeMetric === "wpm") return d.wpm;
      if (activeMetric === "accuracy") return d.accuracy;
      return d.consistency ?? 90;
    });
    let minVal = Math.min(...values);
    let maxVal = Math.max(...values);

    if (activeMetric === "accuracy" || activeMetric === "consistency") {
      minVal = Math.min(minVal, 60);
      maxVal = 100;
    } else {
      minVal = Math.max(0, minVal - 10);
      maxVal = Math.max(maxVal + 10, 40);
    }

    const range = maxVal - minVal || 1;
    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;

    const points = chartData.map((d, i) => {
      const val =
        activeMetric === "wpm"
          ? d.wpm
          : activeMetric === "accuracy"
          ? d.accuracy
          : (d.consistency ?? 90);
      const x = padding.left + (chartData.length > 1 ? (i / (chartData.length - 1)) * innerWidth : innerWidth / 2);
      const y = padding.top + innerHeight - ((val - minVal) / range) * innerHeight;
      return { x, y, val, date: d.timestamp };
    });

    const path = points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, "");

    return { path, points, minVal, maxVal };
  }, [chartData, activeMetric]);

  return (
    <div className="space-y-6 animate-fadeIn font-mono">
      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <div className="p-3 rounded-xl border border-sub/20 bg-sub/5 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-sub">
            <Zap className="w-3.5 h-3.5 text-main" />
            <span>Avg WPM</span>
          </div>
          <div className="text-xl font-bold text-text">{stats.avgWpm}</div>
        </div>

        <div className="p-3 rounded-xl border border-sub/20 bg-sub/5 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-sub">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Peak WPM</span>
          </div>
          <div className="text-xl font-bold text-amber-400">{stats.peakWpm}</div>
        </div>

        <div className="p-3 rounded-xl border border-sub/20 bg-sub/5 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-sub">
            <Target className="w-3.5 h-3.5 text-emerald-400" />
            <span>Accuracy</span>
          </div>
          <div className="text-xl font-bold text-text">{stats.avgAcc}%</div>
        </div>

        <div className="p-3 rounded-xl border border-sub/20 bg-sub/5 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-sub">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Consistency</span>
          </div>
          <div className="text-xl font-bold text-cyan-400">{stats.avgCons}%</div>
        </div>

        <div className="p-3 rounded-xl border border-sub/20 bg-sub/5 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-sub">
            <Clock className="w-3.5 h-3.5 text-sub" />
            <span>Time Typed</span>
          </div>
          <div className="text-xl font-bold text-text">{stats.totalMinutes}m</div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="p-5 rounded-2xl border border-sub/20 bg-sub/5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs uppercase font-bold text-text">
            Performance Progression (Last 30 Sessions)
          </h3>

          <div className="flex items-center gap-1 p-1 rounded-lg border border-sub/20 bg-bg">
            <button
              onClick={() => setActiveMetric("wpm")}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                activeMetric === "wpm"
                  ? "bg-main text-bg font-bold"
                  : "text-sub hover:text-text"
              }`}
            >
              WPM
            </button>
            <button
              onClick={() => setActiveMetric("accuracy")}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                activeMetric === "accuracy"
                  ? "bg-main text-bg font-bold"
                  : "text-sub hover:text-text"
              }`}
            >
              Accuracy
            </button>
            <button
              onClick={() => setActiveMetric("consistency")}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                activeMetric === "consistency"
                  ? "bg-cyan-500 text-bg font-bold"
                  : "text-sub hover:text-text"
              }`}
            >
              Consistency
            </button>
          </div>
        </div>

        {chartData.length > 0 ? (
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-44 select-none"
            >
              {/* Horizontal Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = padding.top + (height - padding.top - padding.bottom) * ratio;
                const val = Math.round(chartPoints.maxVal - ratio * (chartPoints.maxVal - chartPoints.minVal));
                return (
                  <g key={ratio}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={width - padding.right}
                      y2={y}
                      stroke="currentColor"
                      className="text-sub/10"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={padding.left - 8}
                      y={y + 3}
                      textAnchor="end"
                      className="text-[9px] fill-current text-sub/50 font-mono"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Line Path */}
              {chartPoints.path && (
                <path
                  d={chartPoints.path}
                  fill="none"
                  stroke={
                    activeMetric === "wpm"
                      ? "var(--main)"
                      : activeMetric === "accuracy"
                      ? "#10b981"
                      : "#06b6d4"
                  }
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Data Dots */}
              {chartPoints.points.map((p, idx) => (
                <circle
                  key={idx}
                  cx={p.x}
                  cy={p.y}
                  r="3.5"
                  className={
                    activeMetric === "wpm"
                      ? "fill-main"
                      : activeMetric === "accuracy"
                      ? "fill-emerald-400"
                      : "fill-cyan-400"
                  }
                  stroke="var(--bg)"
                  strokeWidth="1.5"
                >
                  <title>{`${activeMetric.toUpperCase()}: ${p.val}`}</title>
                </circle>
              ))}
            </svg>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-sub italic">
            Complete at least one session to generate performance charts.
          </div>
        )}
      </div>
    </div>
  );
};
