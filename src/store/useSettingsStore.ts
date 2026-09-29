import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CaretStyle = "default" | "block" | "underline" | "outline";
export type SmoothCaretSpeed = "off" | "fast" | "medium" | "slow";
export type ConfidenceMode = "off" | "on" | "max";
export type StopOnError = "off" | "letter" | "word";
export type Theme = "nord" | "dracula" | "serika_dark" | "midnight";
export type FontFamily = "JetBrains Mono" | "Roboto Mono" | "Fira Code";
export type LiveStatsMode = "off" | "text" | "mini";
export type KeyboardLayout = "qwerty" | "dvorak" | "colemak";

export interface SettingsState {
  // Caret
  caretStyle: CaretStyle;
  smoothCaret: SmoothCaretSpeed;

  // Typing Behavior
  confidenceMode: ConfidenceMode;
  blindMode: boolean;
  stopOnError: StopOnError;

  // Visual & UI
  theme: Theme;
  fontFamily: FontFamily;
  fontSize: number; // 1.0 to 3.0 rem
  liveStats: LiveStatsMode;

  // Virtual Keyboard
  showKeyboard: boolean;
  keyboardLayout: KeyboardLayout;

  // Audio & TTS
  soundVolume: number;
  soundOnClick: boolean;
  soundOnError: boolean;
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
  setStopOnError: (stop: StopOnError) => void;
  setTheme: (theme: Theme) => void;
  setFontFamily: (font: FontFamily) => void;
  setFontSize: (size: number) => void;
  setLiveStats: (stats: LiveStatsMode) => void;
  setShowKeyboard: (show: boolean) => void;
  setKeyboardLayout: (layout: KeyboardLayout) => void;
  setSoundVolume: (volume: number) => void;
  setSoundOnClick: (val: boolean) => void;
  setSoundOnError: (val: boolean) => void;
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
  stopOnError: "letter" as StopOnError,
  theme: "midnight" as Theme,
  fontFamily: "JetBrains Mono" as FontFamily,
  fontSize: 1.75,
  liveStats: "text" as LiveStatsMode,
  showKeyboard: true,
  keyboardLayout: "qwerty" as KeyboardLayout,
  soundVolume: 0.6,
  soundOnClick: true,
  soundOnError: true,
  speechRate: 0.95,
  ttsVoiceURI: "",
  sessionSize: 15,
  activeCategory: "daily",
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      setCaretStyle: (caretStyle) => set({ caretStyle }),
      setSmoothCaret: (smoothCaret) => set({ smoothCaret }),
      setConfidenceMode: (confidenceMode) => set({ confidenceMode }),
      setBlindMode: (blindMode) => set({ blindMode }),
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
      setShowKeyboard: (showKeyboard) => set({ showKeyboard }),
      setKeyboardLayout: (keyboardLayout) => set({ keyboardLayout }),
      setSoundVolume: (soundVolume) => set({ soundVolume }),
      setSoundOnClick: (soundOnClick) => set({ soundOnClick }),
      setSoundOnError: (soundOnError) => set({ soundOnError }),
      setSpeechRate: (speechRate) => set({ speechRate }),
      setTtsVoiceURI: (ttsVoiceURI) => set({ ttsVoiceURI }),
      setSessionSize: (sessionSize) => set({ sessionSize }),
      setActiveCategory: (activeCategory) => set({ activeCategory }),
      resetToDefaults: () => {
        set(DEFAULT_SETTINGS);
        applyThemeCSS(DEFAULT_SETTINGS.theme);
      },
    }),
    {
      name: "keycaster_settings_v1",
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
  } else if (font === "Fira Code") {
    root.style.setProperty("--font-mono", "var(--font-fira), monospace");
  } else {
    root.style.setProperty("--font-mono", "var(--font-jetbrains), monospace");
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
