"use client";

import React, { useState } from "react";
import { Headphones, Volume2, Sparkles, Check, ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { playMechanicalClick, TTSController } from "@/lib/audio";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useSessionStore } from "@/store/useSessionStore";

interface OnboardingFlowProps {
  isOpen: boolean;
  onComplete: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ isOpen, onComplete }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedCategory, setSelectedCategory] = useState<string>("daily");
  const [testedAudio, setTestedAudio] = useState(false);

  const { setActiveCategory, sessionSize } = useSettingsStore();
  const initSession = useSessionStore((s) => s.initSession);

  if (!isOpen) return null;

  const testAudio = () => {
    playMechanicalClick(0.6);
    TTSController.speakWord("welcome", { rate: 0.95 });
    setTestedAudio(true);
  };

  const handleFinish = async () => {
    await db.meta.put({ key: "onboardingComplete", value: true });
    setActiveCategory(selectedCategory);
    await initSession(selectedCategory, sessionSize);
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-bg border border-sub/30 rounded-2xl shadow-2xl p-6 sm:p-8 font-mono text-center flex flex-col items-center">
        {/* Step indicator */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s === step ? "w-8 bg-main" : s < step ? "w-4 bg-sub/60" : "w-4 bg-sub/20"
              }`}
            />
          ))}
        </div>

        {/* STEP 1: Welcome */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-main/15 text-main mx-auto flex items-center justify-center">
              <Headphones className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-text">Welcome to KeyCaster</h2>
            <p className="text-xs text-sub leading-relaxed max-w-sm mx-auto">
              An audio-first, zero-latency spelling practice client powered by the SuperMemo-2 (SM-2)
              spaced repetition algorithm.
            </p>
            <p className="text-[11px] text-sub/70 italic">
              Hear the word spoken aloud, then type it from memory without looking at visual clues.
            </p>
            <div className="pt-4">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2.5 rounded-xl bg-main text-bg text-xs font-bold hover:opacity-90 transition-opacity inline-flex items-center gap-2"
              >
                <span>Choose Deck</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Choose Deck */}
        {step === 2 && (
          <div className="space-y-4 w-full">
            <h2 className="text-lg font-bold text-text">Select Starter Deck</h2>
            <p className="text-xs text-sub">Pick the word category you want to begin practicing:</p>

            <div className="grid grid-cols-1 gap-2.5 text-left w-full pt-2">
              {[
                {
                  id: "daily",
                  title: "Daily",
                  desc: "500 focus words, adverbs, time expressions, and discourse phrases",
                },
                {
                  id: "common_misspellings",
                  title: "Common Misspellings",
                  desc: "Frequently misspelled words and tricky English spelling demons",
                },
                {
                  id: "gaming",
                  title: "Gaming",
                  desc: "Tactical gaming, esports, and competitive vocabulary (flank, defuse...)",
                },
              ].map((deck) => (
                <button
                  key={deck.id}
                  onClick={() => setSelectedCategory(deck.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedCategory === deck.id
                      ? "border-main bg-main/10 ring-1 ring-main"
                      : "border-sub/20 bg-sub/5 hover:border-sub/50"
                  }`}
                >
                  <div className="text-xs font-bold text-text">{deck.title}</div>
                  <div className="text-[10px] text-sub mt-0.5">{deck.desc}</div>
                </button>
              ))}
            </div>

            <div className="flex justify-between w-full pt-4">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 text-xs text-sub hover:text-text"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-6 py-2.5 rounded-xl bg-main text-bg text-xs font-bold hover:opacity-90 inline-flex items-center gap-2"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Audio Check */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-main/15 text-main mx-auto flex items-center justify-center">
              <Volume2 className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-text">Audio Soundcheck</h2>
            <p className="text-xs text-sub max-w-sm mx-auto">
              Click below to test your browser&apos;s Web Audio synthesizer and speech pronunciation:
            </p>

            <div className="pt-2">
              <button
                onClick={testAudio}
                className="px-5 py-3 rounded-xl border border-main text-main bg-main/10 hover:bg-main/20 text-xs font-bold transition-colors inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Play Sound & Pronounce &quot;Welcome&quot;</span>
              </button>
            </div>

            {testedAudio && (
              <p className="text-xs text-main font-semibold flex items-center justify-center gap-1">
                <Check className="w-4 h-4" />
                <span>Audio verified! You&apos;re ready.</span>
              </p>
            )}

            <div className="flex justify-between w-full pt-4">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 text-xs text-sub hover:text-text"
              >
                Back
              </button>
              <button
                onClick={handleFinish}
                className="px-6 py-2.5 rounded-xl bg-main text-bg text-xs font-bold hover:opacity-90 inline-flex items-center gap-2"
              >
                <span>Start Practice</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
