/**
 * Local Data Health Monitor & Quick Backup Sync
 * Inspects browser IndexedDB storage quotas and generates verified JSON data backups.
 */

import { db } from "./db";

export interface StorageHealthReport {
  usedBytes: number;
  totalBytes: number;
  usedMb: number;
  percentUsed: number;
  isAvailable: boolean;
  tableCounts: {
    words: number;
    customDecks: number;
    sessionHistory: number;
    sentenceHistory: number;
    translationMastery: number;
  };
}

/**
 * Formats a byte quantity into a human-readable string (KB, MB, GB)
 */
export function formatBytes(bytes: number): string {
  if (bytes <= 0 || !Number.isFinite(bytes)) return "0 KB";
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Retrieves storage quota and IndexedDB entity statistics
 */
export async function getStorageHealthEstimate(): Promise<StorageHealthReport> {
  let usedBytes = 0;
  let totalBytes = 0;

  if (typeof navigator !== "undefined" && navigator.storage?.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      usedBytes = estimate.usage || 0;
      totalBytes = estimate.quota || 0;
    } catch {
      // Fallback
    }
  }

  let tableCounts = {
    words: 0,
    customDecks: 0,
    sessionHistory: 0,
    sentenceHistory: 0,
    translationMastery: 0,
  };

  try {
    const [wCount, dCount, sCount, senCount, tCount] = await Promise.all([
      db.words.count(),
      db.customDecks.count(),
      db.sessionHistory.count(),
      db.sentenceHistory.count(),
      db.translationMastery.count(),
    ]);
    tableCounts = {
      words: wCount,
      customDecks: dCount,
      sessionHistory: sCount,
      sentenceHistory: senCount,
      translationMastery: tCount,
    };
  } catch {
    // Non-Dexie/SSR fallback
  }

  const usedMb = +(usedBytes / (1024 * 1024)).toFixed(2);
  const percentUsed =
    totalBytes > 0 ? +((usedBytes / totalBytes) * 100).toFixed(3) : 0;

  return {
    usedBytes,
    totalBytes,
    usedMb,
    percentUsed,
    isAvailable: true,
    tableCounts,
  };
}

/**
 * Triggers a 100% offline JSON export download of all IndexedDB entities
 */
export async function exportQuickBackupJson(): Promise<boolean> {
  if (typeof document === "undefined") return false;

  try {
    const [words, customDecks, sessionHistory, sentenceHistory, translationMastery] =
      await Promise.all([
        db.words.toArray(),
        db.customDecks.toArray(),
        db.sessionHistory.toArray(),
        db.sentenceHistory.toArray(),
        db.translationMastery.toArray(),
      ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      version: 4,
      words,
      customDecks,
      sessionHistory,
      sentenceHistory,
      translationMastery,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `keycaster-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}
