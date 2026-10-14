/**
 * KeyCaster Session History CSV Exporter & Ergonomics Utilities
 *
 * Implements RFC 4180 compliant CSV serialization for session history logs,
 * plus finger ergonomics attribution for touch-typing analytics.
 */

import { type SessionHistoryRecord } from "@/lib/db";

export interface FingerZone {
  name: string;
  hand: "left" | "right";
  finger: "pinky" | "ring" | "middle" | "index";
  keys: string[];
}

export const FINGER_ZONES: FingerZone[] = [
  { name: "Left Pinky", hand: "left", finger: "pinky", keys: ["q", "a", "z"] },
  { name: "Left Ring", hand: "left", finger: "ring", keys: ["w", "s", "x"] },
  { name: "Left Middle", hand: "left", finger: "middle", keys: ["e", "d", "c"] },
  { name: "Left Index", hand: "left", finger: "index", keys: ["r", "t", "f", "g", "v", "b"] },
  { name: "Right Index", hand: "right", finger: "index", keys: ["y", "u", "h", "j", "n", "m"] },
  { name: "Right Middle", hand: "right", finger: "middle", keys: ["i", "k"] },
  { name: "Right Ring", hand: "right", finger: "ring", keys: ["o", "l"] },
  { name: "Right Pinky", hand: "right", finger: "pinky", keys: ["p"] },
];

export interface FingerZoneStats {
  zone: FingerZone;
  mistakes: number;
  percentage: number;
}

/**
 * Calculates mistake distribution across finger ergonomics zones.
 */
export function calculateFingerErgonomics(
  errorMap: Record<string, number>
): FingerZoneStats[] {
  let totalErrors = 0;
  const zoneMistakes = FINGER_ZONES.map((zone) => {
    const mistakes = zone.keys.reduce((sum, key) => sum + (errorMap[key] || 0), 0);
    totalErrors += mistakes;
    return { zone, mistakes };
  });

  return zoneMistakes.map(({ zone, mistakes }) => ({
    zone,
    mistakes,
    percentage: totalErrors > 0 ? Math.round((mistakes / totalErrors) * 100) : 0,
  }));
}

/**
 * Escapes a single CSV field following RFC 4180 rules.
 */
function escapeCsvField(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Converts session history records to RFC 4180 compliant CSV string.
 */
export function convertSessionsToCsv(records: SessionHistoryRecord[]): string {
  const headers = [
    "Timestamp",
    "Date",
    "Time",
    "Category",
    "TotalWords",
    "WPM",
    "Accuracy",
    "Errors",
    "DurationSeconds",
  ];

  const rows = records.map((rec) => {
    const dateObj = new Date(rec.timestamp);
    const dateStr = !isNaN(dateObj.getTime())
      ? dateObj.toISOString().split("T")[0]
      : "";
    const timeStr = !isNaN(dateObj.getTime())
      ? dateObj.toISOString().split("T")[1]?.slice(0, 8) || ""
      : "";

    return [
      escapeCsvField(rec.timestamp),
      escapeCsvField(dateStr),
      escapeCsvField(timeStr),
      escapeCsvField(rec.category),
      escapeCsvField(rec.totalWords),
      escapeCsvField(rec.wpm),
      escapeCsvField(rec.accuracy),
      escapeCsvField(rec.errors),
      escapeCsvField(rec.duration),
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\r\n");
}

/**
 * Triggers a browser download of the session history CSV report.
 */
export function downloadSessionHistoryCsv(records: SessionHistoryRecord[]): void {
  if (typeof window === "undefined") return;
  const csvContent = convertSessionsToCsv(records);
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const today = new Date().toISOString().split("T")[0];
  anchor.href = url;
  anchor.download = `keycaster_session_history_${today}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
