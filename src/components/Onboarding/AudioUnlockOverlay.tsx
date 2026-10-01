"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2 } from "lucide-react";

/**
 * Detect iOS / iPadOS Safari specifically.
 * Must run client-side only (after hydration).
 */
function detectIOSSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    // iPadOS 13+ reports as Mac, check touch points
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  return isIOS && isSafari;
}

interface AudioUnlockOverlayProps {
  onUnlocked: () => void;
}

export const AudioUnlockOverlay: React.FC<AudioUnlockOverlayProps> = ({
  onUnlocked,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const unlockedRef = React.useRef(false);

  useEffect(() => {
    if (unlockedRef.current) return;
    // Only show on iOS Safari — all other platforms unlock audio fine on keypress
    if (detectIOSSafari()) {
      setIsVisible(true);
    } else {
      unlockedRef.current = true;
      // Non-iOS: skip overlay entirely, call onUnlocked immediately
      onUnlocked();
    }
  }, [onUnlocked]);

  const handleTap = () => {
    // Unlock AudioContext in the same call stack as this user gesture
    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtxClass) {
        const ctx = new AudioCtxClass();
        ctx.resume().catch(() => {});
      }
    } catch {
      // Non-blocking
    }

    // Unlock SpeechSynthesis in the same call stack as the user gesture
    try {
      if ("speechSynthesis" in window) {
        const silentUtterance = new SpeechSynthesisUtterance("");
        silentUtterance.volume = 0;
        window.speechSynthesis.speak(silentUtterance);
      }
    } catch {
      // Non-blocking
    }

    // Fade out overlay then signal parent
    setIsVisible(false);
    setTimeout(() => onUnlocked(), 600);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-bg"
          onClick={handleTap}
        >
          <div className="relative flex items-center justify-center mb-8">
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
              className="absolute w-32 h-32 rounded-full bg-main/20"
            />
            <motion.div
              animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", delay: 0.4 }}
              className="absolute w-24 h-24 rounded-full bg-main/30"
            />
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5, ease: "backOut" }}
              className="relative z-10 w-20 h-20 rounded-2xl bg-main/15 border border-main/30 flex items-center justify-center"
            >
              <Volume2 className="w-9 h-9 text-main" strokeWidth={1.5} />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="text-center px-8 space-y-3"
          >
            <h1 className="text-2xl font-mono font-bold text-text tracking-tight">
              KeyCaster
            </h1>
            <p className="text-sm font-mono text-sub leading-relaxed max-w-xs">
              Audio-first typing practice.
              <br />
              Tap anywhere to enable sound.
            </p>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.5 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleTap}
            className="mt-10 px-8 py-4 rounded-2xl bg-main text-bg text-sm font-mono font-bold tracking-wide shadow-lg shadow-main/20 active:opacity-80"
          >
            Tap to Begin
          </motion.button>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="mt-6 text-xs font-mono text-sub/50"
          >
            Safari requires a tap to enable audio
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
