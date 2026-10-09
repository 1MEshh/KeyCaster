import { create } from "zustand";
import { persist } from "zustand/middleware";

import { type SwitchSoundProfile } from "@/lib/audio";

export type CaretStyle = "default" | "block" | "underline" | "outline";
export type SmoothCaretSpeed = "off" | "fast" | "medium" | "slow";
export type ConfidenceMode = "off" | "on" | "max";
export type StopOnError = "off" | "letter" | "word";
export type Theme = "monochrome" | "nord" | "dracula" | "serika_dark" | "midnight" | "cyberpunk";
export type FontFamily = "Thmanyah Sans" | "JetBrains Mono" | "Roboto Mono" | "Fira Code";
export type LiveStatsMode = "off" | "text" | "mini" | "tachometer";
export type KeyboardLayout = "qwerty" | "dvorak" | "colemak";
export type AmbientBackdrop = "cyber_grid" | "constellation" | "grid" | "particles" | "off";
export type AppSection = "srs_words" | "sentences" | "arabic_dictation" | "arcade";

export interface SettingsState {
  // Caret
  caretStyle: CaretStyle;
  smoothCaret: SmoothCaretSpeed;

  // Typing Behavior
  confidenceMode: ConfidenceMode;
  blindMode: boolean;
  blindModePro: boolean;
  phraseMode: boolean;
  stopOnError: StopOnError;

  // Visual & UI
  theme: Theme;
  fontFamily: FontFamily;
  fontSize: number; // 1.0 to 3.0 rem
  liveStats: LiveStatsMode;
  ambientBackdrop: AmbientBackdrop;
  activeSection: AppSection;
  customCursor: boolean;

  // Virtual Keyboard
  showKeyboard: boolean;
  keyboardLayout: KeyboardLayout;

  // Audio & TTS
  soundVolume: number;
  soundOnClick: boolean;
  soundOnError: boolean;
  switchSound: SwitchSoundProfile;
  speechRate: number;
  ttsVoiceURI: string;

  // Session
  sessionSize: number;
  activeCategory: string;

  // Actions
  setCaretStyle: (style: CaretStyle) => void;
  setSmoothCaret: (speed: SmoothCaretSpeed) => void;
  setConfidenceMode: (mode: ConfidenceMode) => void;
  setBlindMode: (blind: boolean) => void;
  setBlindModePro: (pro: boolean) => void;
  setPhraseMode: (phraseMode: boolean) => void;
  setStopOnError: (stop: StopOnError) => void;
  setTheme: (theme: Theme) => void;
  setFontFamily: (font: FontFamily) => void;
  setFontSize: (size: number) => void;
  setLiveStats: (stats: LiveStatsMode) => void;
  setAmbientBackdrop: (style: AmbientBackdrop) => void;
  setActiveSection: (section: AppSection) => void;
  setCustomCursor: (enabled: boolean) => void;
  setShowKeyboard: (show: boolean) => void;
  setKeyboardLayout: (layout: KeyboardLayout) => void;
  setSoundVolume: (volume: number) => void;
  setSoundOnClick: (val: boolean) => void;
  setSoundOnError: (val: boolean) => void;
  setSwitchSound: (profile: SwitchSoundProfile) => void;
  setSpeechRate: (rate: number) => void;
  setTtsVoiceURI: (uri: string) => void;
  setSessionSize: (size: number) => void;
  setActiveCategory: (cat: string) => void;
  resetToDefaults: () => void;
}

export const THEME_VARIABLES: Record<
  Theme,
  {
    bg: string;
    main: string;
    caret: string;
    sub: string;
    text: string;
    error: string;
    errorExtra: string;
  }
> = {
  cyberpunk: {
    bg: "#05050a",
    main: "#00f0ff",
    caret: "#ffe600",
    sub: "#64748b",
    text: "#f8fafc",
    error: "#ff0055",
    errorExtra: "#990033",
  },
  monochrome: {
    bg: "#09090b",
    main: "#ffffff",
    caret: "#ffffff",
    sub: "#71717a",
    text: "#f4f4f5",
    error: "#ef4444",
    errorExtra: "#7f1d1d",
  },
  nord: {
    bg: "#2e3440",
    main: "#88c0d0",
    caret: "#88c0d0",
    sub: "#4c566a",
    text: "#eceff4",
    error: "#bf616a",
    errorExtra: "#d08770",
  },
  dracula: {
    bg: "#282a36",
    main: "#bd93f9",
    caret: "#ff79c6",
    sub: "#6272a4",
    text: "#f8f8f2",
    error: "#ff5555",
    errorExtra: "#ffb86c",
  },
  serika_dark: {
    bg: "#323437",
    main: "#e2b714",
    caret: "#e2b714",
    sub: "#646669",
    text: "#d1d0c5",
    error: "#ca4754",
    errorExtra: "#7e2a33",
  },
  midnight: {
    bg: "#0f172a",
    main: "#38bdf8",
    caret: "#38bdf8",
    sub: "#475569",
    text: "#f1f5f9",
    error: "#f43f5e",
    errorExtra: "#fb7185",
  },
};

