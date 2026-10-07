"use client";

import React from "react";

interface AcousticVisualizerProps {
  isPlaying: boolean;
  size?: "sm" | "md";
  className?: string;
}

export const AcousticVisualizer: React.FC<AcousticVisualizerProps> = ({
  isPlaying,
  size = "md",
  className = "",
}) => {
  const isSm = size === "sm";
  const barCount = isSm ? 5 : 7;
  const maxHeight = isSm ? 14 : 20;

  // Wave harmonic heights for aesthetic sound frequency simulation
  const waveHeights = isSm
    ? [0.45, 0.85, 1.0, 0.7, 0.35]
    : [0.35, 0.65, 0.95, 1.0, 0.8, 0.5, 0.3];

  return (
    <div
      aria-hidden="true"
      className={`inline-flex items-center gap-[3px] select-none ${
        isSm ? "h-4 px-1" : "h-6 px-1.5"
      } ${className}`}
    >
      {waveHeights.slice(0, barCount).map((normHeight, idx) => {
        const activePx = Math.max(isSm ? 5 : 6, Math.round(normHeight * maxHeight));
        const idlePx = isSm ? 3 : 4;

        return (
          <span
            key={idx}
            className={`w-[2.5px] rounded-full transition-all duration-200 ease-out ${
              isPlaying
                ? "bg-main shadow-[0_0_6px_var(--main)] animate-pulseFast"
                : "bg-sub/30 opacity-40 hover:opacity-60"
            }`}
            style={{
              height: isPlaying ? `${activePx}px` : `${idlePx}px`,
              animationDelay: `${idx * 75}ms`,
              animationDuration: isPlaying ? `${0.55 + (idx % 3) * 0.15}s` : undefined,
            }}
          />
        );
      })}
    </div>
  );
};
