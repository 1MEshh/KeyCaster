"use client";

import React, { useRef } from "react";
import { Download, Share2 } from "lucide-react";
import { type CompletedWordItem } from "@/store/useSessionStore";
import { useSettingsStore, THEME_VARIABLES } from "@/store/useSettingsStore";
import { useProfileStore } from "@/store/useProfileStore";

interface ScoreCardCanvasProps {
  wpm: number;
  accuracy: number;
  totalWords: number;
  duration: number;
  category: string;
  completedWords: CompletedWordItem[];
}

export const ScoreCardCanvas: React.FC<ScoreCardCanvasProps> = ({
  wpm,
  accuracy,
  totalWords,
  duration,
  category,
  completedWords,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { theme } = useSettingsStore();
  const { getRank, streak, level } = useProfileStore();

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 1200 x 675 (16:9 Standard Social Card)
    const W = 1200;
    const H = 675;
    canvas.width = W;
    canvas.height = H;

    const colors = THEME_VARIABLES[theme] || THEME_VARIABLES.midnight;

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, colors.bg);
    bgGrad.addColorStop(1, "#020617");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Decorative border
    ctx.strokeStyle = colors.main + "33";
    ctx.lineWidth = 2;
    ctx.strokeRect(24, 24, W - 48, H - 48);

    // Top Brand Bar
    ctx.fillStyle = colors.main;
    ctx.font = "bold 32px monospace";
    ctx.textAlign = "left";
    ctx.fillText("KEYCASTER", 60, 80);

    ctx.fillStyle = colors.sub;
    ctx.font = "16px monospace";
    ctx.fillText("AUDIO-FIRST SPACED REPETITION", 60, 110);

    // Deck & Date Badge
    ctx.textAlign = "right";
    ctx.fillStyle = colors.text;
    ctx.font = "bold 18px monospace";
    const dateStr = new Date().toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    ctx.fillText(`${category.toUpperCase()} DECK · ${dateStr}`, W - 60, 80);

    // Streak & Rank
    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 16px monospace";
    ctx.fillText(`🔥 ${streak} DAY STREAK · ${getRank().toUpperCase()} (LVL ${level})`, W - 60, 110);

    // Main Stat Cards
    const cardY = 160;
    const cardH = 140;

    // Card 1: WPM
    drawStatCard(ctx, 60, cardY, 250, cardH, "SPEED", `${wpm}`, "WPM", colors.main, colors.bg);

    // Card 2: Accuracy
    drawStatCard(ctx, 340, cardY, 250, cardH, "ACCURACY", `${accuracy}%`, `${completedWords.filter((w) => w.errors === 0).length}/${totalWords} clean`, colors.text, colors.bg);

    // Card 3: Words
    drawStatCard(ctx, 620, cardY, 250, cardH, "WORDS", `${totalWords}`, `${duration}s duration`, colors.text, colors.bg);

    // Card 4: Rank
    drawStatCard(ctx, 900, cardY, 240, cardH, "RANK", getRank(), `Level ${level}`, colors.main, colors.bg);

    // Word Stream Preview
    ctx.fillStyle = colors.sub;
    ctx.font = "bold 14px monospace";
    ctx.textAlign = "left";
    ctx.fillText("WORDS TYPED IN SESSION:", 60, 360);

    const wordsToDisplay = completedWords.slice(0, 15);
    let curX = 60;
    let curY = 400;

    wordsToDisplay.forEach((item) => {
      const isClean = item.errors === 0 && !item.wasSkipped;
      const text = item.word.word;

      ctx.font = "18px monospace";
      const metrics = ctx.measureText(text);
      const boxW = metrics.width + 28;

      if (curX + boxW > W - 60) {
        curX = 60;
        curY += 50;
      }

      // Chip background
      ctx.fillStyle = isClean ? colors.main + "15" : "#ef444420";
      ctx.strokeStyle = isClean ? colors.main + "40" : "#ef444460";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(curX, curY - 26, boxW, 36, 8);
      ctx.fill();
      ctx.stroke();

      // Chip text
      ctx.fillStyle = isClean ? colors.text : "#f87171";
      ctx.textAlign = "left";
      ctx.fillText(text, curX + 14, curY - 2);

      curX += boxW + 12;
    });

    // Footer
    ctx.fillStyle = colors.sub;
    ctx.font = "14px monospace";
    ctx.textAlign = "center";
    ctx.fillText("KeyCaster · 100% Local-First · SuperMemo-2 Spaced Repetition", W / 2, H - 50);

    // Trigger download
    const dataUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `keycaster-${wpm}wpm-${category}-${dateStr.replace(/[^a-zA-Z0-9]/g, "-")}.png`;
    a.click();
  };

  function drawStatCard(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    value: string,
    sub: string,
    accentColor: string,
    bgColor: string
  ) {
    ctx.fillStyle = bgColor;
    ctx.strokeStyle = accentColor + "33";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#64748b";
    ctx.font = "bold 13px monospace";
    ctx.textAlign = "left";
    ctx.fillText(label, x + 20, y + 34);

    ctx.fillStyle = accentColor;
    ctx.font = "bold 44px monospace";
    ctx.fillText(value, x + 20, y + 84);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "13px monospace";
    ctx.fillText(sub, x + 20, y + 115);
  }

  return (
    <>
      <canvas ref={canvasRef} className="hidden" />
      <button
        onClick={handleDownload}
        className="w-full sm:w-auto py-2.5 px-4 rounded-xl border border-main/30 bg-main/10 hover:bg-main/20 text-main text-xs font-bold font-mono flex items-center justify-center gap-2 transition-all"
        title="Download high-resolution session scorecard image (16:9 PNG)"
      >
        <Share2 className="w-4 h-4" />
        <span>Share Scorecard (PNG)</span>
      </button>
    </>
  );
};
