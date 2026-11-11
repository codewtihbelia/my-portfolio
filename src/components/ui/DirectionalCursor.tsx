import React, { useEffect, useRef, useState } from "react";
import { useCursor } from "../../context/CursorContext";

export const DirectionalCursor: React.FC = () => {
  const { cursorEnabled, cursorLabel } = useCursor();

  const cursorRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [labelState, setLabelState] = useState<string | null>(null);

  useEffect(() => {
    // Detect touch or coarse pointer devices
    const checkTouch = () => {
      const isCoarse = window.matchMedia("(pointer: coarse)").matches;
      const isHoverNone = window.matchMedia("(hover: none)").matches;
      setIsTouchDevice(isCoarse || isHoverNone || "ontouchstart" in window);
    };

    checkTouch();
    window.addEventListener("resize", checkTouch);
    return () => window.removeEventListener("resize", checkTouch);
  }, []);

  useEffect(() => {
    if (!cursorEnabled || isTouchDevice) return;

    let rafId: number;
    let isVisible = false;
    let isHovering = false;
    let isClicking = false;
    let isTextInput = false;
    let lastLabel: string | null = null;

    // Positions & Angles
    let targetX = -100;
    let targetY = -100;
    let currentX = -100;
    let currentY = -100;
    let dotX = -100;
    let dotY = -100;

    let prevX = -100;
    let prevY = -100;

    let currentAngle = 0;
    let targetAngle = 0;
    let currentSpeed = 0;
    let idleCounter = 0;

    const onMouseMove = (e: MouseEvent) => {
      if (!isVisible) {
        isVisible = true;
        currentX = e.clientX;
        currentY = e.clientY;
        dotX = e.clientX;
        dotY = e.clientY;
        prevX = e.clientX;
        prevY = e.clientY;
      }

      targetX = e.clientX;
      targetY = e.clientY;

      // Calculate directional vector
      const dx = targetX - prevX;
      const dy = targetY - prevY;
      const dist = Math.hypot(dx, dy);

      if (dist > 1.8) {
        // Compute heading angle in degrees (0deg = right, 90deg = down, 180deg = left, -90deg = up)
        targetAngle = Math.atan2(dy, dx) * (180 / Math.PI);
        currentSpeed = Math.min(dist * 1.2, 45);
        idleCounter = 0;
        prevX = targetX;
        prevY = targetY;
      }

      // Check for interactive targets
      const target = e.target as HTMLElement | null;
      if (target) {
        const interactiveEl = target.closest(
          'a, button, [role="button"], input, textarea, select, label, .cursor-pointer, [data-cursor-interactive]',
        );
        const textEl = target.closest(
          'input, textarea, [contenteditable="true"]',
        );

        isHovering = Boolean(interactiveEl);
        isTextInput = Boolean(textEl);

        const customLabel =
          target.getAttribute("data-cursor-label") ||
          target
            .closest("[data-cursor-label]")
            ?.getAttribute("data-cursor-label") ||
          null;

        if (customLabel !== lastLabel) {
          lastLabel = customLabel;
          setLabelState(customLabel);
        }
      }
    };

    const onMouseDown = () => {
      isClicking = true;
    };

    const onMouseUp = () => {
      isClicking = false;
    };

    const onMouseLeave = () => {
      isVisible = false;
    };

    const onMouseEnter = () => {
      isVisible = true;
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);

    // Animation Loop
    const render = () => {
      // Smoothly interpolate position (trailing physics)
      currentX += (targetX - currentX) * 0.22;
      currentY += (targetY - currentY) * 0.22;

      // Precision dot has faster tracking
      dotX += (targetX - dotX) * 0.75;
      dotY += (targetY - dotY) * 0.75;

      // Decay speed smoothly
      currentSpeed += (0 - currentSpeed) * 0.08;
      idleCounter++;

      // Shortest path angle interpolation
      let angleDiff = ((targetAngle - currentAngle + 540) % 360) - 180;
      currentAngle += angleDiff * 0.18;

      if (cursorRef.current && pointerRef.current && dotRef.current) {
        // Overall cursor visibility (auto-hide when over text inputs)
        cursorRef.current.style.opacity = !isVisible || isTextInput ? "0" : "1";

        // Precision center dot transform
        dotRef.current.style.transform = `translate3d(${dotX}px, ${dotY}px, 0) translate(-50%, -50%) ${
          isClicking ? "scale(0.75)" : isHovering ? "scale(1.25)" : "scale(1)"
        }`;

        // Directional needle / reticle transform
        const baseScale = isClicking ? 0.8 : isHovering ? 1.35 : 1.0;
        const stretchX = baseScale * (1 + currentSpeed * 0.012);
        const stretchY = baseScale * (1 - currentSpeed * 0.005);

        // When stationary or hovering, smoothly rotate or show reticle
        pointerRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%) rotate(${currentAngle}deg) scale(${stretchX}, ${stretchY})`;

        // Dynamic style for interactive hover states
        if (isHovering) {
          pointerRef.current.style.opacity = "1";
          dotRef.current.style.opacity = "1";
        } else {
          pointerRef.current.style.opacity = "0.85";
          dotRef.current.style.opacity = "1";
        }

        // Label positioning if active
        if (labelRef.current) {
          labelRef.current.style.transform = `translate3d(${currentX}px, ${currentY + 28}px, 0) translate(-50%, 0)`;
        }
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
    };
  }, [cursorEnabled, isTouchDevice]);

  if (!cursorEnabled || isTouchDevice) {
    return null;
  }

  const activeLabel = cursorLabel || labelState;

  return (
    <div
      ref={cursorRef}
      id="custom-directional-cursor-container"
      className="fixed inset-0 pointer-events-none z-9999 transition-opacity duration-200 select-none"
      aria-hidden="true"
    >
      {/* Directional Pointer Body (Rotates to Movement Vector) */}
      <div
        ref={pointerRef}
        id="directional-pointer-mesh"
        className="absolute top-0 left-0 will-change-transform flex items-center justify-center pointer-events-none"
      >
        {/* Aerodynamic Directional SVG Cursor */}
        <div className="relative w-12 h-12 flex items-center justify-center">
          {/* Subtle Directional Trailing Glow */}
          <div className="absolute w-8 h-8 rounded-full bg-indigo-500/20 dark:bg-indigo-400/25 blur-md -left-1" />

          {/* Precision Directional Needle Arrow (Points along 0deg = Right) */}
          <svg
            className="w-10 h-10 drop-shadow-[0_2px_8px_rgba(99,102,241,0.45)] text-indigo-600 dark:text-indigo-400 transition-colors duration-150"
            viewBox="0 0 36 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Outer Velocity Arc */}
            <path
              d="M 8 10 A 13 13 0 0 0 8 26"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeOpacity="0.4"
            />
            {/* Directional Leading Dart / Chevron */}
            <path
              d="M 10 12 L 28 18 L 10 24 L 14 18 Z"
              fill="currentColor"
              className="drop-shadow-sm"
            />
            {/* Speed Notch */}
            <circle cx="28" cy="18" r="1.5" fill="#ffffff" />
          </svg>
        </div>
      </div>

      {/* Central Precision Focus Core (Tight Tracker) */}
      <div
        ref={dotRef}
        id="directional-precision-core"
        className="absolute top-0 left-0 will-change-transform flex items-center justify-center pointer-events-none"
      >
        <div className="relative flex items-center justify-center">
          {/* Subtle Outer Focus Ring */}
          <div className="w-5 h-5 rounded-full border border-indigo-500/25 dark:border-indigo-400/30 bg-indigo-500/10 dark:bg-indigo-400/10 transition-all duration-150" />
          {/* Center Precision Point */}
          <div className="absolute w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-300 ring-1.5 ring-white dark:ring-zinc-950 shadow-[0_0_8px_rgba(99,102,241,0.9)] transition-all duration-150" />
        </div>
      </div>

      {/* Hover Micro-Badge / Action Label */}
      {activeLabel && (
        <div
          ref={labelRef}
          className="absolute top-0 left-0 px-2.5 py-1 rounded-full bg-zinc-900/90 dark:bg-white/95 text-white dark:text-zinc-900 text-[10px] font-bold tracking-wide shadow-lg uppercase backdrop-blur-sm pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-90 duration-150"
        >
          {activeLabel}
        </div>
      )}
    </div>
  );
};