export const SMOOTH_CARET_DURATIONS: Record<SmoothCaretSpeed, string> = {
  off: "0ms",
  fast: "70ms",
  medium: "130ms",
  slow: "200ms",
};

const DEFAULT_SETTINGS = {
  caretStyle: "default" as CaretStyle,
  smoothCaret: "medium" as SmoothCaretSpeed,
  confidenceMode: "off" as ConfidenceMode,
  blindMode: true,
  blindModePro: false,
  phraseMode: false,
  stopOnError: "letter" as StopOnError,
  theme: "midnight" as Theme,
  fontFamily: "Thmanyah Sans" as FontFamily,
  fontSize: 1.75,
  liveStats: "text" as LiveStatsMode,
  showKeyboard: true,
  keyboardLayout: "qwerty" as KeyboardLayout,
  soundVolume: 0.6,
  soundOnClick: true,
  soundOnError: true,
  switchSound: "cherry_brown" as SwitchSoundProfile,
  speechRate: 0.95,
  ttsVoiceURI: "",
  sessionSize: 15,
  activeCategory: "daily",
  ambientBackdrop: "constellation" as AmbientBackdrop,
  activeSection: "srs_words" as AppSection,
  customCursor: true,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      setCaretStyle: (caretStyle) => set({ caretStyle }),
      setSmoothCaret: (smoothCaret) => set({ smoothCaret }),
      setConfidenceMode: (confidenceMode) => set({ confidenceMode }),
      setBlindMode: (blindMode) => set({ blindMode }),
      setBlindModePro: (blindModePro) => set({ blindModePro }),
      setPhraseMode: (phraseMode) => set({ phraseMode }),
      setStopOnError: (stopOnError) => set({ stopOnError }),
      setTheme: (theme) => {
        set({ theme });
        applyThemeCSS(theme);
      },
      setFontFamily: (fontFamily) => {
        set({ fontFamily });
        applyFontCSS(fontFamily);
      },
      setFontSize: (fontSize) => set({ fontSize }),
      setLiveStats: (liveStats) => set({ liveStats }),
      setAmbientBackdrop: (ambientBackdrop) => set({ ambientBackdrop }),
      setActiveSection: (activeSection) => set({ activeSection }),
      setCustomCursor: (customCursor) => set({ customCursor }),
      setShowKeyboard: (showKeyboard) => set({ showKeyboard }),
      setKeyboardLayout: (keyboardLayout) => set({ keyboardLayout }),
      setSoundVolume: (soundVolume) => set({ soundVolume }),
      setSoundOnClick: (soundOnClick) => set({ soundOnClick }),
      setSoundOnError: (soundOnError) => set({ soundOnError }),
      setSwitchSound: (switchSound) => set({ switchSound }),
      setSpeechRate: (speechRate) => set({ speechRate }),
      setTtsVoiceURI: (ttsVoiceURI) => set({ ttsVoiceURI }),
      setSessionSize: (sessionSize) => set({ sessionSize }),
      setActiveCategory: (activeCategory) => set({ activeCategory }),
      resetToDefaults: () => {
        set(DEFAULT_SETTINGS);
        applyThemeCSS(DEFAULT_SETTINGS.theme);
        applyFontCSS(DEFAULT_SETTINGS.fontFamily);
      },
    }),
    {
      name: "keycaster_settings_v4",
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyThemeCSS(state.theme);
          applyFontCSS(state.fontFamily);
        }
      },
    }
  )
);

export function applyFontCSS(font: FontFamily): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (font === "Roboto Mono") {
    root.style.setProperty("--font-mono", "var(--font-roboto), monospace");
    document.body.style.fontFamily = "var(--font-roboto), monospace";
  } else if (font === "Fira Code") {
    root.style.setProperty("--font-mono", "var(--font-fira), monospace");
    document.body.style.fontFamily = "var(--font-fira), monospace";
  } else if (font === "JetBrains Mono") {
    root.style.setProperty("--font-mono", "var(--font-jetbrains), monospace");
    document.body.style.fontFamily = "var(--font-jetbrains), monospace";
  } else {
    root.style.setProperty("--font-mono", "var(--font-thmanyah)");
    document.body.style.fontFamily = "var(--font-thmanyah)";
  }
}

export function applyThemeCSS(theme: Theme): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const colors = THEME_VARIABLES[theme] || THEME_VARIABLES.serika_dark;

  root.style.setProperty("--bg", colors.bg);
  root.style.setProperty("--main", colors.main);
  root.style.setProperty("--caret", colors.caret);
  root.style.setProperty("--sub", colors.sub);
  root.style.setProperty("--text", colors.text);
  root.style.setProperty("--error", colors.error);
  root.style.setProperty("--error-extra", colors.errorExtra);
}
