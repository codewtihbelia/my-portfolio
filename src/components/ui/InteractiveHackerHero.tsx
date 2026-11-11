import React, { useRef, useState, useCallback } from "react";
import { Eye, Scan, Crosshair, Terminal } from "lucide-react";

interface InteractiveHackerHeroProps {
  name?: string;
  location?: string;
}

export const InteractiveHackerHero: React.FC<InteractiveHackerHeroProps> = ({
  name = "Codewithbelia",
  location = "Philippines",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 }); // percentages (0-100)
  const [pixelPos, setPixelPos] = useState({ x: 0, y: 0 }); // container pixels
  const [isHovered, setIsHovered] = useState(false);
  const [alwaysReveal, setAlwaysReveal] = useState(false);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  // Handle pointer coordinates
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const px = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const py = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

      setPixelPos({ x: px, y: py });
      const pctX = (px / rect.width) * 100;
      const pctY = (py / rect.height) * 100;
      setMousePos({ x: pctX, y: pctY });

      // Subtle 3D tilt
      const tiltX = (py / rect.height - 0.5) * -5;
      const tiltY = (px / rect.width - 0.5) * 5;
      setTilt({ rx: tiltX, ry: tiltY });
    },
    [],
  );

  const handlePointerEnter = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      setIsHovered(true);
      handlePointerMove(e);
    },
    [handlePointerMove],
  );

  const handlePointerLeave = useCallback(() => {
    setIsHovered(false);
    setTilt({ rx: 0, ry: 0 });
  }, []);

  // Touch handlers for mobile devices
  const handleTouch = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current || e.touches.length === 0) return;
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const px = Math.max(0, Math.min(rect.width, touch.clientX - rect.left));
    const py = Math.max(0, Math.min(rect.height, touch.clientY - rect.top));

    setPixelPos({ x: px, y: py });
    const pctX = (px / rect.width) * 100;
    const pctY = (py / rect.height) * 100;
    setMousePos({ x: pctX, y: pctY });
    setIsHovered(true);
  }, []);

  // Flashlight aperture radius (scaled to comfortably envelop head & hood: 250px)
  const spotlightRadius = 250;

  return (
    <div className="relative w-full max-w-190 mx-auto select-none">
      {/* Pure Transparent Container (No background card, borders, or solid box frame) */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onTouchStart={handleTouch}
        onTouchMove={handleTouch}
        onTouchEnd={() => setIsHovered(false)}
        style={{
          transform: `perspective(1200px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          transition: isHovered
            ? "transform 0.1s ease-out"
            : "transform 0.5s ease-out",
        }}
        className="relative aspect-1166/1137 w-full cursor-crosshair group bg-transparent"
      >
        {/* Subtle Backlight Aura behind Portrait */}
        <div className="absolute inset-0 -z-10 rounded-full blur-3xl opacity-25 dark:opacity-35 bg-linear-to-t from-indigo-500/30 via-cyan-500/20 to-transparent pointer-events-none" />

        {/* 1. BASE LAYER: Real Transparent Techwear Portrait Cutout (Clean rest state, fades/masks out when hooded) */}
        <img
          src="/heroBanner.png"
          alt={name}
          className="absolute inset-0 w-full h-full object-contain object-top pointer-events-none z-10 drop-shadow-2xl transition-opacity duration-300"
          style={{
            opacity: alwaysReveal ? 0 : 1,
            WebkitMaskImage: alwaysReveal
              ? "none"
              : isHovered
                ? `radial-gradient(circle ${spotlightRadius}px at ${pixelPos.x}px ${pixelPos.y}px, transparent 0%, transparent 68%, black 100%)`
                : "none",
            maskImage: alwaysReveal
              ? "none"
              : isHovered
                ? `radial-gradient(circle ${spotlightRadius}px at ${pixelPos.x}px ${pixelPos.y}px, transparent 0%, transparent 68%, black 100%)`
                : "none",
          }}
        />

        {/* 2. REVEAL LAYER: Photorealistic Dark Hoodie Cover Image (`heroBannerCover.png`) */}
        <img
          src="/heroBannerCover.png"
          alt={`${name} in Dark Hoodie`}
          className="absolute inset-0 w-full h-full object-contain object-top pointer-events-none z-20 transition-opacity duration-300 drop-shadow-2xl"
          style={{
            opacity: alwaysReveal ? 1 : isHovered ? 1 : 0,
            WebkitMaskImage: alwaysReveal
              ? "none"
              : `radial-gradient(circle ${spotlightRadius}px at ${pixelPos.x}px ${pixelPos.y}px, black 0%, black 68%, transparent 100%)`,
            maskImage: alwaysReveal
              ? "none"
              : `radial-gradient(circle ${spotlightRadius}px at ${pixelPos.x}px ${pixelPos.y}px, black 0%, black 68%, transparent 100%)`,
          }}
        />

        {/* 3. DYNAMIC APERTURE SPOTLIGHT RING & RETICLE (Follows cursor on hover) */}
        {isHovered && !alwaysReveal && (
          <div
            className="absolute pointer-events-none z-30 transition-transform duration-75 ease-out"
            style={{
              left: `${pixelPos.x}px`,
              top: `${pixelPos.y}px`,
              transform: "translate(-50%, -50%)",
            }}
          >
            {/* Spotlight outer glowing aperture halo */}
            <div
              className="rounded-full border border-white/60 dark:border-cyan-400/70 shadow-[0_0_35px_rgba(255,255,255,0.45)] dark:shadow-[0_0_35px_rgba(6,182,212,0.6)] animate-pulse"
              style={{
                width: `${spotlightRadius * 1.8}px`,
                height: `${spotlightRadius * 1.8}px`,
                transform: "translate(-50%, -50%)",
                position: "absolute",
                top: 0,
                left: 0,
              }}
            />

            {/* Target Crosshair & HUD Tag */}
            <div className="relative -top-3.5 -left-3.5 w-7 h-7 flex items-center justify-center">
              <Crosshair className="w-6 h-6 text-white dark:text-cyan-300 drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]" />
              <span className="absolute left-7 top-0 text-[10px] font-mono font-bold tracking-wider text-white bg-black/85 px-2 py-0.5 rounded-md border border-white/20 whitespace-nowrap shadow-xl">
                HOOD_SCAN // {Math.round(mousePos.x)}:{Math.round(mousePos.y)}
              </span>
            </div>
          </div>
        )}

        {/* 4. FLOATING HUD CONTROLS (Borderless, pure floating glass) */}
        <div className="absolute top-2 left-2 right-2 z-40 flex items-center justify-between pointer-events-auto">
          {/* Status Chip */}
          <div className="hidden items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-mono font-medium bg-black/60 backdrop-blur-md border border-white/10 dark:border-white/20 text-white shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <Terminal className="w-3.5 h-3.5 text-zinc-300" />
            <span>
              BLACK_HOODIE //{" "}
              {isHovered || alwaysReveal ? "ENGAGED" : "HOVER TO REVEAL"}
            </span>
          </div>

          {/* Toggle Lock Hood Button */}
          <button
            onClick={() => setAlwaysReveal(!alwaysReveal)}
            type="button"
            title="Toggle always-on dark hoodie"
            className={`hidden px-3 py-1.5 rounded-full text-[11px] font-mono font-medium items-center gap-1.5 transition-all shadow-lg ${
              alwaysReveal
                ? "bg-zinc-100 text-black font-bold border border-white"
                : "bg-black/60 hover:bg-black/80 text-zinc-200 border border-white/10 hover:border-white/30 backdrop-blur-md"
            }`}
          >
            <Scan className="w-3.5 h-3.5" />
            <span>{alwaysReveal ? "HOOD LOCKED" : "LOCK HOOD"}</span>
          </button>
        </div>

        {/* 5. FLOATING BOTTOM HINT */}
        <div className="absolute bottom-2 left-2 right-2 z-40 flex items-end justify-between pointer-events-none">
          <div className="hidden bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 text-white shadow-xl">
            <div className="text-xs font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>{name}</span>
              <span className="text-[10px] font-mono text-zinc-400 font-normal">
                [{location}]
              </span>
            </div>
          </div>

          <div className="hidden items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono text-zinc-300">
            <Eye className="w-3.5 h-3.5 text-zinc-300" />
            <span>
              {alwaysReveal ? "Hood locked" : "Hover / drag face to scan"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
