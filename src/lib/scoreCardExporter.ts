/**
 * KeyCaster High-Resolution Social Score Card Exporter & Share Generator
 * 100% Client-Side Canvas rendering with zero external assets or privacy leaks.
 */

export interface ScoreCardParams {
  deckName: string;
  wpm: number;
  rawWpm?: number;
  accuracy: number;
  consistency: number;
  durationSec: number;
  totalWords: number;
  passedWords: number;
  failedWords: number;
  themeMainColor?: string;
  themeBgColor?: string;
}

/**
 * Format clean, social-ready plain text / markdown review summary
 */
export function formatSessionSummaryText(p: ScoreCardParams): string {
  return [
    `⚡ KeyCaster Review Summary`,
    `📚 Deck: ${p.deckName.replace("_", " ").toUpperCase()}`,
    `⚡ Speed: ${p.wpm} WPM (Raw: ${p.rawWpm ?? p.wpm} WPM)`,
    `🎯 Accuracy: ${p.accuracy}% | 🌊 Consistency: ${p.consistency}%`,
    `⏱️ Duration: ${p.durationSec}s | 🏆 Passed: ${p.passedWords}/${p.totalWords}`,
    `🔗 https://keycaster.app`,
  ].join("\n");
}

/**
 * Procedurally render a 1200x675 high-res PNG scorecard canvas
 */
export function exportScoreCardCanvas(p: ScoreCardParams): string | null {
  if (typeof document === "undefined") return null;

  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 675;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 1200, 675);
    bgGrad.addColorStop(0, "#080c14");
    bgGrad.addColorStop(1, "#020408");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1200, 675);

    const mainColor = p.themeMainColor || "#00f0ff";

    // Ambient radial glow
    const glow1 = ctx.createRadialGradient(250, 180, 10, 250, 180, 420);
    glow1.addColorStop(0, `${mainColor}22`);
    glow1.addColorStop(1, "transparent");
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, 1200, 675);

    // Cyber Border Accents
    ctx.strokeStyle = `${mainColor}33`;
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, 1120, 595);

    // Corner brackets
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 4;
    // Top-left
    ctx.beginPath();
    ctx.moveTo(40, 75); ctx.lineTo(40, 40); ctx.lineTo(75, 40);
    ctx.stroke();
    // Top-right
    ctx.beginPath();
    ctx.moveTo(1125, 40); ctx.lineTo(1160, 40); ctx.lineTo(1160, 75);
    ctx.stroke();
    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(40, 600); ctx.lineTo(40, 635); ctx.lineTo(75, 635);
    ctx.stroke();
    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(1125, 635); ctx.lineTo(1160, 635); ctx.lineTo(1160, 600);
    ctx.stroke();

    // Branding Title
    ctx.font = "bold 34px monospace";
    ctx.fillStyle = mainColor;
    ctx.fillText("KEYCASTER", 80, 110);

    ctx.font = "600 15px monospace";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("// SRS NEURAL TYPING ENGINE", 300, 108);

    // Deck Tag Pill
    ctx.fillStyle = `${mainColor}18`;
    ctx.strokeStyle = `${mainColor}44`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(80, 138, 280, 36, 18);
    ctx.fill();
    ctx.stroke();

    ctx.font = "bold 13px monospace";
    ctx.fillStyle = mainColor;
    ctx.fillText(`DECK: ${p.deckName.replace("_", " ").toUpperCase()}`, 102, 161);

    // 4 Big Metrics Boxes
    const metrics = [
      { label: "WPM (NET / RAW)", val: `${p.wpm} / ${p.rawWpm ?? p.wpm}`, color: mainColor },
      { label: "ACCURACY", val: `${p.accuracy}%`, color: "#f8fafc" },
      { label: "CADENCE CONSISTENCY", val: `${p.consistency}%`, color: "#38bdf8" },
      { label: "DURATION", val: `${p.durationSec}s`, color: "#94a3b8" },
    ];

    metrics.forEach((m, idx) => {
      const x = 80 + idx * 265;
      const y = 205;
      const w = 245;
      const h = 205;

      ctx.fillStyle = "rgba(15, 23, 42, 0.7)";
      ctx.strokeStyle = "rgba(148, 163, 184, 0.16)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 16);
      ctx.fill();
      ctx.stroke();

      ctx.font = "bold 12px monospace";
      ctx.fillStyle = "#64748b";
      ctx.fillText(m.label, x + 22, y + 42);

      ctx.font = "bold 42px monospace";
      ctx.fillStyle = m.color;
      ctx.fillText(m.val, x + 22, y + 115);
    });

    // Performance Summary Banner
    const summaryY = 445;
    ctx.fillStyle = "rgba(15, 23, 42, 0.45)";
    ctx.strokeStyle = "rgba(148, 163, 184, 0.12)";
    ctx.beginPath();
    ctx.roundRect(80, summaryY, 1040, 80, 16);
    ctx.fill();
    ctx.stroke();

    ctx.font = "bold 17px monospace";
    ctx.fillStyle = "#22c55e";
    ctx.fillText(`✓ ${p.passedWords} Passed / Mastered`, 110, summaryY + 47);

    ctx.fillStyle = p.failedWords > 0 ? "#ef4444" : "#64748b";
    ctx.fillText(`⚠ ${p.failedWords} Needs SRS Review`, 480, summaryY + 47);

    // Footer
    ctx.font = "14px monospace";
    ctx.fillStyle = "#64748b";
    ctx.fillText("Master Your Flow State & Precision Typing · keycaster.app", 80, 595);

    const timestamp = new Date().toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    ctx.fillText(timestamp, 980, 595);

    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

/**
 * Triggers browser download for a dataURL string
 */
export function downloadDataUrl(dataUrl: string, filename = "keycaster-scorecard.png"): void {
  if (typeof document === "undefined") return;
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
