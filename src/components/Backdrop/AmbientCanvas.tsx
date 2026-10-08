"use client";

import React, { useEffect, useRef } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface ConstellationNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseRadius: number;
  energy: number;
  isCaretColor: boolean;
}

interface ParticleNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
  energy: number;
  colorType: "main" | "caret";
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  speed: number;
}

/**
 * Parses CSS hex or rgb string into { r, g, b } numeric components.
 */
function parseCssColor(colorStr: string, fallback: RGB = { r: 56, g: 189, b: 248 }): RGB {
  if (!colorStr) return fallback;
  const str = colorStr.trim();

  if (str.startsWith("#")) {
    if (str.length === 4) {
      const r = parseInt(str[1] + str[1], 16);
      const g = parseInt(str[2] + str[2], 16);
      const b = parseInt(str[3] + str[3], 16);
      return { r, g, b };
    }
    if (str.length >= 7) {
      const r = parseInt(str.slice(1, 3), 16) || fallback.r;
      const g = parseInt(str.slice(3, 5), 16) || fallback.g;
      const b = parseInt(str.slice(5, 7), 16) || fallback.b;
      return { r, g, b };
    }
  }

  if (str.startsWith("rgb")) {
    const parts = str.match(/\d+/g);
    if (parts && parts.length >= 3) {
      return {
        r: parseInt(parts[0], 10),
        g: parseInt(parts[1], 10),
        b: parseInt(parts[2], 10),
      };
    }
  }

  return fallback;
}

