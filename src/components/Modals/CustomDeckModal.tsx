"use client";

import React, { useState } from "react";
import { X, Plus, AlertCircle, Check } from "lucide-react";
import { db, type WordRecord } from "@/lib/db";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useSessionStore } from "@/store/useSessionStore";

interface CustomDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomDeckModal: React.FC<CustomDeckModalProps> = ({ isOpen, onClose }) => {
  const [deckName, setDeckName] = useState("");
  const [rawWords, setRawWords] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { setActiveCategory, sessionSize } = useSettingsStore();
  const initSession = useSessionStore((s) => s.initSession);

  if (!isOpen) return null;

  // Real-time parsing and sanitization
  const parsedWords = Array.from(
    new Set(
      rawWords
        .split(/[\n,]+/)
        .map((w) => w.trim().toLowerCase().replace(/\s+/g, " "))
        .filter((w) => /^[a-z]+(\s[a-z]+)*$/i.test(w))
    )
  );

  const handleSaveDeck = async () => {
    if (!deckName.trim()) {
      setErrorMsg("Please provide a name for this custom deck.");
      return;
    }

    if (parsedWords.length === 0) {
      setErrorMsg("Please enter at least 1 valid alphabetic word.");
      return;
    }

    setIsSaving(true);
    setErrorMsg("");

    try {
      const categoryId = `custom_${Date.now()}`;
      const today = new Date().toISOString().split("T")[0];

      // Save custom deck meta
      await db.customDecks.add({
        name: deckName.trim(),
        description: `Custom deck created on ${today}`,
        words: parsedWords,
        createdAt: today,
      });

      // Insert words into words table
      const wordRecords: WordRecord[] = parsedWords.map((word) => ({
        word,
        category: categoryId,
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        nextReviewDate: today,
        totalMistakes: 0,
        totalReviews: 0,
      }));

      await db.words.bulkAdd(wordRecords);

      // Set active category and start session
      setActiveCategory(categoryId);
      await initSession(categoryId, sessionSize);

      setDeckName("");
      setRawWords("");
      setIsSaving(false);
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to save custom deck to database.");
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-bg border border-sub/30 rounded-2xl shadow-2xl p-6 font-mono flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-sub/20">
          <div className="flex items-center gap-2 text-text font-bold text-base">
            <Plus className="w-5 h-5 text-main" />
            <span>Create Custom Deck</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-sub hover:text-text hover:bg-sub/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 p-3 text-xs bg-error/10 border border-error/30 text-error rounded-lg">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div>
          <label className="text-xs uppercase text-sub font-semibold block mb-1.5">
            Deck Name
          </label>
          <input
            type="text"
            placeholder="e.g. GRE Vocabulary, Biology Terms..."
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
            className="w-full p-2.5 rounded-lg border border-sub/30 bg-bg text-text text-xs focus:border-main focus:outline-none"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs uppercase text-sub font-semibold">
              Words (Comma or Newline separated)
            </label>
            <span className="text-xs text-main font-semibold">
              {parsedWords.length} unique words
            </span>
          </div>
          <textarea
            rows={6}
            placeholder="accommodate, liaison, rhythm, conscious, occurrence&#10;separate, bureaucracy, receipt"
            value={rawWords}
            onChange={(e) => setRawWords(e.target.value)}
            className="w-full p-3 rounded-lg border border-sub/30 bg-bg text-text text-xs font-mono focus:border-main focus:outline-none leading-relaxed resize-none"
          />
        </div>

        {parsedWords.length > 0 && (
          <div className="p-3 bg-sub/5 rounded-lg border border-sub/20 max-h-24 overflow-y-auto">
            <div className="text-[11px] text-sub uppercase mb-1 font-semibold">Preview:</div>
            <div className="flex flex-wrap gap-1.5">
              {parsedWords.map((word) => (
                <span
                  key={word}
                  className="px-2 py-0.5 rounded bg-sub/10 text-text text-[11px] border border-sub/20"
                >
                  {word}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-sub/20">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-sub hover:text-text transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveDeck}
            disabled={isSaving || parsedWords.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-main text-bg text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{isSaving ? "Saving..." : "Save & Practice"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
