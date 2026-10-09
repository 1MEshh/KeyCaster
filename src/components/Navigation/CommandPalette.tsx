"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  Zap,
  BookOpen,
  Languages,
  Gamepad2,
  Palette,
  Volume2,
  Sliders,
  BarChart2,
  PlusCircle,
  Eye,
  Keyboard,
  RotateCcw,
  Sparkles,
  Check,
} from "lucide-react";
import { useSettingsStore, type Theme, type AppSection, type AmbientBackdrop } from "@/store/useSettingsStore";
import { useSessionStore } from "@/store/useSessionStore";
import { useSentenceStore } from "@/store/useSentenceStore";
import { useGameModeStore } from "@/store/useGameModeStore";
import { playMechanicalClick, type SwitchSoundProfile } from "@/lib/audio";

interface CommandItem {
  id: string;
  category: "Navigation" | "Theme" | "Audio" | "Toggles" | "Actions";
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  keywords: string[];
  action: () => void;
  active?: boolean;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onOpenDashboard: () => void;
  onOpenCustomDeck: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenSettings,
  onOpenDashboard,
  onOpenCustomDeck,
}) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const {
    theme,
    setTheme,
    switchSound,
    setSwitchSound,
    soundVolume,
    blindMode,
    setBlindMode,
    customCursor,
    setCustomCursor,
    showKeyboard,
    setShowKeyboard,
    ambientBackdrop,
    setAmbientBackdrop,
    activeSection,
    setActiveSection,
    activeCategory,
    sessionSize,
    isZenMode,
    setIsZenMode,
  } = useSettingsStore();

  const { initSession } = useSessionStore();
  const { initSentenceSession } = useSentenceStore();
  const { startMode } = useGameModeStore();

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Define commands catalog
  const commands = useMemo<CommandItem[]>(() => {
    return [
      // Navigation
      {
        id: "nav-words",
        category: "Navigation",
        title: "Words SRS Mode",
        subtitle: "Spaced repetition adaptive vocabulary typing",
        icon: <BookOpen className="w-4 h-4 text-main" />,
        keywords: ["words", "srs", "vocabulary", "english", "study"],
        active: activeSection === "srs_words",
        action: () => {
          setActiveSection("srs_words");
          initSession(activeCategory, sessionSize);
        },
      },
      {
        id: "nav-sentences",
        category: "Navigation",
        title: "Full Sentences Practice",
        subtitle: "Multi-line natural syntax & grammar rhythm",
        icon: <Languages className="w-4 h-4 text-cyan-400" />,
        keywords: ["sentences", "syntax", "grammar", "english", "paragraphs"],
        active: activeSection === "sentences",
        action: () => {
          setActiveSection("sentences");
          initSentenceSession("sentences", activeCategory);
        },
      },
      {
        id: "nav-arabic",
        category: "Navigation",
        title: "Bilingual Arabic Dictation",
        subtitle: "Translate and transcribe Arabic cues to English",
        icon: <Zap className="w-4 h-4 text-amber-400" />,
        keywords: ["arabic", "dictation", "translation", "bilingual", "audio"],
        active: activeSection === "arabic_dictation",
        action: () => {
          setActiveSection("arabic_dictation");
          initSentenceSession("translation", activeCategory);
        },
      },
      {
        id: "nav-arcade-time",
        category: "Navigation",
        title: "Arcade: 60s Time Attack",
        subtitle: "Sprint against the clock for maximum score",
        icon: <Gamepad2 className="w-4 h-4 text-rose-400" />,
        keywords: ["arcade", "time attack", "60s", "game", "rush", "fast"],
        active: activeSection === "arcade",
        action: () => {
          setActiveSection("arcade");
          startMode("time_attack");
        },
      },
      {
        id: "nav-arcade-sudden",
        category: "Navigation",
        title: "Arcade: Sudden Death",
        subtitle: "One mistake ends the run. Maximum precision",
        icon: <Gamepad2 className="w-4 h-4 text-red-500" />,
        keywords: ["arcade", "sudden death", "perfection", "hardcore", "game"],
        action: () => {
          setActiveSection("arcade");
          startMode("sudden_death");
        },
      },

      // Themes
      {
        id: "theme-cyberpunk",
        category: "Theme",
        title: "Theme: Night City Neon (Cyberpunk)",
        subtitle: "Ultra high-contrast cyan, hot magenta & deep obsidian",
        icon: <Palette className="w-4 h-4 text-cyan-400" />,
        keywords: ["cyberpunk", "night city", "neon", "theme", "cyan", "magenta"],
        active: theme === "cyberpunk",
        action: () => setTheme("cyberpunk"),
      },
      {
        id: "theme-monochrome",
        category: "Theme",
        title: "Theme: Monochrome Minimal",
        subtitle: "Pure paper white and crisp dark slate",
        icon: <Palette className="w-4 h-4 text-zinc-300" />,
        keywords: ["monochrome", "minimal", "black and white", "theme", "clean"],
        active: theme === "monochrome",
        action: () => setTheme("monochrome"),
      },
      {
        id: "theme-nord",
        category: "Theme",
        title: "Theme: Nord Frost",
        subtitle: "Arctic polar night and frosty glacial blues",
        icon: <Palette className="w-4 h-4 text-blue-300" />,
        keywords: ["nord", "arctic", "blue", "frost", "theme"],
        active: theme === "nord",
        action: () => setTheme("nord"),
      },
      {
        id: "theme-dracula",
        category: "Theme",
        title: "Theme: Dracula Midnight",
        subtitle: "Vampiric purple, soft pink and emerald green",
        icon: <Palette className="w-4 h-4 text-purple-400" />,
        keywords: ["dracula", "purple", "dark", "theme"],
        active: theme === "dracula",
        action: () => setTheme("dracula"),
      },
      {
        id: "theme-serika",
        category: "Theme",
        title: "Theme: Serika Dark",
        subtitle: "Industrial graphite and vibrant caution yellow",
        icon: <Palette className="w-4 h-4 text-yellow-400" />,
        keywords: ["serika", "yellow", "dark", "theme", "caution"],
        active: theme === "serika_dark",
        action: () => setTheme("serika_dark"),
      },
      {
        id: "theme-midnight",
        category: "Theme",
        title: "Theme: Midnight Deep",
        subtitle: "Deep indigo night sky with electric accents",
        icon: <Palette className="w-4 h-4 text-indigo-400" />,
        keywords: ["midnight", "indigo", "deep", "theme"],
        active: theme === "midnight",
        action: () => setTheme("midnight"),
      },

      // Audio Switches
      {
        id: "audio-cherry-blue",
        category: "Audio",
        title: "Switch: Cherry MX Blue",
        subtitle: "Sharp tactile click with dual-stage snap",
        icon: <Volume2 className="w-4 h-4 text-blue-400" />,
        keywords: ["cherry blue", "clicky", "switch", "sound", "loud"],
        active: switchSound === "cherry_blue",
        action: () => {
          setSwitchSound("cherry_blue");
          playMechanicalClick(soundVolume, "cherry_blue");
        },
      },
      {
        id: "audio-ink-black",
        category: "Audio",
        title: "Switch: Gateron Ink Black",
        subtitle: "Deep creamy lubed thock with low-pitch resonance",
        icon: <Volume2 className="w-4 h-4 text-zinc-400" />,
        keywords: ["gateron", "ink black", "thock", "creamy", "linear", "switch"],
        active: switchSound === "gateron_ink_black",
        action: () => {
          setSwitchSound("gateron_ink_black");
          playMechanicalClick(soundVolume, "gateron_ink_black");
        },
      },
      {
        id: "audio-topre",
        category: "Audio",
        title: "Switch: Topre Capacitive",
        subtitle: "Electrostatic dome pop and muted cushioned return",
        icon: <Volume2 className="w-4 h-4 text-purple-300" />,
        keywords: ["topre", "capacitive", "dome", "pop", "quiet", "switch"],
        active: switchSound === "topre_capacitive",
        action: () => {
          setSwitchSound("topre_capacitive");
          playMechanicalClick(soundVolume, "topre_capacitive");
        },
      },
      {
        id: "audio-typewriter",
        category: "Audio",
        title: "Switch: Vintage Typewriter",
        subtitle: "Metallic hammer strike with resonant metal ping",
        icon: <Volume2 className="w-4 h-4 text-amber-500" />,
        keywords: ["typewriter", "vintage", "metal", "strike", "ping", "switch"],
        active: switchSound === "typewriter",
        action: () => {
          setSwitchSound("typewriter");
          playMechanicalClick(soundVolume, "typewriter");
        },
      },
      {
        id: "audio-cherry-brown",
        category: "Audio",
        title: "Switch: Cherry MX Brown",
        subtitle: "Classic balanced tactile snap",
        icon: <Volume2 className="w-4 h-4 text-amber-700" />,
        keywords: ["cherry brown", "tactile", "switch", "classic"],
        active: switchSound === "cherry_brown",
        action: () => {
          setSwitchSound("cherry_brown");
          playMechanicalClick(soundVolume, "cherry_brown");
        },
      },

      // Toggles & Settings
      {
        id: "toggle-zen",
        category: "Toggles",
        title: `Zen Mode (Flow State): ${isZenMode ? "Exit" : "Enter"}`,
        subtitle: "Distraction-free auto-dimming with focus vignette (Alt+Z / Ctrl+Shift+F)",
        icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
        keywords: ["zen", "flow", "distraction free", "focus", "dim", "vignette", "toggle"],
        active: isZenMode,
        action: () => setIsZenMode(!isZenMode),
      },
      {
        id: "toggle-keyboard",
        category: "Toggles",
        title: `Virtual Keyboard: ${showKeyboard ? "Hide" : "Show"}`,
        subtitle: "Interactive visual keycaps with real-time feedback",
        icon: <Keyboard className="w-4 h-4 text-emerald-400" />,
        keywords: ["virtual keyboard", "keys", "layout", "toggle"],
        active: showKeyboard,
        action: () => setShowKeyboard(!showKeyboard),
      },
      {
        id: "toggle-blind",
        category: "Toggles",
        title: `Blind Mode: ${blindMode ? "Disable" : "Enable"}`,
        subtitle: "Hide pending letters for true pure acoustic spelling",
        icon: <Eye className="w-4 h-4 text-main" />,
        keywords: ["blind", "mask", "spelling", "dictation", "toggle"],
        active: blindMode,
        action: () => setBlindMode(!blindMode),
      },
      {
        id: "toggle-cursor",
        category: "Toggles",
        title: `Cyber Cursor: ${customCursor ? "Disable" : "Enable"}`,
        subtitle: "Hardware-accelerated precision ring and spring dot",
        icon: <Sparkles className="w-4 h-4 text-cyan-400" />,
        keywords: ["custom cursor", "mouse", "pointer", "ring", "dot"],
        active: customCursor,
        action: () => setCustomCursor(!customCursor),
      },
      {
        id: "backdrop-cyber",
        category: "Toggles",
        title: "Backdrop: Cyber Horizon Synth Grid",
        subtitle: "3D perspective horizon with dual reactive particle pulse",
        icon: <Sparkles className="w-4 h-4 text-cyan-300" />,
        keywords: ["backdrop", "cyber horizon", "synthwave", "canvas", "grid"],
        active: ambientBackdrop === "cyber_grid",
        action: () => setAmbientBackdrop("cyber_grid"),
      },

      // Actions & Modals
      {
        id: "action-settings",
        category: "Actions",
        title: "Open Preferences & Settings",
        subtitle: "Customize caret, audio, fonts, HUD, and confidence mode",
        icon: <Sliders className="w-4 h-4 text-main" />,
        keywords: ["settings", "preferences", "config", "options"],
        action: onOpenSettings,
      },
      {
        id: "action-dashboard",
        category: "Actions",
        title: "Open Analytics Dashboard",
        subtitle: "Review heatmaps, SM-2 retention curves, and XP history",
        icon: <BarChart2 className="w-4 h-4 text-main" />,
        keywords: ["dashboard", "analytics", "stats", "history", "xp", "retention"],
        action: onOpenDashboard,
      },
      {
        id: "action-custom-deck",
        category: "Actions",
        title: "Create Custom Word Deck",
        subtitle: "Import your own custom vocabulary and training lists",
        icon: <PlusCircle className="w-4 h-4 text-main" />,
        keywords: ["custom deck", "import", "words", "add deck", "list"],
        action: onOpenCustomDeck,
      },
      {
        id: "action-restart",
        category: "Actions",
        title: "Restart Current Session",
        subtitle: "Reset progress and restart queue immediately",
        icon: <RotateCcw className="w-4 h-4 text-main" />,
        keywords: ["restart", "reset", "reload", "new session"],
        action: () => {
          if (activeSection === "srs_words") {
            initSession(activeCategory, sessionSize);
          } else if (activeSection === "sentences") {
            initSentenceSession("sentences", activeCategory);
          } else if (activeSection === "arabic_dictation") {
            initSentenceSession("translation", activeCategory);
          }
        },
      },
    ];
  }, [
    activeSection,
    activeCategory,
    sessionSize,
    theme,
    switchSound,
    soundVolume,
    blindMode,
    customCursor,
    showKeyboard,
    ambientBackdrop,
    setActiveSection,
    setTheme,
    setSwitchSound,
    setBlindMode,
    setCustomCursor,
    setShowKeyboard,
    setAmbientBackdrop,
    initSession,
    initSentenceSession,
    startMode,
    onOpenSettings,
    onOpenDashboard,
    onOpenCustomDeck,
  ]);

  // Filter commands by query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    const lower = query.toLowerCase().trim();
    return commands.filter((cmd) => {
      return (
        cmd.title.toLowerCase().includes(lower) ||
        (cmd.subtitle && cmd.subtitle.toLowerCase().includes(lower)) ||
        cmd.category.toLowerCase().includes(lower) ||
        cmd.keywords.some((k) => k.toLowerCase().includes(lower))
      );
    });
  }, [commands, query]);

  // Clamp selected index
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle keyboard navigation inside palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev - 1 < 0 ? Math.max(0, filteredCommands.length - 1) : prev - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selected = filteredCommands[selectedIndex];
      if (selected) {
        selected.action();
        onClose();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-bg border border-main/30 rounded-2xl shadow-[0_0_35px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col max-h-[75vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-sub/20 bg-sub/5">
          <Search className="w-5 h-5 text-main mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands, modes, themes, switches..."
            className="w-full bg-transparent text-text placeholder-sub/60 focus:outline-none text-sm font-mono"
            aria-label="Command search"
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-sub/80 bg-sub/10 rounded border border-sub/20 ml-2">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-transparent"
        >
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center text-sub text-xs font-mono">
              No matching commands found for &quot;{query}&quot;
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  data-index={idx}
                  onClick={() => {
                    cmd.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? "bg-main/15 text-main font-semibold shadow-sm"
                      : "text-text hover:bg-sub/10"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        isSelected ? "bg-main/20 text-main" : "bg-sub/10 text-sub"
                      }`}
                    >
                      {cmd.icon}
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-mono flex items-center gap-2">
                        <span>{cmd.title}</span>
                        {cmd.active && (
                          <span className="flex items-center gap-0.5 text-[10px] text-main font-normal px-1.5 py-0.2 bg-main/10 rounded-full border border-main/20">
                            <Check className="w-2.5 h-2.5" /> active
                          </span>
                        )}
                      </div>
                      {cmd.subtitle && (
                        <div className="text-[11px] text-sub/70 truncate font-mono">
                          {cmd.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  <span className="text-[10px] uppercase font-mono tracking-wider text-sub/50 shrink-0 ml-2 px-1.5 py-0.5 rounded bg-sub/5">
                    {cmd.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="px-4 py-2 bg-sub/5 border-t border-sub/15 flex items-center justify-between text-[11px] font-mono text-sub/60 select-none">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1 bg-sub/10 rounded">↑</kbd>{" "}
              <kbd className="px-1 bg-sub/10 rounded">↓</kbd> navigate
            </span>
            <span>
              <kbd className="px-1 bg-sub/10 rounded">↵</kbd> execute
            </span>
          </div>
          <span>KeyCaster Command Matrix</span>
        </div>
      </div>
    </div>
  );
};
