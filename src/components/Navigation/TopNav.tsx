"use client";

import React, { useState, useEffect } from "react";
import {
  Volume2,
  Settings,
  TrendingUp,
  Plus,
  Palette,
  ChevronDown,
  Layers,
  Sparkles,
} from "lucide-react";
import { useSettingsStore, type Theme, THEME_VARIABLES } from "@/store/useSettingsStore";
import { useSessionStore } from "@/store/useSessionStore";
import { db, type CustomDeckRecord } from "@/lib/db";

interface TopNavProps {
  onOpenSettings: () => void;
  onOpenDashboard: () => void;
  onOpenCustomDeck: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  onOpenSettings,
  onOpenDashboard,
  onOpenCustomDeck,
}) => {
  const { theme, setTheme, activeCategory, setActiveCategory, sessionSize } = useSettingsStore();
  const initSession = useSessionStore((s) => s.initSession);

  const [customDecks, setCustomDecks] = useState<CustomDeckRecord[]>([]);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  useEffect(() => {
    const fetchCustomDecks = async () => {
      try {
        const decks = await db.customDecks.toArray();
        setCustomDecks(decks);
      } catch {
        // Fallback
      }
    };
    fetchCustomDecks();
  }, [activeCategory]);

  const categories = [
    { id: "daily", label: "Daily" },
    { id: "common_misspellings", label: "Common Misspellings" },
    { id: "gaming", label: "Gaming" },
    ...customDecks.map((d) => ({
      id: `custom_${d.id}`,
      label: d.name,
    })),
  ];

  const currentCategoryLabel =
    categories.find((c) => c.id === activeCategory)?.label || "Daily";

  const handleSelectCategory = async (catId: string) => {
    setActiveCategory(catId);
    setIsCategoryMenuOpen(false);
    await initSession(catId, sessionSize);
  };

  return (
    <header className="w-full max-w-5xl mx-auto flex items-center justify-between py-4 px-6 select-none font-mono">
      {/* Brand Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-main/15 text-main flex items-center justify-center font-black">
          <Volume2 className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-base font-extrabold tracking-tight text-text">KeyCaster</span>
          <span className="text-[9px] text-sub uppercase tracking-wider font-semibold -mt-1">
            Audio SRS
          </span>
        </div>
      </div>

      {/* Center Deck Selector */}
      <div className="relative">
        <button
          onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-sub/30 bg-bg hover:border-main/50 text-xs text-text transition-all"
        >
          <Layers className="w-3.5 h-3.5 text-main" />
          <span className="font-semibold">{currentCategoryLabel}</span>
          <ChevronDown className="w-3.5 h-3.5 text-sub" />
        </button>

        {isCategoryMenuOpen && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 rounded-xl border border-sub/30 bg-bg shadow-2xl py-1.5 z-40 animate-fadeIn text-xs">
            <div className="px-3 py-1 text-[10px] uppercase text-sub font-semibold">
              Standard Decks
            </div>
            {categories.slice(0, 3).map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleSelectCategory(cat.id)}
                className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-sub/10 transition-colors ${
                  activeCategory === cat.id ? "text-main font-bold" : "text-text"
                }`}
              >
                <span>{cat.label}</span>
                {activeCategory === cat.id && <span className="w-1.5 h-1.5 rounded-full bg-main" />}
              </button>
            ))}

            {customDecks.length > 0 && (
              <>
                <div className="h-px bg-sub/20 my-1" />
                <div className="px-3 py-1 text-[10px] uppercase text-sub font-semibold">
                  Custom Decks
                </div>
                {customDecks.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => handleSelectCategory(`custom_${d.id}`)}
                    className="w-full text-left px-3 py-2 hover:bg-sub/10 transition-colors text-text"
                  >
                    {d.name}
                  </button>
                ))}
              </>
            )}

            <div className="h-px bg-sub/20 my-1" />
            <button
              onClick={() => {
                setIsCategoryMenuOpen(false);
                onOpenCustomDeck();
              }}
              className="w-full text-left px-3 py-2 flex items-center gap-2 text-main hover:bg-main/10 transition-colors font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Deck</span>
            </button>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Quick Theme Selector */}
        <div className="relative">
          <button
            onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
            className="p-2 rounded-lg text-sub hover:text-text hover:bg-sub/10 transition-colors"
            title="Switch Theme"
          >
            <Palette className="w-4 h-4" />
          </button>

          {isThemeMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-44 rounded-xl border border-sub/30 bg-bg shadow-2xl py-1.5 z-40 animate-fadeIn text-xs">
              {(["serika_dark", "nord", "dracula", "midnight"] as Theme[]).map((thm) => (
                <button
                  key={thm}
                  onClick={() => {
                    setTheme(thm);
                    setIsThemeMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-sub/10 transition-colors capitalize ${
                    theme === thm ? "text-main font-bold" : "text-text"
                  }`}
                >
                  <span>{thm.replace("_", " ")}</span>
                  <span
                    className="w-3 h-3 rounded-full border border-sub/30"
                    style={{ backgroundColor: THEME_VARIABLES[thm].main }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dashboard Icon */}
        <button
          onClick={onOpenDashboard}
          className="p-2 rounded-lg text-sub hover:text-text hover:bg-sub/10 transition-colors"
          title="SRS Progress Dashboard (Ctrl+D)"
        >
          <TrendingUp className="w-4 h-4" />
        </button>

        {/* Settings Icon */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-lg text-sub hover:text-text hover:bg-sub/10 transition-colors"
          title="Settings (Ctrl+,)"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
