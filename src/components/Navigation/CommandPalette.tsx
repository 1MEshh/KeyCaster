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
  Binary,
  Waves,
  Wind,
  Download,
  HardDrive,
  Timer,
  Flame,
  FileSpreadsheet,
} from "lucide-react";
import { useSettingsStore, type Theme, type AppSection, type AmbientBackdrop, type PaceCarMode } from "@/store/useSettingsStore";
import { useSessionStore } from "@/store/useSessionStore";
import { useSentenceStore } from "@/store/useSentenceStore";
import { useGameModeStore } from "@/store/useGameModeStore";
import { playMechanicalClick, type SwitchSoundProfile } from "@/lib/audio";
import { exportQuickBackupJson } from "@/lib/backupHealth";
import { downloadSessionHistoryCsv } from "@/lib/csvExporter";
import { getAllBilingualSentences } from "@/lib/sentenceDictionary";
import { db } from "@/lib/db";

interface CommandItem {
  id: string;
  category: "Navigation" | "Theme" | "Audio" | "Toggles" | "Actions" | "Dictionary";
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
    paceCarMode,
    setPaceCarMode,
    activeSection,
    setActiveSection,
    activeCategory,
    sessionSize,
    isZenMode,
    setIsZenMode,
  } = useSettingsStore();

  const { initSession, startTargetedPractice } = useSessionStore();
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
        id: "theme-matrix-crt",
        category: "Theme",
        title: "Theme: Matrix Phosphor Green (CRT)",
        subtitle: "Deep matrix obsidian with luminous phosphor green glow",
        icon: <Palette className="w-4 h-4 text-emerald-400" />,
        keywords: ["matrix", "crt", "green", "phosphor", "terminal", "theme"],
        active: theme === "matrix_crt",
        action: () => setTheme("matrix_crt"),
      },
      {
        id: "theme-tokyo-night",
        category: "Theme",
        title: "Theme: Tokyo Night Neon",
        subtitle: "Moody cyberpunk night sky with lavender and cyan accents",
        icon: <Palette className="w-4 h-4 text-indigo-400" />,
        keywords: ["tokyo night", "indigo", "lavender", "neon", "theme", "aesthetic"],
        active: theme === "tokyo_night",
        action: () => setTheme("tokyo_night"),
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
      {
        id: "audio-holy-panda",
        category: "Audio",
        title: "Switch: Holy Panda",
        subtitle: "Sharp tactile bump with crisp leaf snap",
        icon: <Volume2 className="w-4 h-4 text-orange-400" />,
        keywords: ["holy panda", "tactile", "switch", "snap", "mechanical"],
        active: switchSound === "holy_panda",
        action: () => {
          setSwitchSound("holy_panda");
          playMechanicalClick(soundVolume, "holy_panda");
        },
      },
      {
        id: "audio-cream-linear",
        category: "Audio",
        title: "Switch: Cream Linear",
        subtitle: "Silky smooth POM housing pop with low bottom-out resonance",
        icon: <Volume2 className="w-4 h-4 text-yellow-200" />,
        keywords: ["cream", "linear", "novelkeys", "silky", "switch", "smooth"],
        active: switchSound === "cream_linear",
        action: () => {
          setSwitchSound("cream_linear");
          playMechanicalClick(soundVolume, "cream_linear");
        },
      },
      {
        id: "audio-box-navy",
        category: "Audio",
        title: "Switch: Kailh Box Navy",
        subtitle: "Thick clickbar snap with heavy solid bottom-out clack",
        icon: <Volume2 className="w-4 h-4 text-blue-500" />,
        keywords: ["box navy", "clickbar", "kailh", "loud", "thick", "switch", "click"],
        active: switchSound === "box_navy",
        action: () => {
          setSwitchSound("box_navy");
          playMechanicalClick(soundVolume, "box_navy");
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
        id: "backdrop-kiroshi-netrunner",
        category: "Toggles",
        title: "Backdrop: Kiroshi Netrunner 3D (Cyberpunk 2077)",
        subtitle: "Authentic Night City 3D horizon, hex telemetry streams & ICE alerts",
        icon: <Zap className="w-4 h-4 text-[#fcee09]" />,
        keywords: ["backdrop", "cyberpunk", "kiroshi", "netrunner", "2077", "arasaka", "horizon", "grid"],
        active: ambientBackdrop === "kiroshi_netrunner",
        action: () => setAmbientBackdrop("kiroshi_netrunner"),
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
      {
        id: "backdrop-matrix",
        category: "Toggles",
        title: "Backdrop: Matrix Digital Rain",
        subtitle: "Cascading cyberpunk glyph streams with keystroke acceleration",
        icon: <Binary className="w-4 h-4 text-emerald-400" />,
        keywords: ["backdrop", "matrix", "rain", "cyber", "glyphs", "terminal"],
        active: ambientBackdrop === "matrix_rain",
        action: () => setAmbientBackdrop("matrix_rain"),
      },
      {
        id: "backdrop-sine",
        category: "Toggles",
        title: "Backdrop: Cyber Sine Wave Mesh",
        subtitle: "3D harmonic undulating ribbons with keystroke energy bloom",
        icon: <Waves className="w-4 h-4 text-cyan-400" />,
        keywords: ["backdrop", "sine wave", "mesh", "ribbon", "waves", "harmonic"],
        active: ambientBackdrop === "sine_wave",
        action: () => setAmbientBackdrop("sine_wave"),
      },
      {
        id: "backdrop-aurora",
        category: "Toggles",
        title: "Backdrop: Cyber Aurora Borealis",
        subtitle: "Luminous undulating chromatic waves with multi-harmonic energy drift",
        icon: <Wind className="w-4 h-4 text-emerald-400" />,
        keywords: ["backdrop", "aurora", "borealis", "northern lights", "chromatic", "waves"],
        active: ambientBackdrop === "aurora",
        action: () => setAmbientBackdrop("aurora"),
      },

      // Pace Car Ghost Caret
      {
        id: "pacecar-off",
        category: "Toggles",
        title: "Pace Car: Disabled",
        subtitle: "Turn off ghost cursor and speedrun split delta indicator",
        icon: <Timer className="w-4 h-4 text-sub" />,
        keywords: ["pace car", "ghost", "disabled", "off", "speedrun"],
        active: paceCarMode === "off",
        action: () => setPaceCarMode("off"),
      },
      {
        id: "pacecar-pb",
        category: "Toggles",
        title: "Pace Car: Personal Best (PB)",
        subtitle: "Race dynamically against your historical PB WPM",
        icon: <Timer className="w-4 h-4 text-amber-400" />,
        keywords: ["pace car", "ghost", "pb", "personal best", "speedrun"],
        active: paceCarMode === "pb",
        action: () => setPaceCarMode("pb"),
      },
      {
        id: "pacecar-60",
        category: "Toggles",
        title: "Pace Car: 60 WPM Target",
        subtitle: "Steady conversational touch-typing pace benchmark",
        icon: <Timer className="w-4 h-4 text-blue-400" />,
        keywords: ["pace car", "ghost", "60", "target", "wpm"],
        active: paceCarMode === "target_60",
        action: () => setPaceCarMode("target_60"),
      },
      {
        id: "pacecar-80",
        category: "Toggles",
        title: "Pace Car: 80 WPM Target",
        subtitle: "Professional high-speed rhythm benchmark",
        icon: <Timer className="w-4 h-4 text-emerald-400" />,
        keywords: ["pace car", "ghost", "80", "target", "wpm"],
        active: paceCarMode === "target_80",
        action: () => setPaceCarMode("target_80"),
      },
      {
        id: "pacecar-100",
        category: "Toggles",
        title: "Pace Car: 100 WPM Target",
        subtitle: "Advanced competitive typist pace benchmark",
        icon: <Timer className="w-4 h-4 text-purple-400" />,
        keywords: ["pace car", "ghost", "100", "target", "wpm"],
        active: paceCarMode === "target_100",
        action: () => setPaceCarMode("target_100"),
      },
      {
        id: "pacecar-120",
        category: "Toggles",
        title: "Pace Car: 120 WPM Target",
        subtitle: "Grandmaster burst velocity pace benchmark",
        icon: <Timer className="w-4 h-4 text-rose-400" />,
        keywords: ["pace car", "ghost", "120", "target", "wpm"],
        active: paceCarMode === "target_120",
        action: () => setPaceCarMode("target_120"),
      },

      // Actions & Modals
      {
        id: "action-hardest-drill",
        category: "Actions",
        title: "Practice Hardest Words Drill",
        subtitle: "Launch targeted review session for your most missed words",
        icon: <Flame className="w-4 h-4 text-amber-400" />,
        keywords: ["hardest words", "drill", "practice", "mistakes", "errors", "targeted"],
        action: async () => {
          try {
            const words = await db.words.where("totalMistakes").above(0).toArray();
            if (words.length > 0) {
              const sorted = words.sort((a, b) => b.totalMistakes - a.totalMistakes).slice(0, 10);
              startTargetedPractice(sorted);
              setActiveSection("srs_words");
              onClose();
            }
          } catch {
            // non-blocking
          }
        },
      },
      {
        id: "action-csv-export",
        category: "Actions",
        title: "Export Session History (CSV)",
        subtitle: "Download complete RFC 4180 CSV spreadsheet of past sessions",
        icon: <FileSpreadsheet className="w-4 h-4 text-emerald-400" />,
        keywords: ["csv", "export", "spreadsheet", "sessions", "history", "analytics"],
        action: async () => {
          try {
            const history = await db.sessionHistory.toArray();
            downloadSessionHistoryCsv(history);
            onClose();
          } catch {
            // non-blocking
          }
        },
      },
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
        id: "action-backup",
        category: "Actions",
        title: "Quick Backup Export (JSON)",
        subtitle: "Export timestamped JSON archive of words, custom decks, and SRS history",
        icon: <HardDrive className="w-4 h-4 text-emerald-400" />,
        keywords: ["backup", "export", "json", "save", "sync", "download"],
        action: () => {
          exportQuickBackupJson();
        },
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
    const raw = query.trim();
    const isLookup = raw.toLowerCase().startsWith("lookup:");
    const searchTerm = isLookup ? raw.slice(7).trim().toLowerCase() : raw.toLowerCase();

    const matchedCommands = commands.filter((cmd) => {
      return (
        cmd.title.toLowerCase().includes(searchTerm) ||
        (cmd.subtitle && cmd.subtitle.toLowerCase().includes(searchTerm)) ||
        cmd.category.toLowerCase().includes(searchTerm) ||
        cmd.keywords.some((k) => k.toLowerCase().includes(searchTerm))
      );
    });

    // If query is at least 2 characters, search bilingual sentence vocabulary cards
    if (searchTerm.length >= 2) {
      const allSentences = getAllBilingualSentences();
      const seenCards = new Set<string>();
      const vocabMatches: CommandItem[] = [];

      for (const sentence of allSentences) {
        if (!sentence.vocabularyCards) continue;
        for (const card of sentence.vocabularyCards) {
          const key = `${card.en.toLowerCase()}-${card.ar}`;
          if (seenCards.has(key)) continue;

          if (
            card.en.toLowerCase().includes(searchTerm) ||
            card.ar.includes(searchTerm) ||
            sentence.english.toLowerCase().includes(searchTerm) ||
            sentence.arabic.includes(searchTerm)
          ) {
            seenCards.add(key);
            vocabMatches.push({
              id: `dict-${key}`,
              category: "Dictionary",
              title: `${card.en} ↔ ${card.ar}`,
              subtitle: `Example: "${sentence.english}" (${sentence.arabic})`,
              icon: <BookOpen className="w-4 h-4 text-emerald-400" />,
              keywords: ["dictionary", "lookup", "vocab", card.en.toLowerCase(), card.ar],
              action: () => {
                setActiveSection("arabic_dictation");
                initSentenceSession("translation", sentence.category);
              },
            });
          }
          if (vocabMatches.length >= 8) break;
        }
        if (vocabMatches.length >= 8) break;
      }

      if (isLookup) {
        return vocabMatches;
      }
      return [...matchedCommands, ...vocabMatches];
    }

    return matchedCommands;
  }, [commands, query, setActiveSection, initSentenceSession]);

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
