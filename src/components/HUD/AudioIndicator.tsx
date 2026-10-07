"use client";

import React from "react";
import { Volume2, VolumeX } from "lucide-react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { AcousticVisualizer } from "@/components/HUD/AcousticVisualizer";

interface AudioIndicatorProps {
  isPlaying: boolean;
  onReplay: () => void;
}

export const AudioIndicator: React.FC<AudioIndicatorProps> = ({ isPlaying, onReplay }) => {
  const { soundVolume } = useSettingsStore();
  const isMuted = soundVolume === 0;

  return (
    <div className="flex flex-col items-center justify-center gap-2 select-none">
      <button
        onClick={onReplay}
        className="group flex items-center gap-3 px-4 py-2 rounded-full border border-sub/30 bg-bg hover:border-main/60 hover:bg-main/5 transition-all shadow-sm active:scale-95 focus:outline-none"
        title="Press Tab to replay audio"
      >
        <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-main/10 text-main group-hover:scale-105 transition-transform">
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-sub" />
          ) : (
            <Volume2 className={`w-4 h-4 ${isPlaying ? "text-main animate-pulse" : "text-sub"}`} />
          )}

          {/* Sound waves animation when active */}
          {isPlaying && (
            <span className="absolute -inset-1 rounded-full border border-main/40 animate-ping pointer-events-none" />
          )}
        </div>

        <div className="flex items-center gap-1.5 font-mono text-xs">
          <span className="text-sub group-hover:text-text transition-colors">Hear word</span>
          <kbd className="px-1.5 py-0.5 rounded bg-sub/20 text-sub border border-sub/30 text-[10px] uppercase font-bold tracking-wider group-hover:border-main/50 group-hover:text-main transition-colors">
            Tab
          </kbd>
        </div>
      </button>

      {/* Live Acoustic Soundwave Visualizer */}
      <AcousticVisualizer isPlaying={isPlaying} size="md" />
    </div>
  );
};
