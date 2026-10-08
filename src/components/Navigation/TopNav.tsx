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
  Gamepad2,
  Timer,
  Skull,
  Infinity as InfinityIcon,
  BookOpen,
  Quote,
  Languages,
  Flame,
  Award,
} from "lucide-react";
import {
  useSettingsStore,
  type Theme,
  type AppSection,
  THEME_VARIABLES,
} from "@/store/useSettingsStore";
import { useSessionStore } from "@/store/useSessionStore";
import { useSentenceStore } from "@/store/useSentenceStore";
import { useGameModeStore, type GameModeType } from "@/store/useGameModeStore";
import { useProfileStore } from "@/store/useProfileStore";
import { db, type CustomDeckRecord } from "@/lib/db";

interface TopNavProps {
  onOpenSettings: () => void;
  onOpenDashboard: () => void;
  onOpenCustomDeck: () => void;
  activeSection?: AppSection;
  onSelectSection?: (section: AppSection) => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  onOpenSettings,
  onOpenDashboard,
  onOpenCustomDeck,
  activeSection: propActiveSection,
  onSelectSection: propOnSelectSection,
}) => {
  const {
    theme,
    setTheme,
    activeCategory,
    setActiveCategory,
    sessionSize,
    activeSection: storeActiveSection,
    setActiveSection: storeSetActiveSection,
  } = useSettingsStore();

  const currentSection = propActiveSection || storeActiveSection || "srs_words";

  const initSession = useSessionStore((s) => s.initSession);
  const initSentenceSession = useSentenceStore((s) => s.initSentenceSession);
  const { mode: gameMode, startMode, exitToSRS } = useGameModeStore();
  const { streak, level, getRank, checkStreak } = useProfileStore();

  const [customDecks, setCustomDecks] = useState<CustomDeckRecord[]>([]);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isArcadeMenuOpen, setIsArcadeMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  useEffect(() => {
    checkStreak();
  }, [checkStreak]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsCategoryMenuOpen(false);
        setIsArcadeMenuOpen(false);
        setIsThemeMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

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
    { id: "coding", label: "Coding" },
    ...customDecks.map((d) => ({
      id: `custom_${d.id}`,
      label: d.name,
    })),
  ];

  const currentCategoryLabel =
    categories.find((c) => c.id === activeCategory)?.label || "Daily";

  const handleSelectSection = async (section: AppSection) => {
    if (propOnSelectSection) {
      propOnSelectSection(section);
    } else {
      storeSetActiveSection(section);
    }

    if (section === "srs_words") {
      exitToSRS();
      await initSession(activeCategory, sessionSize);
    } else if (section === "sentences") {
      exitToSRS();
      await initSentenceSession("sentences", activeCategory);
    } else if (section === "arabic_dictation") {
      exitToSRS();
      await initSentenceSession("translation", activeCategory);
    } else if (section === "arcade") {
      if (gameMode === "srs") {
        startMode("time_attack");
      }
    }
  };

  const handleSelectCategory = async (catId: string) => {
    setActiveCategory(catId);
    setIsCategoryMenuOpen(false);
    if (currentSection === "srs_words") {
      await initSession(catId, sessionSize);
    } else if (currentSection === "sentences") {
      await initSentenceSession("sentences", catId);
    } else if (currentSection === "arabic_dictation") {
      await initSentenceSession("translation", catId);
    }
  };

  return (
    <header className="w-full max-w-6xl mx-auto flex flex-col gap-2 py-3 px-4 sm:px-6 select-none font-mono relative z-20">
      {/* Click-outside backdrop to dismiss any open dropdown */}
      {(isCategoryMenuOpen || isArcadeMenuOpen || isThemeMenuOpen) && (
        <div
          className="fixed inset-0 z-30 bg-transparent"
          onClick={() => {
            setIsCategoryMenuOpen(false);
            setIsArcadeMenuOpen(false);
            setIsThemeMenuOpen(false);
          }}
        />
      )}

      {/* Main Top Bar */}
      <div className="flex items-center justify-between w-full">
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-main/15 text-main flex items-center justify-center font-black shadow-sm">
            <Volume2 className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-extrabold tracking-tight text-text leading-tight">KeyCaster</span>
            <span className="text-[9px] text-sub uppercase tracking-wider font-semibold -mt-0.5">
              3.0 Audio SRS
            </span>
          </div>
        </div>

        {/* Section Selector: Desktop Segmented Control */}
        <div className="hidden lg:flex items-center p-1 rounded-xl bg-sub/10 border border-sub/20 shadow-inner">
          {/* SRS Words */}
          <button
            onClick={() => handleSelectSection("srs_words")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentSection === "srs_words"
                ? "bg-bg text-main shadow-sm border border-main/30"
                : "text-sub hover:text-text hover:bg-sub/10"
            }`}
            title="Spaced Repetition Word Spelling (Ctrl+1)"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>SRS Words</span>
          </button>

          {/* Sentences */}
          <button
            onClick={() => handleSelectSection("sentences")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentSection === "sentences"
                ? "bg-bg text-main shadow-sm border border-main/30"
                : "text-sub hover:text-text hover:bg-sub/10"
            }`}
            title="Full English Sentences (Ctrl+2)"
          >
            <Quote className="w-3.5 h-3.5" />
            <span>Sentences</span>
          </button>

          {/* Arabic Dictation */}
          <button
            onClick={() => handleSelectSection("arabic_dictation")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentSection === "arabic_dictation"
                ? "bg-bg text-main shadow-sm border border-main/30"
                : "text-sub hover:text-text hover:bg-sub/10"
            }`}
            title="Arabic to English Dictation (Ctrl+3)"
          >
            <Languages className="w-3.5 h-3.5" />
            <span>Arabic Dictation</span>
            <span
              dir="rtl"
              className="text-[10px] px-1 py-0.2 rounded bg-main/15 text-main font-thmanyah font-bold ml-0.5"
            >
              ترجمة
            </span>
          </button>

          {/* Arcade */}
          <button
            onClick={() => handleSelectSection("arcade")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentSection === "arcade"
                ? "bg-bg text-main shadow-sm border border-main/30"
                : "text-sub hover:text-text hover:bg-sub/10"
            }`}
            title="Arcade: Time Attack, Sudden Death, Endless (Ctrl+4)"
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Arcade</span>
          </button>
        </div>

        {/* Right Section Controls: Contextual Pill + Gamification + Settings */}
        <div className="flex items-center gap-2">
          {/* Contextual Deck Selector Pill (Active in SRS Words, Sentences, Dictation) */}
          {currentSection !== "arcade" ? (
            <div className="relative">
              <button
                onClick={() => {
                  setIsCategoryMenuOpen(!isCategoryMenuOpen);
                  setIsArcadeMenuOpen(false);
                  setIsThemeMenuOpen(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sub/25 bg-sub/5 hover:border-main/50 text-xs text-text transition-all"
                title="Select Category / Deck"
              >
                <Layers className="w-3.5 h-3.5 text-main" />
                <span className="font-semibold max-w-[110px] truncate">{currentCategoryLabel}</span>
                <ChevronDown className="w-3 h-3 text-sub" />
              </button>

              {isCategoryMenuOpen && (
                <div className="absolute right-0 sm:left-1/2 sm:-translate-x-1/2 top-full mt-2 w-56 rounded-xl border border-sub/30 bg-bg shadow-2xl py-1.5 z-40 animate-fadeIn text-xs">
                  <div className="px-3 py-1 text-[10px] uppercase text-sub font-semibold">
                    Standard Decks
                  </div>
                  {categories.slice(0, 4).map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleSelectCategory(cat.id)}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-sub/10 transition-colors ${
                        activeCategory === cat.id ? "text-main font-bold" : "text-text"
                      }`}
                    >
                      <span>{cat.label}</span>
                      {activeCategory === cat.id && (
                        <span className="w-1.5 h-1.5 rounded-full bg-main" />
                      )}
                    </button>
                  ))}

                  <div className="h-px bg-sub/20 my-1" />
                  <div className="px-3 py-1 text-[10px] uppercase text-sub font-semibold flex items-center justify-between">
                    <span>Custom Decks</span>
                    <span className="text-[10px] text-sub/70">({customDecks.length})</span>
                  </div>

                  {customDecks.length > 0 ? (
                    customDecks.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => handleSelectCategory(`custom_${d.id}`)}
                        className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-sub/10 transition-colors ${
                          activeCategory === `custom_${d.id}`
                            ? "text-main font-bold"
                            : "text-text"
                        }`}
                      >
                        <span className="truncate">{d.name}</span>
                        <span className="text-[10px] text-sub">{d.words?.length || 0}w</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-1.5 text-[11px] text-sub/60 italic">
                      No custom decks yet
                    </div>
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
                    <span>Create Custom Deck</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Contextual Arcade Mode Selector Pill (Active in Arcade mode) */
            <div className="relative">
              <button
                onClick={() => {
                  setIsArcadeMenuOpen(!isArcadeMenuOpen);
                  setIsCategoryMenuOpen(false);
                  setIsThemeMenuOpen(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-main/40 bg-main/10 text-main text-xs font-bold transition-all"
                title="Select Arcade Game Mode"
              >
                {gameMode === "time_attack" && <Timer className="w-3.5 h-3.5 text-amber-400" />}
                {gameMode === "sudden_death" && <Skull className="w-3.5 h-3.5 text-red-500" />}
                {gameMode === "endless" && <InfinityIcon className="w-3.5 h-3.5 text-cyan-400" />}
                {gameMode === "srs" && <Gamepad2 className="w-3.5 h-3.5" />}
                <span className="capitalize">{gameMode === "srs" ? "Time Attack" : gameMode.replace("_", " ")}</span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>

              {isArcadeMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-sub/30 bg-bg shadow-2xl py-1.5 z-40 animate-fadeIn text-xs">
                  <div className="px-3 py-1 text-[10px] uppercase text-sub font-semibold">
                    Arcade Sub-Modes
                  </div>

                  <button
                    onClick={() => {
                      startMode("time_attack");
                      setIsArcadeMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-sub/10 transition-colors ${
                      gameMode === "time_attack"
                        ? "text-amber-400 font-bold bg-amber-400/5"
                        : "text-text"
                    }`}
                  >
                    <Timer className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="font-semibold">60s Time Attack</div>
                      <div className="text-[10px] text-sub">Speed run against the clock</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      startMode("sudden_death");
                      setIsArcadeMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-sub/10 transition-colors ${
                      gameMode === "sudden_death"
                        ? "text-red-500 font-bold bg-red-500/5"
                        : "text-text"
                    }`}
                  >
                    <Skull className="w-4 h-4 text-red-500 shrink-0" />
                    <div>
                      <div className="font-semibold">Sudden Death</div>
                      <div className="text-[10px] text-sub">1 single error = Game Over</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      startMode("endless");
                      setIsArcadeMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-sub/10 transition-colors ${
                      gameMode === "endless"
                        ? "text-cyan-400 font-bold bg-cyan-400/5"
                        : "text-text"
                    }`}
                  >
                    <InfinityIcon className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <div className="font-semibold">Zen / Endless</div>
                      <div className="text-[10px] text-sub">Infinite stress-free typing</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Daily Streak */}
          <div
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-bold select-none cursor-default"
            title={`${streak} day practice streak! Practice daily to keep your flame lit.`}
          >
            <Flame className="w-3.5 h-3.5 fill-current animate-pulse text-amber-400" />
            <span>{streak}</span>
          </div>

          {/* Typing Rank & Level */}
          <button
            onClick={onOpenDashboard}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-sub/25 bg-sub/5 hover:border-main/50 text-xs transition-colors"
            title={`Level ${level} · ${getRank()} · Click to open Dashboard`}
          >
            <Award className="w-3.5 h-3.5 text-main" />
            <span className="font-semibold text-text">{getRank()}</span>
            <span className="text-[10px] text-sub">Lvl {level}</span>
          </button>

          {/* Quick Theme Selector */}
          <div className="relative">
            <button
              onClick={() => {
                setIsThemeMenuOpen(!isThemeMenuOpen);
                setIsCategoryMenuOpen(false);
                setIsArcadeMenuOpen(false);
              }}
              className="p-2 rounded-lg text-sub hover:text-text hover:bg-sub/10 border border-sub/20 transition-colors"
              title="Switch Theme"
            >
              <Palette className="w-4 h-4" />
            </button>

            {isThemeMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-44 rounded-xl border border-sub/30 bg-bg shadow-2xl py-1.5 z-40 animate-fadeIn text-xs">
                {(["cyberpunk", "midnight", "monochrome", "serika_dark", "nord", "dracula"] as Theme[]).map((thm) => (
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
            className="p-2 rounded-lg text-sub hover:text-text hover:bg-sub/10 border border-sub/20 transition-colors"
            title="SRS Progress Dashboard (Ctrl+D)"
          >
            <TrendingUp className="w-4 h-4" />
          </button>

          {/* Settings Icon */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg text-sub hover:text-text hover:bg-sub/10 border border-sub/20 transition-colors"
            title="Settings (Ctrl+,)"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile / Tablet Segmented Section Selector (< lg screens) */}
      <div className="flex lg:hidden items-center justify-between w-full p-1 rounded-xl bg-sub/10 border border-sub/20 shadow-inner overflow-x-auto gap-1">
        <button
          onClick={() => handleSelectSection("srs_words")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            currentSection === "srs_words"
              ? "bg-bg text-main shadow-sm border border-main/30"
              : "text-sub hover:text-text"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Words</span>
        </button>

        <button
          onClick={() => handleSelectSection("sentences")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            currentSection === "sentences"
              ? "bg-bg text-main shadow-sm border border-main/30"
              : "text-sub hover:text-text"
          }`}
        >
          <Quote className="w-3.5 h-3.5" />
          <span>Sentences</span>
        </button>

        <button
          onClick={() => handleSelectSection("arabic_dictation")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            currentSection === "arabic_dictation"
              ? "bg-bg text-main shadow-sm border border-main/30"
              : "text-sub hover:text-text"
          }`}
        >
          <Languages className="w-3.5 h-3.5" />
          <span>Dictation</span>
          <span
            dir="rtl"
            className="text-[9px] px-1 rounded bg-main/15 text-main font-thmanyah font-bold"
          >
            ترجمة
          </span>
        </button>

        <button
          onClick={() => handleSelectSection("arcade")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            currentSection === "arcade"
              ? "bg-bg text-main shadow-sm border border-main/30"
              : "text-sub hover:text-text"
          }`}
        >
          <Gamepad2 className="w-3.5 h-3.5" />
          <span>Arcade</span>
        </button>
      </div>
    </header>
  );
};
