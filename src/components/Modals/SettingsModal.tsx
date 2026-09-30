"use client";

import React, { useState, useEffect } from "react";
import { X, Volume2, RotateCcw, Sliders, Type, Keyboard, HardDrive, Sparkles } from "lucide-react";
import {
  useSettingsStore,
  THEME_VARIABLES,
  type Theme,
  type CaretStyle,
  type SmoothCaretSpeed,
  type ConfidenceMode,
  type StopOnError,
  type FontFamily,
  type LiveStatsMode,
  type KeyboardLayout,
} from "@/store/useSettingsStore";
import { playMechanicalClick, TTSController } from "@/lib/audio";
import { db } from "@/lib/db";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = "caret_typing" | "appearance" | "audio" | "keyboard" | "data";

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>("caret_typing");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const {
    caretStyle,
    setCaretStyle,
    smoothCaret,
    setSmoothCaret,
    confidenceMode,
    setConfidenceMode,
    blindMode,
    setBlindMode,
    stopOnError,
    setStopOnError,
    theme,
    setTheme,
    fontFamily,
    setFontFamily,
    fontSize,
    setFontSize,
    liveStats,
    setLiveStats,
    showKeyboard,
    setShowKeyboard,
    keyboardLayout,
    setKeyboardLayout,
    soundVolume,
    setSoundVolume,
    soundOnClick,
    setSoundOnClick,
    soundOnError,
    setSoundOnError,
    speechRate,
    setSpeechRate,
    ttsVoiceURI,
    setTtsVoiceURI,
    sessionSize,
    setSessionSize,
    resetToDefaults,
  } = useSettingsStore();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const loadVoices = () => {
        const v = TTSController.getVoices();
        setVoices(v);
      };
      loadVoices();
      if ("speechSynthesis" in window) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }, []);

  if (!isOpen) return null;

  const handleResetSRS = async () => {
    if (confirm("Are you sure you want to reset all SRS progress and review intervals?")) {
      await db.words.toCollection().modify({
        repetitions: 0,
        interval: 0,
        easeFactor: 2.5,
        totalMistakes: 0,
        totalReviews: 0,
        nextReviewDate: new Date().toISOString().split("T")[0],
      });
      alert("SRS progress reset successfully.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-bg border border-sub/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-sub/20 bg-bg">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-main" />
            <h2 className="text-lg font-mono font-bold text-text">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-sub hover:text-text hover:bg-sub/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-sub/20 bg-sub/5 px-6 overflow-x-auto gap-2">
          {[
            { id: "caret_typing", label: "Typing & Caret", icon: Type },
            { id: "appearance", label: "Appearance", icon: Sparkles },
            { id: "audio", label: "Audio & TTS", icon: Volume2 },
            { id: "keyboard", label: "Keyboard", icon: Keyboard },
            { id: "data", label: "Data & SRS", icon: HardDrive },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 py-3 px-3 text-xs font-mono border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? "border-main text-main font-semibold"
                    : "border-transparent text-sub hover:text-text"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm font-mono flex-1">
          {/* TAB 1: Caret & Typing */}
          {activeTab === "caret_typing" && (
            <div className="space-y-6">
              {/* Caret Style */}
              <div>
                <label className="text-xs uppercase text-sub font-semibold block mb-2">
                  Caret Style
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(["default", "block", "underline", "outline"] as CaretStyle[]).map((style) => (
                    <button
                      key={style}
                      onClick={() => setCaretStyle(style)}
                      className={`p-2.5 rounded-lg border text-xs capitalize transition-all ${
                        caretStyle === style
                          ? "border-main bg-main/10 text-main font-bold"
                          : "border-sub/20 text-sub hover:border-sub/50"
                      }`}
                    >
                      {style === "default" ? "Line (Default)" : style}
                    </button>
                  ))}
                </div>
              </div>

              {/* Smooth Caret */}
              <div>
                <label className="text-xs uppercase text-sub font-semibold block mb-2">
                  Smooth Caret Animation
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(["off", "fast", "medium", "slow"] as SmoothCaretSpeed[]).map((speed) => (
                    <button
                      key={speed}
                      onClick={() => setSmoothCaret(speed)}
                      className={`p-2 rounded-lg border text-xs capitalize transition-all ${
                        smoothCaret === speed
                          ? "border-main bg-main/10 text-main font-bold"
                          : "border-sub/20 text-sub hover:border-sub/50"
                      }`}
                    >
                      {speed}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stop on Error */}
              <div>
                <label className="text-xs uppercase text-sub font-semibold block mb-2">
                  Stop on Error
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "letter", label: "Letter (Strict)", desc: "Halts cursor progression" },
                    { id: "word", label: "Word", desc: "Must fix before next word" },
                    { id: "off", label: "Off", desc: "Allow typing past errors" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setStopOnError(item.id as StopOnError)}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        stopOnError === item.id
                          ? "border-main bg-main/10 text-main font-bold"
                          : "border-sub/20 text-sub hover:border-sub/50"
                      }`}
                    >
                      <div className="text-xs">{item.label}</div>
                      <div className="text-[10px] opacity-70 font-normal">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Confidence Mode */}
              <div>
                <label className="text-xs uppercase text-sub font-semibold block mb-2">
                  Confidence Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "off", label: "Off", desc: "Normal backspacing" },
                    { id: "on", label: "On", desc: "Cannot backspace past errors" },
                    { id: "max", label: "Max", desc: "Backspace disabled entirely" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setConfidenceMode(item.id as ConfidenceMode)}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        confidenceMode === item.id
                          ? "border-main bg-main/10 text-main font-bold"
                          : "border-sub/20 text-sub hover:border-sub/50"
                      }`}
                    >
                      <div className="text-xs">{item.label}</div>
                      <div className="text-[10px] opacity-70 font-normal">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Blind Mode */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-sub/20 bg-sub/5">
                <div>
                  <div className="text-xs font-semibold text-text">Blind Mode</div>
                  <div className="text-[11px] text-sub">
                    No letters shown on screen—pure auditory spelling practice.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={blindMode}
                  onChange={(e) => setBlindMode(e.target.checked)}
                  className="w-4 h-4 accent-main cursor-pointer"
                />
              </div>

              {/* Session Size */}
              <div>
                <label className="text-xs uppercase text-sub font-semibold block mb-2">
                  Session Size (Words per run)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 15, 25, 50].map((size) => (
                    <button
                      key={size}
                      onClick={() => setSessionSize(size)}
                      className={`p-2 rounded-lg border text-xs transition-all ${
                        sessionSize === size
                          ? "border-main bg-main/10 text-main font-bold"
                          : "border-sub/20 text-sub hover:border-sub/50"
                      }`}
                    >
                      {size} words
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Appearance & Themes */}
          {activeTab === "appearance" && (
            <div className="space-y-6">
              {/* Theme Selector */}
              <div>
                <label className="text-xs uppercase text-sub font-semibold block mb-2">
                  Theme Preset
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(["monochrome", "midnight", "nord", "dracula", "serika_dark"] as Theme[]).map((thm) => {
                    const colors = THEME_VARIABLES[thm];
                    const isCur = theme === thm;
                    return (
                      <button
                        key={thm}
                        onClick={() => setTheme(thm)}
                        className={`p-3 rounded-xl border flex items-center justify-between text-left transition-all ${
                          isCur
                            ? "border-main bg-main/10 ring-1 ring-main"
                            : "border-sub/30 bg-bg hover:border-sub/60"
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold capitalize text-text">
                            {thm === "monochrome" ? "Monochrome (B&W)" : thm.replace("_", " ")}
                          </div>
                          <div className="text-[10px] text-sub">Preset</div>
                        </div>

                        {/* Color Swatch Dots */}
                        <div className="flex items-center gap-1.5 p-1 rounded-full bg-black/20">
                          <span
                            className="w-3.5 h-3.5 rounded-full"
                            style={{ backgroundColor: colors.bg }}
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full"
                            style={{ backgroundColor: colors.main }}
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full"
                            style={{ backgroundColor: colors.sub }}
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full"
                            style={{ backgroundColor: colors.error }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Font Family */}
              <div>
                <label className="text-xs uppercase text-sub font-semibold block mb-2">
                  Font Family
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(["Thmanyah Sans", "JetBrains Mono", "Roboto Mono", "Fira Code"] as FontFamily[]).map((font) => (
                    <button
                      key={font}
                      onClick={() => setFontFamily(font)}
                      className={`p-2.5 rounded-lg border text-xs transition-all ${
                        fontFamily === font
                          ? "border-main bg-main/10 text-main font-bold"
                          : "border-sub/20 text-sub hover:border-sub/50"
                      }`}
                    >
                      {font === "Thmanyah Sans" ? "ثمانية (Default)" : font}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size Slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs uppercase text-sub font-semibold">Font Size</label>
                  <span className="text-xs text-main">{fontSize.toFixed(2)}rem</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="3.0"
                  step="0.1"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseFloat(e.target.value))}
                  className="w-full accent-main cursor-pointer"
                />
              </div>

              {/* Live Stats Mode */}
              <div>
                <label className="text-xs uppercase text-sub font-semibold block mb-2">
                  Live Stats HUD
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["text", "mini", "off"] as LiveStatsMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setLiveStats(mode)}
                      className={`p-2 rounded-lg border text-xs uppercase transition-all ${
                        liveStats === mode
                          ? "border-main bg-main/10 text-main font-bold"
                          : "border-sub/20 text-sub hover:border-sub/50"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Audio & TTS */}
          {activeTab === "audio" && (
            <div className="space-y-6">
              {/* Sound Volume Slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs uppercase text-sub font-semibold">Sound Volume</label>
                  <span className="text-xs text-main">{Math.round(soundVolume * 100)}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={soundVolume}
                    onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
                    className="w-full accent-main cursor-pointer"
                  />
                  <button
                    onClick={() => playMechanicalClick(soundVolume)}
                    className="px-2.5 py-1 text-xs rounded border border-main/40 text-main hover:bg-main/10 whitespace-nowrap"
                  >
                    Test Click
                  </button>
                </div>
              </div>

              {/* Speech Rate Slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs uppercase text-sub font-semibold">
                    TTS Speech Rate
                  </label>
                  <span className="text-xs text-main">{speechRate}x</span>
                </div>
                <input
                  type="range"
                  min="0.7"
                  max="1.3"
                  step="0.05"
                  value={speechRate}
                  onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                  className="w-full accent-main cursor-pointer"
                />
              </div>

              {/* TTS Voice Selector */}
              <div>
                <label className="text-xs uppercase text-sub font-semibold block mb-2">
                  Speech Synthesis Voice
                </label>
                <select
                  value={ttsVoiceURI}
                  onChange={(e) => setTtsVoiceURI(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-sub/30 bg-bg text-text text-xs focus:border-main focus:outline-none"
                >
                  <option value="">Default System English Voice</option>
                  {voices
                    .filter((v) => v.lang.startsWith("en"))
                    .map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                </select>
              </div>

              {/* SFX Toggles */}
              <div className="space-y-3 pt-2">
                <label className="flex items-center justify-between p-3 rounded-lg border border-sub/20 bg-sub/5 cursor-pointer">
                  <span className="text-xs text-text">Mechanical Keystroke Sound</span>
                  <input
                    type="checkbox"
                    checked={soundOnClick}
                    onChange={(e) => setSoundOnClick(e.target.checked)}
                    className="w-4 h-4 accent-main cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-lg border border-sub/20 bg-sub/5 cursor-pointer">
                  <span className="text-xs text-text">Error Thud Sound</span>
                  <input
                    type="checkbox"
                    checked={soundOnError}
                    onChange={(e) => setSoundOnError(e.target.checked)}
                    className="w-4 h-4 accent-main cursor-pointer"
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB 4: Keyboard */}
          {activeTab === "keyboard" && (
            <div className="space-y-6">
              <label className="flex items-center justify-between p-3 rounded-lg border border-sub/20 bg-sub/5 cursor-pointer">
                <div>
                  <div className="text-xs font-semibold text-text">Show Virtual Keyboard</div>
                  <div className="text-[11px] text-sub">
                    Renders an interactive keycap layout at the bottom
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={showKeyboard}
                  onChange={(e) => setShowKeyboard(e.target.checked)}
                  className="w-4 h-4 accent-main cursor-pointer"
                />
              </label>

              <div>
                <label className="text-xs uppercase text-sub font-semibold block mb-2">
                  Keyboard Layout
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["qwerty", "dvorak", "colemak"] as KeyboardLayout[]).map((layout) => (
                    <button
                      key={layout}
                      onClick={() => setKeyboardLayout(layout)}
                      className={`p-3 rounded-lg border text-xs uppercase font-bold transition-all ${
                        keyboardLayout === layout
                          ? "border-main bg-main/10 text-main"
                          : "border-sub/20 text-sub hover:border-sub/50"
                      }`}
                    >
                      {layout}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Data & SRS */}
          {activeTab === "data" && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl border border-sub/20 bg-sub/5 space-y-3">
                <div className="text-xs font-semibold text-text">Local-First Storage</div>
                <p className="text-xs text-sub leading-relaxed">
                  All progress, review dates, and custom decks are stored strictly on this device
                  inside browser IndexedDB (Dexie.js). No tracking or cloud backend.
                </p>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={handleResetSRS}
                    className="px-3 py-2 text-xs rounded-lg border border-error/50 text-error hover:bg-error/10 transition-colors"
                  >
                    Reset SRS Intervals
                  </button>
                  <button
                    onClick={resetToDefaults}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border border-sub/30 text-sub hover:text-text transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset Settings to Defaults
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-sub/20 bg-bg flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-mono font-bold rounded-lg bg-main text-bg hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
