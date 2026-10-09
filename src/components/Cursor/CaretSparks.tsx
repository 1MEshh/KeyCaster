"use client";

import React, { useEffect, useRef } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

interface CaretSparksProps {
  x: number;
  y: number;
  streak?: number;
  triggerKey?: number; // increments on each keystroke
}

export const CaretSparks: React.FC<CaretSparksProps> = ({
  x,
  y,
  streak = 0,
  triggerKey = 0,
}) => {
  const { caretSparks } = useSettingsStore();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const isRunningRef = useRef<boolean>(false);

  // Spawn particles on triggerKey or position change
  useEffect(() => {
    if (!caretSparks || triggerKey === 0) return;

    // Check prefers-reduced-motion
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const count = streak >= 30 ? 7 : streak >= 15 ? 5 : 3;
    const colors =
      streak >= 30
        ? ["#ff007f", "#00f0ff", "#ffe600", "#ffffff"]
        : streak >= 15
        ? ["#00f0ff", "#39ff14", "#ffffff"]
        : ["#e2b714", "#38bdf8", "#f1f5f9"];

    for (let i = 0; i < count; i++) {
      const angle = (Math.random() * Math.PI) - Math.PI; // upward burst (-180 to 0 deg)
      const speed = Math.random() * 3.5 + 1.2;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const maxLife = Math.floor(Math.random() * 15 + 12);

      particlesRef.current.push({
        x: x + (Math.random() - 0.5) * 4,
        y: y + (Math.random() - 0.5) * 8,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: maxLife,
        maxLife,
        size: Math.random() * 2.2 + 1.2,
        color,
      });
    }

    // Cap particle array to prevent memory growth
    if (particlesRef.current.length > 60) {
      particlesRef.current = particlesRef.current.slice(-60);
    }

    // Start animation loop if not already running
    if (!isRunningRef.current) {
      isRunningRef.current = true;
      runLoop();
    }
  }, [triggerKey, x, y, streak, caretSparks]);

  const runLoop = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      isRunningRef.current = false;
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      isRunningRef.current = false;
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const particles = particlesRef.current;
    let aliveCount = 0;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (p.life <= 0) continue;

      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.18; // micro gravity
      p.vx *= 0.96; // air drag
      p.life -= 1;

      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      aliveCount++;
    }

    // Clean dead particles periodically
    if (particles.length > 25 && aliveCount < 10) {
      particlesRef.current = particles.filter((p) => p.life > 0);
    }

    if (aliveCount > 0) {
      animFrameRef.current = requestAnimationFrame(runLoop);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      isRunningRef.current = false;
    }
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  if (!caretSparks) return null;

  return (
    <canvas
      ref={canvasRef}
      width={900}
      height={300}
      className="absolute inset-0 pointer-events-none w-full h-full z-20"
      style={{ overflow: "visible" }}
    />
  );
};
