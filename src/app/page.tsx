"use client";

import React, { useEffect, useState, useCallback } from "react";
import { TopNav } from "@/components/Navigation/TopNav";
import { TypingStage } from "@/components/TypingEngine/TypingStage";
import { GameModeStage } from "@/components/TypingEngine/GameModeStage";
import { SettingsModal } from "@/components/Modals/SettingsModal";
import { CustomDeckModal } from "@/components/Modals/CustomDeckModal";
import { ProgressDashboard } from "@/components/Dashboard/ProgressDashboard";
import { OnboardingFlow } from "@/components/Onboarding/OnboardingFlow";
import { AudioUnlockOverlay } from "@/components/Onboarding/AudioUnlockOverlay";
import { XPToastBadge } from "@/components/HUD/XPToastBadge";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useSessionStore } from "@/store/useSessionStore";
import { useGameModeStore } from "@/store/useGameModeStore";
import { seedDatabaseIfNeeded, db } from "@/lib/db";
import { getAudioContext } from "@/lib/audio";
import { Sparkles, RotateCcw } from "lucide-react";

export default function Home() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isCustomDeckOpen, setIsCustomDeckOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  const { activeCategory, sessionSize, showKeyboard, setShowKeyboard } = useSettingsStore();
  const {
    initSession,
    isSessionActive,
    isSessionComplete,
    currentWord,
    mainQueue,
    isLoading,
  } = useSessionStore();
  const { mode: gameMode, isActive: isGameModeActive } = useGameModeStore();

  // Initialize DB and Session on mount — only after audio is unlocked
  useEffect(() => {
    if (!audioUnlocked) return;

    const initialize = async () => {
      await seedDatabaseIfNeeded();

      // Check onboarding status
      const onboardingMeta = await db.meta.get("onboardingComplete");
      if (!onboardingMeta?.value) {
        setIsOnboardingOpen(true);
      } else {
        await initSession(activeCategory, sessionSize);
      }

      setIsInitialized(true);
    };

    initialize();
  }, [audioUnlocked, activeCategory, sessionSize, initSession]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      // AudioContext unlock on first keypress
      getAudioContext();

      // Ctrl+, -> Settings
      if ((e.ctrlKey || e.metaKey) && e.key === ",") {
        e.preventDefault();
        setIsSettingsOpen((prev) => !prev);
        return;
      }

      // Ctrl+D -> Dashboard
      if ((e.ctrlKey || e.metaKey) && (e.key === "d" || e.key === "D")) {
        e.preventDefault();
        setIsDashboardOpen((prev) => !prev);
        return;
      }

      // Ctrl+K -> Toggle Virtual Keyboard
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setShowKeyboard(!showKeyboard);
        return;
      }

      // Ctrl+Enter -> New session when complete
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        initSession(activeCategory, sessionSize);
        return;
      }
    };

    window.addEventListener("keydown", handleGlobalShortcuts);
    return () => window.removeEventListener("keydown", handleGlobalShortcuts);
  }, [showKeyboard, setShowKeyboard, activeCategory, sessionSize, initSession]);

  const handleStartCategoryFromDashboard = useCallback(
    async (category: string) => {
      await initSession(category, sessionSize);
    },
    [sessionSize, initSession]
  );

  return (
    <div
      className="flex flex-col min-h-screen bg-bg text-text transition-colors duration-200"
      onClick={() => getAudioContext()}
    >
      {/* iOS Safari Audio Unlock Overlay — only visible on iOS before session starts */}
      <AudioUnlockOverlay onUnlocked={() => setAudioUnlocked(true)} />

      {/* Top Navigation */}
      <TopNav
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenDashboard={() => setIsDashboardOpen(true)}
        onOpenCustomDeck={() => setIsCustomDeckOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-5xl w-full mx-auto px-4 py-8">
        {isGameModeActive && gameMode !== "srs" ? (
          <GameModeStage />
        ) : !isInitialized || isLoading ? (
          <div className="flex flex-col items-center gap-3 font-mono text-xs text-sub">
            <div className="w-6 h-6 border-2 border-main border-t-transparent rounded-full animate-spin" />
            <span>Loading SRS deck...</span>
          </div>
        ) : isSessionActive && (currentWord || isSessionComplete) ? (
          <TypingStage />
        ) : (
          /* Empty / All Caught Up State */
          <div className="flex flex-col items-center justify-center text-center p-8 rounded-2xl border border-sub/20 bg-sub/5 max-w-md mx-auto font-mono space-y-4">
            <div className="w-12 h-12 rounded-xl bg-main/15 text-main flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-text">All Caught Up!</h3>
            <p className="text-xs text-sub leading-relaxed">
              No words are currently due for review in this deck. Your spaced repetition schedule has
              been updated in IndexedDB.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <button
                onClick={() => initSession(activeCategory, sessionSize)}
                className="px-4 py-2 rounded-lg bg-main text-bg text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Practice Ahead</span>
              </button>
              <button
                onClick={() => setIsDashboardOpen(true)}
                className="px-4 py-2 rounded-lg border border-sub/30 text-sub hover:text-text text-xs transition-colors"
              >
                <span>View Schedule</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer Keybindings */}
      <footer className="py-4 text-center text-[11px] font-mono text-sub/50 select-none">
        <span>KeyCaster · local-first SM-2 spelling client · </span>
        <span className="opacity-70">
          <kbd className="px-1 bg-sub/10 rounded">Ctrl+,</kbd> Settings ·{" "}
          <kbd className="px-1 bg-sub/10 rounded">Ctrl+D</kbd> Dashboard ·{" "}
          <kbd className="px-1 bg-sub/10 rounded">Ctrl+K</kbd> Keyboard
        </span>
      </footer>

      {/* Modals Layer */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      <CustomDeckModal
        isOpen={isCustomDeckOpen}
        onClose={() => setIsCustomDeckOpen(false)}
      />

      <ProgressDashboard
        isOpen={isDashboardOpen}
        onClose={() => setIsDashboardOpen(false)}
        onStartCategory={handleStartCategoryFromDashboard}
      />

      <OnboardingFlow
        isOpen={isOnboardingOpen}
        onComplete={() => setIsOnboardingOpen(false)}
      />

      {/* Gamification Floating Toasts */}
      <XPToastBadge />
    </div>
  );
}
