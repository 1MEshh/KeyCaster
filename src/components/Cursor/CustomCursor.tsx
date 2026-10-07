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

  // Smooth lerp loop for the trailing magnetic ring
  const updateLoop = useCallback(() => {
    // Lerp factor (higher = crisper tracking, lower = softer trailing)
    const lerp = 0.22;
    ringPos.current.x += (mousePos.current.x - ringPos.current.x) * lerp;
    ringPos.current.y += (mousePos.current.y - ringPos.current.y) * lerp;

    if (dotRef.current) {
      dotRef.current.style.transform = `translate3d(${mousePos.current.x}px, ${mousePos.current.y}px, 0)`;
    }

    if (ringRef.current) {
      ringRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0)`;
    }

    animFrameId.current = requestAnimationFrame(updateLoop);
  }, []);

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
      mousePos.current.x = e.clientX;
      mousePos.current.y = e.clientY;

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

    const handleMouseEnter = () => {
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
      {/* Precision Core Dot (Zero lag) */}
      <div
        ref={dotRef}
        className={`absolute top-0 left-0 -ml-[3.5px] -mt-[3.5px] w-[7px] h-[7px] rounded-full bg-main shadow-[0_0_8px_var(--main)] transition-[transform,opacity,scale] duration-75 will-change-transform ${
          isClicking ? "scale-75" : isHovered ? "scale-125" : "scale-100"
        }`}
      />

      {/* Trailing Magnetic Fluid Ring (Lerp physics) */}
      <div
        ref={ringRef}
        className={`absolute top-0 left-0 rounded-full border will-change-transform transition-[width,height,margin,background-color,border-color,transform] duration-150 ease-out ${
          isHovered
            ? "-ml-[22px] -mt-[22px] w-[44px] h-[44px] border-main bg-main/15 shadow-[0_0_12px_var(--main)]"
            : isClicking
            ? "-ml-[11px] -mt-[11px] w-[22px] h-[22px] border-main/80 bg-main/25"
            : "-ml-[14px] -mt-[14px] w-[28px] h-[28px] border-main/50 bg-transparent"
        }`}
      />
    </div>
  );
};
