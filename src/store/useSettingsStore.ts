import { create } from "zustand";
import { persist } from "zustand/middleware";

import { type SwitchSoundProfile } from "@/lib/audio";

export type CaretStyle = "default" | "block" | "underline" | "outline";
export type CaretBlinkRate = "smooth" | "rapid" | "off";
export type SmoothCaretSpeed = "off" | "fast" | "medium" | "slow";
export type ConfidenceMode = "off" | "on" | "max";
export type StopOnError = "off" | "letter" | "word";
export type Theme =
  | "monochrome"
  | "nord"
  | "dracula"
  | "serika_dark"
  | "midnight"
  | "cyberpunk"
  | "matrix_crt"
  | "tokyo_night";
export type FontFamily = "Thmanyah Sans" | "JetBrains Mono" | "Roboto Mono" | "Fira Code";
export type LiveStatsMode = "off" | "text" | "mini" | "tachometer";
export type PaceCarMode = "off" | "pb" | "target_60" | "target_80" | "target_100" | "target_120";
export type KeyboardLayout = "qwerty" | "dvorak" | "colemak" | "workman" | "colemak_dh";
export type AmbientBackdrop =
  | "kiroshi_netrunner"
  | "cyber_grid"
  | "constellation"
  | "grid"
  | "particles"
  | "matrix_rain"
  | "sine_wave"
  | "aurora"
  | "off";
export type AppSection = "srs_words" | "sentences" | "arabic_dictation" | "arcade";

export interface SettingsState {
  // Caret
  caretStyle: CaretStyle;
  caretBlinkRate: CaretBlinkRate;
  smoothCaret: SmoothCaretSpeed;
  caretSparks: boolean;

  // Typing Behavior
  confidenceMode: ConfidenceMode;
  blindMode: boolean;
  blindModePro: boolean;
  phraseMode: boolean;
  stopOnError: StopOnError;
  paceCarMode: PaceCarMode;
  minWpmGate: number; // 0 = off, 30, 50, 70, 90 WPM threshold alert

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
  speechPitch: number;
  autoReplayOnError: boolean;
  ttsVoiceURI: string;

  // Session
  sessionSize: number;
  activeCategory: string;

  // Zen Flow State Mode
  isZenMode: boolean;

