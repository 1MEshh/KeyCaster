"use client";

import React, { useMemo } from "react";

interface WpmTachometerProps {
  wpm: number;
  accuracy: number;
  streak: number;
  maxWpm?: number;
}

export const WpmTachometer: React.FC<WpmTachometerProps> = ({
  wpm,
  accuracy,
  streak,
  maxWpm = 160,
}) => {
  // Clamp WPM and calculate ratio
  const clampedWpm = Math.max(0, Math.min(wpm, maxWpm));
  const ratio = clampedWpm / maxWpm;

  // Arc angles: from -135 deg to +45 deg (180 deg total sweep)
  const startAngle = -135;
  const endAngle = 45;
  const totalSweep = endAngle - startAngle; // 180 deg
  const needleAngle = startAngle + ratio * totalSweep;

  // Zone color determination
  const zoneColor = useMemo(() => {
    if (clampedWpm >= 120) return "#ff007f"; // Hot Magenta (Nitro redline)
    if (clampedWpm >= 90) return "#ffb800"; // Cyber Gold
    if (clampedWpm >= 60) return "#39ff14"; // Neon Lime
    return "#00f0ff"; // High-voltage Cyan
  }, [clampedWpm]);

  // Radius configuration
  const cx = 110;
  const cy = 95;
  const r = 70;

  // Helper to convert polar degrees to Cartesian (x, y)
  const polarToCartesian = (deg: number, radius: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    };
  };

  // Generate tick markers
  const ticks = useMemo(() => {
    const list = [];
    const tickCount = 9; // 0, 20, 40, 60, 80, 100, 120, 140, 160
    for (let i = 0; i < tickCount; i++) {
      const tickRatio = i / (tickCount - 1);
      const angle = startAngle + tickRatio * totalSweep;
      const val = Math.round(tickRatio * maxWpm);
      const isMajor = i % 2 === 0;
      const innerP = polarToCartesian(angle, isMajor ? r - 10 : r - 6);
      const outerP = polarToCartesian(angle, r);
      const textP = polarToCartesian(angle, r - 18);

      let tickColor = "rgba(255, 255, 255, 0.25)";
      if (val >= 120) tickColor = "rgba(255, 0, 127, 0.6)";
      else if (val >= 90) tickColor = "rgba(255, 184, 0, 0.6)";
      else if (val >= 60) tickColor = "rgba(57, 255, 20, 0.6)";
      else tickColor = "rgba(0, 240, 255, 0.6)";

      list.push({
        angle,
        val,
        isMajor,
        innerP,
        outerP,
        textP,
        tickColor,
      });
    }
    return list;
  }, [maxWpm, startAngle, totalSweep]);

  // Background arc SVG path
  const p1 = polarToCartesian(startAngle, r);
  const p2 = polarToCartesian(endAngle, r);
  const bgArcPath = `M ${p1.x} ${p1.y} A ${r} ${r} 0 0 1 ${p2.x} ${p2.y}`;

  // Active filled arc
  const pActive = polarToCartesian(needleAngle, r);
  const largeArcFlag = needleAngle - startAngle <= 180 ? 0 : 1;
  const activeArcPath =
    ratio > 0.005
      ? `M ${p1.x} ${p1.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${pActive.x} ${pActive.y}`
      : "";

  return (
    <div className="relative flex flex-col items-center select-none py-1 px-3">
      {/* HUD Reticle Outer Frame */}
      <div className="relative w-[220px] h-[125px] overflow-hidden flex items-center justify-center">
        <svg
          viewBox="0 0 220 130"
          className="w-full h-full filter drop-shadow-[0_0_12px_rgba(0,0,0,0.5)]"
        >
          <defs>
            <filter id="tachGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="activeArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00f0ff" />
              <stop offset="40%" stopColor="#39ff14" />
              <stop offset="70%" stopColor="#ffb800" />
              <stop offset="100%" stopColor="#ff007f" />
            </linearGradient>
          </defs>

          {/* Background track arc */}
          <path
            d={bgArcPath}
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="5"
            strokeLinecap="round"
          />

          {/* Active gauge arc */}
          {activeArcPath && (
            <path
              d={activeArcPath}
              fill="none"
              stroke="url(#activeArcGrad)"
              strokeWidth="5"
              strokeLinecap="round"
              filter="url(#tachGlow)"
              className="transition-all duration-150 ease-out"
            />
          )}

          {/* Graduated Ticks */}
          {ticks.map((t, idx) => (
            <g key={idx}>
              <line
                x1={t.innerP.x}
                y1={t.innerP.y}
                x2={t.outerP.x}
                y2={t.outerP.y}
                stroke={t.tickColor}
                strokeWidth={t.isMajor ? 2 : 1}
              />
              {t.isMajor && (
                <text
                  x={t.textP.x}
                  y={t.textP.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="7"
                  fontFamily="monospace"
                  fill="rgba(255, 255, 255, 0.4)"
                  fontWeight="600"
                >
                  {t.val}
                </text>
              )}
            </g>
          ))}

          {/* Center Hub & Needle */}
          <g
            className="transition-transform duration-100 ease-out"
            style={{
              transform: `rotate(${needleAngle + 90}deg)`,
              transformOrigin: `${cx}px ${cy}px`,
            }}
          >
            {/* Tapered Needle */}
            <line
              x1={cx}
              y1={cy}
              x2={cx}
              y2={cy - (r - 8)}
              stroke={zoneColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              filter="url(#tachGlow)"
            />
          </g>

          {/* Center Hub Outer Ring */}
          <circle
            cx={cx}
            cy={cy}
            r="12"
            fill="#090d16"
            stroke={zoneColor}
            strokeWidth="2"
            className="transition-colors duration-200"
          />
          <circle cx={cx} cy={cy} r="4" fill={zoneColor} />
        </svg>

        {/* Digital Readout Center Overlay */}
        <div className="absolute bottom-1 flex flex-col items-center">
          <div className="flex items-baseline gap-1">
            <span
              className="font-mono font-black text-2xl tracking-tight leading-none"
              style={{
                color: zoneColor,
                textShadow: `0 0 10px ${zoneColor}60`,
              }}
            >
              {wpm}
            </span>
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-sub/80">
              WPM
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-[9px] font-mono text-sub/70">
            <span>{accuracy}% ACC</span>
            {streak > 2 && (
              <span className="text-main font-bold flex items-center gap-0.5">
                🔥{streak}x
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
