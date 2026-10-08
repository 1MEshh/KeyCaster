"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";

export const CustomCursor: React.FC = () => {
  const customCursor = useSettingsStore((s) => s.customCursor);

  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);

  // Position coordinates
  const mousePos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });
  const animFrameId = useRef<number | null>(null);

  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Detect touch / coarse pointer devices
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isTouch =
        window.matchMedia("(pointer: coarse)").matches ||
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0;
      setIsTouchDevice(isTouch);
    }
  }, []);

  // Update cursor class on document body
  useEffect(() => {
    if (!customCursor || isTouchDevice) {
      document.documentElement.classList.remove("custom-cursor-active");
      return;
    }

    document.documentElement.classList.add("custom-cursor-active");
    return () => {
      document.documentElement.classList.remove("custom-cursor-active");
    };
  }, [customCursor, isTouchDevice]);

  // Adaptive magnetic follow loop for trailing fluid ring
  const updateLoop = useCallback(() => {
    const targetX = mousePos.current.x;
    const targetY = mousePos.current.y;

    const dx = targetX - ringPos.current.x;
    const dy = targetY - ringPos.current.y;
    const dist = Math.hypot(dx, dy);

    // Adaptive follow factor: speeds up on fast flicks to prevent dragging desync
    // Small movement: silky 0.30; fast movement: snappier up to 0.70
    const adaptiveLerp = Math.min(0.70, 0.30 + (dist / 120) * 0.40);

    ringPos.current.x += dx * adaptiveLerp;
    ringPos.current.y += dy * adaptiveLerp;

    // Hard distance clamp: Ring can NEVER lag further than 24px from dot
    const maxLag = isHovered ? 12 : 24;
    const currentDist = Math.hypot(targetX - ringPos.current.x, targetY - ringPos.current.y);
    if (currentDist > maxLag && currentDist > 0) {
      const angle = Math.atan2(ringPos.current.y - targetY, ringPos.current.x - targetX);
      ringPos.current.x = targetX + Math.cos(angle) * maxLag;
      ringPos.current.y = targetY + Math.sin(angle) * maxLag;
    }

    if (ringRef.current) {
      ringRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0)`;
    }

    animFrameId.current = requestAnimationFrame(updateLoop);
  }, [isHovered]);

  useEffect(() => {
    if (!customCursor || isTouchDevice) return;

    animFrameId.current = requestAnimationFrame(updateLoop);
    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [updateLoop, customCursor, isTouchDevice]);

  // Mouse & typing event listeners
  useEffect(() => {
    if (!customCursor || isTouchDevice) return;

    const handleMouseMove = (e: MouseEvent) => {
      const clientX = e.clientX;
      const clientY = e.clientY;

      // First time entering screen: snap ring directly to avoid edge sweeping
      if (!isVisible || (mousePos.current.x === -100 && mousePos.current.y === -100)) {
        ringPos.current.x = clientX;
        ringPos.current.y = clientY;
      }

      mousePos.current.x = clientX;
      mousePos.current.y = clientY;

      // Update dot instantaneously for true 0ms hardware-like responsiveness
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${clientX}px, ${clientY}px, 0)`;
      }

      if (!isVisible) setIsVisible(true);
      if (isTyping) setIsTyping(false);

      // Check if hovering interactive target
      const target = e.target as HTMLElement | null;
      if (!target) {
        setIsHovered(false);
        return;
      }

      const interactive = target.closest(
        'button, a, kbd, input, [role="button"], select, textarea, .interactive, [data-interactive="true"]'
      );
      setIsHovered(Boolean(interactive));
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = (e: MouseEvent) => {
      mousePos.current.x = e.clientX;
      mousePos.current.y = e.clientY;
      ringPos.current.x = e.clientX;
      ringPos.current.y = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }
      setIsVisible(true);
    };

    // Auto-hide cursor while typing
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore isolated modifier keys
      if (["Control", "Alt", "Shift", "Meta"].includes(e.key)) return;
      setIsTyping(true);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [customCursor, isTouchDevice, isVisible, isTyping]);

  if (!customCursor || isTouchDevice) return null;

  const shouldHide = !isVisible || isTyping;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none z-[9999] transition-opacity duration-200 select-none overflow-hidden ${
        shouldHide ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Precision Core Dot (Zero lag, no CSS transform transitions) */}
      <div
        ref={dotRef}
        className={`absolute top-0 left-0 -ml-[3.5px] -mt-[3.5px] w-[7px] h-[7px] rounded-full bg-main shadow-[0_0_10px_var(--main)] transition-[opacity,scale] duration-100 ease-out ${
          isClicking ? "scale-75" : isHovered ? "scale-125 bg-caret shadow-[0_0_14px_var(--caret)]" : "scale-100"
        }`}
      />

      {/* Adaptive Magnetic Follow Ring (Clamped velocity spring, no CSS transform transition) */}
      <div
        ref={ringRef}
        className={`absolute top-0 left-0 rounded-full border transition-[width,height,margin,background-color,border-color,box-shadow] duration-150 ease-out ${
          isHovered
            ? "-ml-[20px] -mt-[20px] w-[40px] h-[40px] border-main bg-main/15 shadow-[0_0_16px_var(--main)]"
            : isClicking
            ? "-ml-[10px] -mt-[10px] w-[20px] h-[20px] border-main/90 bg-main/30 shadow-[0_0_8px_var(--main)]"
            : "-ml-[13px] -mt-[13px] w-[26px] h-[26px] border-main/60 bg-main/5 shadow-[0_0_6px_var(--main)/25]"
        }`}
      />
    </div>
  );
};