  // Actions
  setCaretStyle: (style: CaretStyle) => void;
  setCaretBlinkRate: (rate: CaretBlinkRate) => void;
  setSmoothCaret: (speed: SmoothCaretSpeed) => void;
  setCaretSparks: (enabled: boolean) => void;
  setConfidenceMode: (mode: ConfidenceMode) => void;
  setBlindMode: (blind: boolean) => void;
  setBlindModePro: (pro: boolean) => void;
  setPhraseMode: (phraseMode: boolean) => void;
  setStopOnError: (stop: StopOnError) => void;
  setPaceCarMode: (paceCarMode: PaceCarMode) => void;
  cyclePaceCarMode: () => void;
  setMinWpmGate: (gate: number) => void;
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
  previousSoundVolume?: number;
  toggleMute: () => void;
  setSoundOnClick: (val: boolean) => void;
  setSoundOnError: (val: boolean) => void;
  setSwitchSound: (profile: SwitchSoundProfile) => void;
  setSpeechRate: (rate: number) => void;
  cycleSpeechRate: () => void;
  setSpeechPitch: (pitch: number) => void;
  setAutoReplayOnError: (enabled: boolean) => void;
  setTtsVoiceURI: (uri: string) => void;
  setSessionSize: (size: number) => void;
  setActiveCategory: (cat: string) => void;
  setIsZenMode: (isZenMode: boolean) => void;
  toggleZenMode: () => void;
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
    bg: "#08080c",
    main: "#fcee09",
    caret: "#00f0ff",
    sub: "#5a6878",
    text: "#f6f7fb",
    error: "#ff003c",
    errorExtra: "#990025",
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
  matrix_crt: {
    bg: "#020902",
    main: "#00ff66",
    caret: "#00ff66",
    sub: "#163b1a",
    text: "#a3f7bf",
    error: "#ff3366",
    errorExtra: "#990022",
  },
  tokyo_night: {
    bg: "#1a1b26",
    main: "#7aa2f7",
    caret: "#bb9af7",
    sub: "#565f89",
    text: "#c0caf5",
    error: "#f7768e",
    errorExtra: "#db4b4b",
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
  caretBlinkRate: "smooth" as CaretBlinkRate,
  smoothCaret: "medium" as SmoothCaretSpeed,
  caretSparks: true,
  confidenceMode: "off" as ConfidenceMode,
  blindMode: true,
  blindModePro: false,
  phraseMode: false,
  stopOnError: "letter" as StopOnError,
  paceCarMode: "off" as PaceCarMode,
  minWpmGate: 0,
  theme: "midnight" as Theme,
  fontFamily: "Thmanyah Sans" as FontFamily,
  fontSize: 1.75,
  liveStats: "text" as LiveStatsMode,
  showKeyboard: true,
  keyboardLayout: "qwerty" as KeyboardLayout,
  soundVolume: 0.6,
  previousSoundVolume: 0.6,
  soundOnClick: true,
  soundOnError: true,
  switchSound: "cherry_brown" as SwitchSoundProfile,
  speechRate: 0.95,
  speechPitch: 1.0,
  autoReplayOnError: false,
  ttsVoiceURI: "",
  sessionSize: 15,
  activeCategory: "daily",
  ambientBackdrop: "constellation" as AmbientBackdrop,
  activeSection: "srs_words" as AppSection,
  customCursor: true,
  isZenMode: false,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      setCaretStyle: (caretStyle) => set({ caretStyle }),
      setCaretBlinkRate: (caretBlinkRate) => set({ caretBlinkRate }),
      setSmoothCaret: (smoothCaret) => set({ smoothCaret }),
      setCaretSparks: (caretSparks) => set({ caretSparks }),
      setConfidenceMode: (confidenceMode) => set({ confidenceMode }),
      setBlindMode: (blindMode) => set({ blindMode }),
      setBlindModePro: (blindModePro) => set({ blindModePro }),
      setPhraseMode: (phraseMode) => set({ phraseMode }),
      setStopOnError: (stopOnError) => set({ stopOnError }),
      setPaceCarMode: (paceCarMode) => set({ paceCarMode }),
      setMinWpmGate: (minWpmGate) => set({ minWpmGate }),
      cyclePaceCarMode: () => {
        const modes: PaceCarMode[] = ["off", "pb", "target_60", "target_80", "target_100", "target_120"];
        set((state) => {
          const nextIdx = (modes.indexOf(state.paceCarMode) + 1) % modes.length;
          return { paceCarMode: modes[nextIdx] };
        });
      },
      setTheme: (theme) => {
        if (theme === "cyberpunk") {
          set((state) => ({
            theme,
            ambientBackdrop: state.ambientBackdrop === "off" ? "off" : "kiroshi_netrunner",
          }));
        } else {
          set({ theme });
        }
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
      setSoundVolume: (soundVolume) =>
        set((state) => ({
          soundVolume,
          previousSoundVolume: soundVolume > 0 ? soundVolume : state.previousSoundVolume ?? 0.6,
        })),
      toggleMute: () =>
        set((state) => {
          if (state.soundVolume > 0) {
            return {
              previousSoundVolume: state.soundVolume,
              soundVolume: 0,
            };
          }
          const restored = state.previousSoundVolume && state.previousSoundVolume > 0
            ? state.previousSoundVolume
            : 0.6;
          return { soundVolume: restored };
        }),
      setSoundOnClick: (soundOnClick) => set({ soundOnClick }),
      setSoundOnError: (soundOnError) => set({ soundOnError }),
      setSwitchSound: (switchSound) => set({ switchSound }),
      setSpeechRate: (speechRate) => set({ speechRate }),
      cycleSpeechRate: () =>
        set((state) => {
          const rates = [0.8, 0.95, 1.1, 1.25];
          const currentIndex = rates.findIndex((r) => Math.abs(r - state.speechRate) < 0.05);
          const nextIndex = (currentIndex + 1) % rates.length;
          return { speechRate: rates[nextIndex] };
        }),
      setSpeechPitch: (speechPitch) => set({ speechPitch }),
      setAutoReplayOnError: (autoReplayOnError) => set({ autoReplayOnError }),
      setTtsVoiceURI: (ttsVoiceURI) => set({ ttsVoiceURI }),
      setSessionSize: (sessionSize) => set({ sessionSize }),
      setActiveCategory: (activeCategory) => set({ activeCategory }),
      setIsZenMode: (isZenMode) => set({ isZenMode }),
      toggleZenMode: () => set((state) => ({ isZenMode: !state.isZenMode })),
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

  root.setAttribute("data-theme", theme);
  root.style.setProperty("--bg", colors.bg);
  root.style.setProperty("--main", colors.main);
  root.style.setProperty("--caret", colors.caret);
  root.style.setProperty("--sub", colors.sub);
  root.style.setProperty("--text", colors.text);
  root.style.setProperty("--error", colors.error);
  root.style.setProperty("--error-extra", colors.errorExtra);
}