export const AmbientCanvas: React.FC = () => {
  const { ambientBackdrop, theme } = useSettingsStore();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (ambientBackdrop === "off") {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    // Check reduced motion preference
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Viewport dimensions & pixel ratio
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      if (!canvas) return;
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    // Cache computed CSS variables (--main, --caret, --bg)
    let mainColor: RGB = { r: 0, g: 240, b: 255 };
    let caretColor: RGB = { r: 255, g: 230, b: 0 };
    const updateColors = () => {
      if (typeof window === "undefined") return;
      const computed = getComputedStyle(document.documentElement);
      const mainCss = computed.getPropertyValue("--main");
      const caretCss = computed.getPropertyValue("--caret");
      mainColor = parseCssColor(mainCss, { r: 0, g: 240, b: 255 });
      caretColor = parseCssColor(caretCss, { r: 255, g: 230, b: 0 });
    };
    updateColors();

    // Keystroke state
    const ripples: Ripple[] = [];
    let pulseEnergy = 0;

    // Pointer location for keystroke ripple origin
    let lastKeyPos = { x: width / 2, y: height / 2 };

    const handlePointerMove = (e: MouseEvent) => {
      lastKeyPos = { x: e.clientX, y: e.clientY };
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore meta keys that don't represent actual typing
      if (e.key === "Control" || e.key === "Alt" || e.key === "Shift" || e.key === "Meta") {
        return;
      }

      pulseEnergy = Math.min(2.0, pulseEnergy + 0.5);

      // Add a responsive shockwave ripple
      if (ripples.length < 6) {
        ripples.push({
          x: lastKeyPos.x || width / 2,
          y: lastKeyPos.y || height / 2,
          radius: 8,
          maxRadius: Math.min(width, height) * 0.55,
          alpha: 0.35,
          speed: 5.5,
        });
      }
    };

    window.addEventListener("mousemove", handlePointerMove, { passive: true });
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", resize);

    // Initial entities setup based on mode
    const isMobile = width < 768;
    const constellationCount = isMobile ? 36 : 72;
    const constellationNodes: ConstellationNode[] = [];

    for (let i = 0; i < constellationCount; i++) {
      constellationNodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        baseRadius: 1.2 + Math.random() * 1.0,
        energy: 0,
        isCaretColor: i % 4 === 0,
      });
    }

    const particleCount = isMobile ? 45 : 90;
    const particles: ParticleNode[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -0.2 - Math.random() * 0.4,
        radius: 0.8 + Math.random() * 1.5,
        baseAlpha: 0.08 + Math.random() * 0.18,
        energy: 0,
        colorType: i % 3 === 0 ? "caret" : "main",
      });
    }

    // Animation loop
    let animationFrameId: number | null = null;
    let isPaused = document.hidden;

    const handleVisibility = () => {
      isPaused = document.hidden;
      if (!isPaused && !prefersReducedMotion && animationFrameId === null) {
        animationFrameId = requestAnimationFrame(render);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    let lastTime = performance.now();
    let simTime = 0;

    const render = (currentTime: number) => {
      if (isPaused) {
        animationFrameId = null;
        return;
      }

      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;
      simTime += dt;

      // Dampen global pulse energy
      pulseEnergy *= 0.93;
      if (pulseEnergy < 0.001) pulseEnergy = 0;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      const m = mainColor;
      const c = caretColor;

      // MODE 1: CYBER HORIZON & SYNTH CIRCUIT MESH
      if (ambientBackdrop === "cyber_grid") {
        const horizonY = height * 0.44;
        const groundHeight = height - horizonY;
        const vanishX = width / 2;

        // Subtle upper atmosphere cyber haze
        const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
        skyGrad.addColorStop(0, `rgba(${m.r}, ${m.g}, ${m.b}, 0)`);
        skyGrad.addColorStop(1, `rgba(${m.r}, ${m.g}, ${m.b}, ${0.04 + pulseEnergy * 0.04})`);
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, horizonY);

        // Ground perspective neon glow
        const groundGrad = ctx.createLinearGradient(0, horizonY, 0, height);
        groundGrad.addColorStop(0, `rgba(${m.r}, ${m.g}, ${m.b}, ${0.06 + pulseEnergy * 0.08})`);
        groundGrad.addColorStop(0.5, `rgba(${c.r}, ${c.g}, ${c.b}, 0.02)`);
        groundGrad.addColorStop(1, `rgba(${m.r}, ${m.g}, ${m.b}, 0)`);
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, horizonY, width, groundHeight);

        // Horizon bright laser line
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${m.r}, ${m.g}, ${m.b}, ${0.28 + pulseEnergy * 0.35})`;
        ctx.lineWidth = 1.2;
        ctx.moveTo(0, horizonY);
        ctx.lineTo(width, horizonY);
        ctx.stroke();

        // 1. Perspective Grid Rays (converging towards vanishing point)
        const rayCount = isMobile ? 18 : 34;
        const raySpread = width * 1.8;
        ctx.beginPath();
        for (let i = 0; i <= rayCount; i++) {
          const bottomX = (width / 2) - (raySpread / 2) + (i / rayCount) * raySpread;
          const isCenter = Math.abs(i - rayCount / 2) <= 1;
          const rayAlpha = isCenter ? 0.22 + pulseEnergy * 0.25 : 0.08 + pulseEnergy * 0.08;

          ctx.strokeStyle = isCenter
            ? `rgba(${c.r}, ${c.g}, ${c.b}, ${rayAlpha})`
            : `rgba(${m.r}, ${m.g}, ${m.b}, ${rayAlpha})`;
          ctx.lineWidth = isCenter ? 1.0 : 0.7;

          ctx.moveTo(vanishX, horizonY);
          ctx.lineTo(bottomX, height);
        }
        ctx.stroke();

        // 2. Moving Horizontal Perspective Lines (flowing forward in 3D)
        const lineCount = 14;
        const speed = 0.25;
        const lineOffset = (simTime * speed) % (1 / lineCount);

        for (let i = 1; i <= lineCount; i++) {
          const norm = (i / lineCount + lineOffset) % 1;
          // Exponential curve gives realistic depth compression
          const depth = Math.pow(norm, 2.4);
          const y = horizonY + groundHeight * depth;
          const lineAlpha = depth * (0.16 + pulseEnergy * 0.28);

          ctx.beginPath();
          ctx.strokeStyle = i % 3 === 0
            ? `rgba(${c.r}, ${c.g}, ${c.b}, ${lineAlpha * 0.8})`
            : `rgba(${m.r}, ${m.g}, ${m.b}, ${lineAlpha})`;
          ctx.lineWidth = 0.8 + depth * 0.6;
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // 3. Ambient Synth Star Dust in upper half
        for (let i = 0; i < (isMobile ? 18 : 36); i++) {
          const sx = (Math.sin(i * 123.4 + simTime * 0.1) * 0.5 + 0.5) * width;
          const sy = (Math.cos(i * 567.8 + simTime * 0.08) * 0.5 + 0.5) * (horizonY - 20);
          const sAlpha = 0.15 + (Math.sin(simTime * 2 + i) * 0.5 + 0.5) * 0.25 + pulseEnergy * 0.2;
          const sColor = i % 3 === 0 ? c : m;

          ctx.beginPath();
          ctx.arc(sx, sy, 1.0, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${sColor.r}, ${sColor.g}, ${sColor.b}, ${sAlpha})`;
          ctx.fill();
        }
      }

      // MODE 2: DUAL-GLOW CONSTELLATION
      else if (ambientBackdrop === "constellation") {
        const maxDist = isMobile ? 100 : 140;
        const maxDistSq = maxDist * maxDist;

        // Update & draw nodes
        for (let i = 0; i < constellationNodes.length; i++) {
          const n = constellationNodes[i];

          if (pulseEnergy > 0.05) {
            n.energy = Math.max(n.energy, pulseEnergy * 0.85);
          }
          n.energy *= 0.92;

          n.x += n.vx * (1 + n.energy * 0.8);
          n.y += n.vy * (1 + n.energy * 0.8);

          // Wrap around edges
          if (n.x < -10) n.x = width + 10;
          else if (n.x > width + 10) n.x = -10;
          if (n.y < -10) n.y = height + 10;
          else if (n.y > height + 10) n.y = -10;

          const nodeColor = n.isCaretColor ? c : m;

          // Connecting lines
          for (let j = i + 1; j < constellationNodes.length; j++) {
            const n2 = constellationNodes[j];
            const dx = n.x - n2.x;
            const dy = n.y - n2.y;
            const distSq = dx * dx + dy * dy;

            if (distSq < maxDistSq) {
              const distRatio = 1 - Math.sqrt(distSq) / maxDist;
              const lineAlpha = distRatio * (0.13 + (n.energy + n2.energy) * 0.18);

              ctx.beginPath();
              ctx.strokeStyle = n.isCaretColor || n2.isCaretColor
                ? `rgba(${c.r}, ${c.g}, ${c.b}, ${lineAlpha * 0.75})`
                : `rgba(${m.r}, ${m.g}, ${m.b}, ${lineAlpha})`;
              ctx.lineWidth = 0.8;
              ctx.moveTo(n.x, n.y);
              ctx.lineTo(n2.x, n2.y);
              ctx.stroke();
            }
          }

          // Node drawing
          const radius = n.baseRadius + n.energy * 1.4;
          const nodeAlpha = 0.30 + n.energy * 0.6;

          ctx.beginPath();
          ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${nodeColor.r}, ${nodeColor.g}, ${nodeColor.b}, ${nodeAlpha})`;
          ctx.fill();
        }
      }

      // MODE 3: HIGH-DENSITY GRID
      else if (ambientBackdrop === "grid") {
        const spacing = isMobile ? 36 : 40;
        const cols = Math.ceil(width / spacing);
        const rows = Math.ceil(height / spacing);

        const activeRipple = ripples[0];

        for (let col = 0; col <= cols; col++) {
          const gx = col * spacing;
          for (let row = 0; row <= rows; row++) {
            const gy = row * spacing;

            let dotAlpha = 0.08;
            let dotRadius = 1.0;

            // Ripple wave effect across grid points
            if (activeRipple) {
              const dx = gx - activeRipple.x;
              const dy = gy - activeRipple.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const waveDist = Math.abs(dist - activeRipple.radius);

              if (waveDist < 60) {
                const waveStrength = (1 - waveDist / 60) * activeRipple.alpha;
                dotAlpha = Math.min(0.5, dotAlpha + waveStrength * 0.9);
                dotRadius += waveStrength * 1.4;
              }
            } else if (pulseEnergy > 0.02) {
              dotAlpha += pulseEnergy * 0.08;
            }

            ctx.beginPath();
            ctx.arc(gx, gy, dotRadius, 0, Math.PI * 2);
            ctx.fillStyle = (col + row) % 5 === 0
              ? `rgba(${c.r}, ${c.g}, ${c.b}, ${dotAlpha})`
              : `rgba(${m.r}, ${m.g}, ${m.b}, ${dotAlpha})`;
            ctx.fill();
          }
        }
      }

      // MODE 4: DUAL-GLOW PARTICLES
      else if (ambientBackdrop === "particles") {
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];

          if (pulseEnergy > 0.05) {
            p.energy = Math.max(p.energy, pulseEnergy * 0.9);
          }
          p.energy *= 0.94;

          p.x += p.vx * (1 + p.energy * 1.2);
          p.y += p.vy * (1 + p.energy * 1.5);

          // Wrap vertically and horizontally
          if (p.y < -10) {
            p.y = height + 10;
            p.x = Math.random() * width;
          }
          if (p.x < -10) p.x = width + 10;
          else if (p.x > width + 10) p.x = -10;

          const currentRadius = p.radius + p.energy * 1.2;
          const currentAlpha = Math.min(0.70, p.baseAlpha + p.energy * 0.45);
          const pColor = p.colorType === "caret" ? c : m;

          ctx.beginPath();
          ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${pColor.r}, ${pColor.g}, ${pColor.b}, ${currentAlpha})`;
          ctx.fill();
        }
      }

      // Render expanding micro-ripples across all modes
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rip = ripples[i];
        rip.radius += rip.speed;
        rip.alpha *= 0.95;

        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${m.r}, ${m.g}, ${m.b}, ${rip.alpha * 0.55})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        if (rip.radius >= rip.maxRadius || rip.alpha < 0.01) {
          ripples.splice(i, 1);
        }
      }

      // If reduced motion is requested, pause loop after one clean paint
      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    // Kick off animation loop
    animationFrameId = requestAnimationFrame(render);

    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [ambientBackdrop, theme]);

  if (ambientBackdrop === "off") {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 select-none"
      aria-hidden="true"
    />
  );
};
