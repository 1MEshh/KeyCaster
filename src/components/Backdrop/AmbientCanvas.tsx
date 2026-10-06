"use client";

import React, { useEffect, useRef } from "react";
import { useSettingsStore, type AmbientBackdrop } from "@/store/useSettingsStore";

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
}

interface ParticleNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
  energy: number;
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

    // Cache computed CSS variables (--main and --bg)
    let mainColor: RGB = { r: 56, g: 189, b: 248 };
    const updateColors = () => {
      if (typeof window === "undefined") return;
      const computed = getComputedStyle(document.documentElement);
      const mainCss = computed.getPropertyValue("--main");
      mainColor = parseCssColor(mainCss, { r: 56, g: 189, b: 248 });
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

      pulseEnergy = Math.min(1.5, pulseEnergy + 0.4);

      // Add a subtle micro-ripple
      if (ripples.length < 5) {
        ripples.push({
          x: lastKeyPos.x || width / 2,
          y: lastKeyPos.y || height / 2,
          radius: 10,
          maxRadius: Math.min(width, height) * 0.45,
          alpha: 0.28,
          speed: 4.5,
        });
      }
    };

    window.addEventListener("mousemove", handlePointerMove, { passive: true });
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", resize);

    // Initial entities setup based on mode
    const isMobile = width < 768;
    const constellationCount = isMobile ? 32 : 64;
    const constellationNodes: ConstellationNode[] = [];

    for (let i = 0; i < constellationCount; i++) {
      constellationNodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        baseRadius: 1.2 + Math.random() * 0.8,
        energy: 0,
      });
    }

    const particleCount = isMobile ? 40 : 80;
    const particles: ParticleNode[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: -0.15 - Math.random() * 0.35,
        radius: 0.8 + Math.random() * 1.4,
        baseAlpha: 0.08 + Math.random() * 0.16,
        energy: 0,
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
    let gridTime = 0;

    const render = (currentTime: number) => {
      if (isPaused) {
        animationFrameId = null;
        return;
      }

      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;
      gridTime += dt;

      // Dampen global pulse energy
      pulseEnergy *= 0.94;
      if (pulseEnergy < 0.001) pulseEnergy = 0;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      const { r, g, b } = mainColor;

      // Render mode specific visual elements
      if (ambientBackdrop === "constellation") {
        const maxDist = isMobile ? 95 : 130;
        const maxDistSq = maxDist * maxDist;

        // Update & draw nodes
        for (let i = 0; i < constellationNodes.length; i++) {
          const n = constellationNodes[i];

          // React to pulse energy
          if (pulseEnergy > 0.05) {
            n.energy = Math.max(n.energy, pulseEnergy * 0.8);
          }
          n.energy *= 0.92;

          n.x += n.vx * (1 + n.energy * 0.8);
          n.y += n.vy * (1 + n.energy * 0.8);

          // Wrap around edges with slight padding
          if (n.x < -10) n.x = width + 10;
          else if (n.x > width + 10) n.x = -10;
          if (n.y < -10) n.y = height + 10;
          else if (n.y > height + 10) n.y = -10;

          // Connecting lines
          for (let j = i + 1; j < constellationNodes.length; j++) {
            const n2 = constellationNodes[j];
            const dx = n.x - n2.x;
            const dy = n.y - n2.y;
            const distSq = dx * dx + dy * dy;

            if (distSq < maxDistSq) {
              const distRatio = 1 - Math.sqrt(distSq) / maxDist;
              const lineAlpha = distRatio * (0.12 + (n.energy + n2.energy) * 0.15);

              ctx.beginPath();
              ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${lineAlpha})`;
              ctx.lineWidth = 0.8;
              ctx.moveTo(n.x, n.y);
              ctx.lineTo(n2.x, n2.y);
              ctx.stroke();
            }
          }

          // Node drawing
          const radius = n.baseRadius + n.energy * 1.2;
          const nodeAlpha = 0.25 + n.energy * 0.55;

          ctx.beginPath();
          ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${nodeAlpha})`;
          ctx.fill();
        }
      } else if (ambientBackdrop === "grid") {
        // High-density Linear-style dot mesh
        const spacing = isMobile ? 36 : 40;
        const cols = Math.ceil(width / spacing);
        const rows = Math.ceil(height / spacing);

        const activeRipple = ripples[0];

        for (let c = 0; c <= cols; c++) {
          const gx = c * spacing;
          for (let rIdx = 0; rIdx <= rows; rIdx++) {
            const gy = rIdx * spacing;

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
                dotAlpha = Math.min(0.45, dotAlpha + waveStrength * 0.85);
                dotRadius += waveStrength * 1.2;
              }
            } else if (pulseEnergy > 0.02) {
              dotAlpha += pulseEnergy * 0.08;
            }

            ctx.beginPath();
            ctx.arc(gx, gy, dotRadius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${dotAlpha})`;
            ctx.fill();
          }
        }
      } else if (ambientBackdrop === "particles") {
        // Floating organic dust motes
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

          const currentRadius = p.radius + p.energy * 1.0;
          const currentAlpha = Math.min(0.65, p.baseAlpha + p.energy * 0.4);

          ctx.beginPath();
          ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${currentAlpha})`;
          ctx.fill();
        }
      }

      // Render expanding micro-ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rip = ripples[i];
        rip.radius += rip.speed;
        rip.alpha *= 0.96;

        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${rip.alpha * 0.5})`;
        ctx.lineWidth = 1;
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
