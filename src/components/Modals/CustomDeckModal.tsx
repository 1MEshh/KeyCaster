"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, Plus, AlertCircle, Check, Layers, Trash2, Play, BookOpen } from "lucide-react";
import { db, type WordRecord, type CustomDeckRecord } from "@/lib/db";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useSessionStore } from "@/store/useSessionStore";
import { sanitizeCustomDeck, MAX_DECK_NAME_LENGTH, MAX_WORDS_PER_DECK } from "@/lib/sanitize";

interface CustomDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomDeckModal: React.FC<CustomDeckModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<"create" | "manage">("create");
  const [deckName, setDeckName] = useState("");
  const [rawWords, setRawWords] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [existingDecks, setExistingDecks] = useState<CustomDeckRecord[]>([]);

  const { activeCategory, setActiveCategory, sessionSize } = useSettingsStore();
  const initSession = useSessionStore((s) => s.initSession);

  const loadExistingDecks = useCallback(async () => {
    try {
      const decks = await db.customDecks.toArray();
      setExistingDecks(decks);
    } catch {
      // Non-blocking
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadExistingDecks();
      setErrorMsg("");
    }
  }, [isOpen, loadExistingDecks]);

  if (!isOpen) return null;

  // Real-time parsing and sanitization
  const parsedWords = Array.from(
    new Set(
      rawWords
        .split(/[\n,]+/)
        .map((w) => w.trim().toLowerCase().replace(/\s+/g, " "))
        .filter((w) => /^[a-z]+([ -][a-z]+)*$/i.test(w))
    )
  ).slice(0, MAX_WORDS_PER_DECK);

  const handleSaveDeck = async () => {
    try {
      const sanitized = sanitizeCustomDeck(deckName, rawWords);

      setIsSaving(true);
      setErrorMsg("");

      const today = new Date().toISOString().split("T")[0];

      // Insert deck and obtain primary auto-increment ID
      const deckId = await db.customDecks.add({
        name: sanitized.name,
        description: `Custom deck created on ${today}`,
        words: sanitized.words,
        createdAt: today,
      });

      const categoryKey = `custom_${deckId}`;
      await db.customDecks.update(deckId, { categoryKey });

      // Insert words into words table linking with exact categoryKey
      const wordRecords: WordRecord[] = sanitized.words.map((word) => ({
        word,
        category: categoryKey,
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        nextReviewDate: today,
        totalMistakes: 0,
        totalReviews: 0,
      }));

      await db.words.bulkAdd(wordRecords);

      // Set active category and start session
      setActiveCategory(categoryKey);
      await initSession(categoryKey, sessionSize);

      setDeckName("");
      setRawWords("");
      setIsSaving(false);
      onClose();
    } catch (err: unknown) {
      setIsSaving(false);
      const msg = err instanceof Error ? err.message : "Failed to save custom deck to database.";
      setErrorMsg(msg);
    }
  };

  const handleStudyDeck = async (deck: CustomDeckRecord) => {
    const catKey = deck.categoryKey || `custom_${deck.id}`;
    setActiveCategory(catKey);
    await initSession(catKey, sessionSize);
    onClose();
  };

  const handleDeleteDeck = async (deck: CustomDeckRecord) => {
    if (!deck.id) return;
    try {
      const catKey = deck.categoryKey || `custom_${deck.id}`;
      await db.customDecks.delete(deck.id);
      await db.words.where("category").equals(catKey).delete();

      // Reset to daily if active category was deleted
      if (activeCategory === catKey) {
        setActiveCategory("daily");
        await initSession("daily", sessionSize);
      }

      await loadExistingDecks();
    } catch (err) {
      console.error("Failed to delete deck:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-bg border border-sub/30 rounded-2xl shadow-2xl p-6 font-mono flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-sub/20">
          <div className="flex items-center gap-2 text-text font-bold text-base">
            <Layers className="w-5 h-5 text-main" />
            <span>Custom Decks</span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-sub hover:text-text hover:bg-sub/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-sub/10 rounded-xl border border-sub/20 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("create")}
            className={`flex-1 py-1.5 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "create"
                ? "bg-bg text-main shadow-xs border border-main/30"
                : "text-sub hover:text-text"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Deck</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("manage")}
            className={`flex-1 py-1.5 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "manage"
                ? "bg-bg text-main shadow-xs border border-main/30"
                : "text-sub hover:text-text"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Manage Decks ({existingDecks.length})</span>
          </button>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 p-3 text-xs bg-error/10 border border-error/30 text-error rounded-lg">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* TAB 1: CREATE DECK */}
        {activeTab === "create" && (
          <>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs uppercase text-sub font-semibold">
                  Deck Name
                </label>
                <span className="text-[10px] text-sub">
                  {deckName.length}/{MAX_DECK_NAME_LENGTH}
                </span>
              </div>
              <input
                type="text"
                maxLength={MAX_DECK_NAME_LENGTH}
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
                  {parsedWords.length}/{MAX_WORDS_PER_DECK} words
                </span>
              </div>
              <textarea
                rows={5}
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
          </>
        )}

        {/* TAB 2: MANAGE EXISTING DECKS */}
        {activeTab === "manage" && (
          <div className="space-y-3">
            {existingDecks.length === 0 ? (
              <div className="py-10 text-center text-xs text-sub italic space-y-2">
                <Layers className="w-8 h-8 text-sub/40 mx-auto" />
                <p>No custom decks found. Create one using the tab above!</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {existingDecks.map((deck) => {
                  const catKey = deck.categoryKey || `custom_${deck.id}`;
                  const isActive = activeCategory === catKey;

                  return (
                    <div
                      key={deck.id || deck.name}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all ${
                        isActive
                          ? "bg-main/10 border-main/40"
                          : "bg-sub/5 border-sub/20 hover:border-sub/40"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-text truncate">{deck.name}</span>
                          {isActive && (
                            <span className="text-[10px] bg-main/20 text-main px-1.5 py-0.2 rounded font-semibold">
                              active
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-sub mt-0.5 flex items-center gap-2">
                          <span>{deck.words.length} words</span>
                          <span>·</span>
                          <span className="opacity-70">{deck.createdAt}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStudyDeck(deck)}
                          className="px-2.5 py-1.5 rounded-lg bg-main text-bg font-bold hover:opacity-90 transition-opacity flex items-center gap-1 text-[11px]"
                          title="Practice this deck"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Study</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteDeck(deck)}
                          className="p-1.5 rounded-lg border border-sub/20 text-sub hover:text-error hover:border-error/40 hover:bg-error/10 transition-colors"
                          title="Delete this deck and its words"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
