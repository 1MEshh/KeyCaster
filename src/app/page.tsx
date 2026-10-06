"use client";

import React, { useEffect, useState, useCallback } from "react";
import { TopNav } from "@/components/Navigation/TopNav";
import { TypingStage } from "@/components/TypingEngine/TypingStage";
import { SentenceStage } from "@/components/TypingEngine/SentenceStage";
import { TranslationStage } from "@/components/TypingEngine/TranslationStage";
import { GameModeStage } from "@/components/TypingEngine/GameModeStage";
import { AmbientCanvas } from "@/components/Backdrop/AmbientCanvas";
import { SettingsModal } from "@/components/Modals/SettingsModal";
import { CustomDeckModal } from "@/components/Modals/CustomDeckModal";
import { ProgressDashboard } from "@/components/Dashboard/ProgressDashboard";
import { OnboardingFlow } from "@/components/Onboarding/OnboardingFlow";
import { AudioUnlockOverlay } from "@/components/Onboarding/AudioUnlockOverlay";
import { XPToastBadge } from "@/components/HUD/XPToastBadge";
import { useSettingsStore, type AppSection } from "@/store/useSettingsStore";
import { useSessionStore } from "@/store/useSessionStore";
import { useSentenceStore } from "@/store/useSentenceStore";
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

  const {
    activeCategory,
    sessionSize,
    showKeyboard,
    setShowKeyboard,
    activeSection,
    setActiveSection,
  } = useSettingsStore();

  const {
    initSession,
    isSessionActive,
    isSessionComplete,
    currentWord,
    isLoading,
  } = useSessionStore();

  const {
    initSentenceSession,
    isSessionActive: isSentenceSessionActive,
    practiceType,
  } = useSentenceStore();

  const {
    mode: gameMode,
    isActive: isGameModeActive,
    startMode,
    exitToSRS,
  } = useGameModeStore();

  // Initialize DB and active Section on mount — only after audio is unlocked
  useEffect(() => {
    if (!audioUnlocked) return;

    const initialize = async () => {
      await seedDatabaseIfNeeded();

      // Check onboarding status
      const onboardingMeta = await db.meta.get("onboardingComplete");
      if (!onboardingMeta?.value) {
        setIsOnboardingOpen(true);
      } else {
        if (activeSection === "srs_words") {
          await initSession(activeCategory, sessionSize);
        } else if (activeSection === "sentences") {
          await initSentenceSession("sentences", activeCategory);
        } else if (activeSection === "arabic_dictation") {
          await initSentenceSession("translation", activeCategory);
        } else if (activeSection === "arcade") {
          if (gameMode === "srs") {
            startMode("time_attack");
          }
        }
      }

      setIsInitialized(true);
    };

    initialize();
  }, [
    audioUnlocked,
    activeCategory,
    sessionSize,
    activeSection,
    initSession,
    initSentenceSession,
    startMode,
    gameMode,
  ]);

  // Seamless section switcher action
  const handleSwitchSection = useCallback(
    async (section: AppSection) => {
      setActiveSection(section);

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
        if (!isGameModeActive || gameMode === "srs") {
          startMode("time_attack");
        }
      }
    },
    [
      setActiveSection,
      exitToSRS,
      initSession,
      activeCategory,
      sessionSize,
      initSentenceSession,
      isGameModeActive,
      gameMode,
      startMode,
    ]
  );

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      // AudioContext unlock on first keypress
      getAudioContext();

      // Ctrl+1 / Cmd+1 -> SRS Words
      if ((e.ctrlKey || e.metaKey) && e.key === "1") {
        e.preventDefault();
        handleSwitchSection("srs_words");
        return;
      }

      // Ctrl+2 / Cmd+2 -> Sentences
      if ((e.ctrlKey || e.metaKey) && e.key === "2") {
        e.preventDefault();
        handleSwitchSection("sentences");
        return;
      }

      // Ctrl+3 / Cmd+3 -> Arabic Dictation
      if ((e.ctrlKey || e.metaKey) && e.key === "3") {
        e.preventDefault();
        handleSwitchSection("arabic_dictation");
        return;
      }

      // Ctrl+4 / Cmd+4 -> Arcade
      if ((e.ctrlKey || e.metaKey) && e.key === "4") {
        e.preventDefault();
        handleSwitchSection("arcade");
        return;
      }

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

      // Ctrl+Enter -> New session when complete or reload
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (activeSection === "srs_words") {
          initSession(activeCategory, sessionSize);
        } else if (activeSection === "sentences") {
          initSentenceSession("sentences", activeCategory);
        } else if (activeSection === "arabic_dictation") {
          initSentenceSession("translation", activeCategory);
        }
        return;
      }
    };

    window.addEventListener("keydown", handleGlobalShortcuts);
    return () => window.removeEventListener("keydown", handleGlobalShortcuts);
  }, [
    showKeyboard,
    setShowKeyboard,
    activeSection,
    activeCategory,
    sessionSize,
    handleSwitchSection,
    initSession,
    initSentenceSession,
  ]);

  const handleStartCategoryFromDashboard = useCallback(
    async (category: string) => {
      if (activeSection === "srs_words") {
        await initSession(category, sessionSize);
      } else if (activeSection === "sentences") {
        await initSentenceSession("sentences", category);
      } else if (activeSection === "arabic_dictation") {
        await initSentenceSession("translation", category);
      }
    },
    [activeSection, sessionSize, initSession, initSentenceSession]
  );

  return (
    <div
      className="relative min-h-screen flex flex-col bg-bg text-text transition-colors duration-200 overflow-x-hidden"
      onClick={() => getAudioContext()}
    >
      {/* HTML5 Ambient Reactive Canvas Backdrop */}
      <AmbientCanvas />

      {/* Content Foreground Layer */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* iOS Safari Audio Unlock Overlay — only visible on iOS before session starts */}
        <AudioUnlockOverlay onUnlocked={() => setAudioUnlocked(true)} />

        {/* High-Density Linear/Raycast Navigation */}
        <TopNav
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenDashboard={() => setIsDashboardOpen(true)}
          onOpenCustomDeck={() => setIsCustomDeckOpen(true)}
          activeSection={activeSection}
          onSelectSection={handleSwitchSection}
        />

        {/* Main Stage Container */}
        <main className="flex-1 flex flex-col items-center justify-center max-w-5xl w-full mx-auto px-4 py-6">
          {activeSection === "arcade" ? (
            <GameModeStage />
          ) : activeSection === "sentences" ? (
            <SentenceStage />
          ) : activeSection === "arabic_dictation" ? (
            <TranslationStage />
          ) : !isInitialized || isLoading ? (
            <div className="flex flex-col items-center gap-3 font-mono text-xs text-sub">
              <div className="w-6 h-6 border-2 border-main border-t-transparent rounded-full animate-spin" />
              <span>Loading SRS deck...</span>
            </div>
          ) : isSessionActive && (currentWord || isSessionComplete) ? (
            <TypingStage />
          ) : (
            /* Empty / All Caught Up State */
            <div className="flex flex-col items-center justify-center text-center p-8 rounded-2xl border border-sub/20 bg-sub/5 backdrop-blur-sm max-w-md mx-auto font-mono space-y-4 animate-fadeIn">
              <div className="w-12 h-12 rounded-xl bg-main/15 text-main flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-bold text-text">All Caught Up!</h3>
              <p className="text-xs text-sub leading-relaxed">
                No words are currently due for review in this deck. Your spaced repetition schedule
                has been updated in IndexedDB.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                <button
                  onClick={() => initSession(activeCategory, sessionSize)}
                  className="px-4 py-2 rounded-lg bg-main text-bg text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm"
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

        {/* High-density Footer Keybindings */}
        <footer className="py-4 text-center text-[11px] font-mono text-sub/50 select-none">
          <span>KeyCaster 3.0 · local-first SM-2 acoustic typing · </span>
          <span className="opacity-75">
            <kbd className="px-1 bg-sub/10 rounded">Ctrl+1</kbd> Words ·{" "}
            <kbd className="px-1 bg-sub/10 rounded">Ctrl+2</kbd> Sentences ·{" "}
            <kbd className="px-1 bg-sub/10 rounded">Ctrl+3</kbd> Dictation ·{" "}
            <kbd className="px-1 bg-sub/10 rounded">Ctrl+4</kbd> Arcade ·{" "}
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
    </div>
  );
}
