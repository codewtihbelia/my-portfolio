import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Download, Mail, ChevronDown } from "lucide-react";
import { Profile } from "../../types";
import { InteractiveHackerHero } from "../ui/InteractiveHackerHero";

interface ScrollHeroSectionProps {
  profile: Profile | null;
  activeResumeUrl: string;
  handleResumeDownload: (e: React.MouseEvent) => void;
}

export const ScrollHeroSection: React.FC<ScrollHeroSectionProps> = ({
  profile,
  activeResumeUrl,
  handleResumeDownload,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setIsReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (isReducedMotion) return;

    let rafId: number;
    const calculateProgress = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const scrollDistance = rect.height - window.innerHeight;
      if (scrollDistance <= 0) return;

      const currentScroll = -rect.top;
      const progress = Math.min(1, Math.max(0, currentScroll / scrollDistance));
      setScrollProgress(progress);
    };

    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(calculateProgress);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    calculateProgress();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, [isReducedMotion]);

  // Motion & Smoke Transition Math:
  // 1. Portrait Dissolution (Progress 0.0 -> 0.46)
  // - Kept full size at scale 1.0 (no resizing)
  // - Progressive misty gaussian blur: 0px -> 24px
  // - Opacity: 1.0 -> 0.0
  const portraitFade = isReducedMotion
    ? 1
    : Math.max(0, Math.min(1, 1 - scrollProgress / 0.46));
  const portraitBlur = isReducedMotion
    ? 0
    : Math.min(24, (scrollProgress / 0.42) * 24);
  const portraitPointerEvents: React.CSSProperties["pointerEvents"] =
    portraitFade > 0.15 ? "auto" : "none";

  // 2. Misty Vapor Smoke Clouds (Bell curve peaking at ~0.32, clearing by 0.62)
  let smokeIntensity = 0;
  if (!isReducedMotion) {
    if (scrollProgress <= 0.32) {
      // Billows in from 0.0 to 0.32
      smokeIntensity = Math.min(1, scrollProgress / 0.32);
    } else {
      // Clears out from 0.32 to 0.62
      smokeIntensity = Math.max(0, 1 - (scrollProgress - 0.32) / 0.3);
    }
  }

  // 3. Smooth Spring Pop for Top Intro & Typography (Progress 0.38 -> 0.78)
  const typographyRawProgress = isReducedMotion
    ? 1
    : Math.max(0, Math.min(1, (scrollProgress - 0.38) / 0.4));

  // Spring pop calculation: begins at 0.90 scale, emerges cleanly with a spring-like ease
  const typographyOpacity = typographyRawProgress;
  const typographyScale = isReducedMotion
    ? 1
    : 0.9 + 0.1 * Math.sin(typographyRawProgress * (Math.PI / 2));
  const typographyPointerEvents: React.CSSProperties["pointerEvents"] =
    typographyOpacity > 0.45 ? "auto" : "none";

  // Initial scroll discovery cue fades out on initial scroll
  const hintOpacity = isReducedMotion
    ? 0
    : Math.max(0, 1 - scrollProgress / 0.15);

  return (
    <section
      id="hero-section"
      ref={containerRef}
      className="relative w-full min-h-[195vh]"
    >
      {/* Pinned Sticky Viewport */}
      <div className="sticky top-14 sm:top-16 md:top-20 h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] w-full flex items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="relative w-full h-full flex items-center justify-center">
          {/* LAYER 1: Full-Sized Portrait (Zero downscaling, dissolves into mist on scroll) */}
          <div
            id="hero-avatar-card"
            className="absolute inset-0 flex flex-col items-center justify-center will-change-transform"
            style={{
              opacity: portraitFade,
              filter: portraitBlur > 0.1 ? `blur(${portraitBlur}px)` : "none",
              transform: "scale(1)",
              pointerEvents: portraitPointerEvents,
              visibility: portraitFade <= 0.001 ? "hidden" : "visible",
              transition: isReducedMotion
                ? "none"
                : "opacity 0.06s linear, filter 0.06s linear",
            }}
          >
            {/* Kept at original full width (max-w-[760px]) with user-preferred -mt-18 top alignment */}
            <div className="w-full max-w-190 mx-auto flex justify-center">
              <InteractiveHackerHero
                name={profile?.name || "Codewithbelia"}
                location={profile?.location || "Philippines"}
              />
            </div>
          </div>

          {/* LAYER 2: Atmospheric Misty Smoke Vapor Clouds (Billow over portrait, then dissipate) */}
          {smokeIntensity > 0.01 && (
            <div
              className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-25 transition-opacity duration-75"
              style={{ opacity: smokeIntensity * 0.9 }}
            >
              {/* Central dense misty plume */}
              <div
                className="absolute w-125 h-125 rounded-full blur-3xl will-change-transform bg-linear-to-t from-white/70 via-zinc-200/50 to-transparent dark:from-zinc-400/40 dark:via-zinc-600/25 dark:to-transparent"
                style={{
                  transform: `scale(${1 + scrollProgress * 0.6}) translate3d(0, -${scrollProgress * 50}px, 0)`,
                }}
              />
              {/* Left drifting vapor cloud */}
              <div
                className="absolute w-105 h-105 -left-8 sm:left-12 rounded-full blur-3xl will-change-transform bg-linear-to-tr from-cyan-100/40 via-white/50 to-transparent dark:from-cyan-950/45 dark:via-zinc-700/30 dark:to-transparent"
                style={{
                  transform: `scale(${1 + scrollProgress * 0.5}) translate3d(-${scrollProgress * 40}px, -${scrollProgress * 30}px, 0)`,
                }}
              />
              {/* Right drifting vapor cloud */}
              <div
                className="absolute w-105 h-105 -right-8 sm:right-12 rounded-full blur-3xl will-change-transform bg-linear-to-tl from-indigo-100/40 via-white/50 to-transparent dark:from-indigo-950/45 dark:via-zinc-700/30 dark:to-transparent"
                style={{
                  transform: `scale(${1 + scrollProgress * 0.5}) translate3d(${scrollProgress * 40}px, -${scrollProgress * 30}px, 0)`,
                }}
              />
              {/* Rising upper mist wreath */}
              <div
                className="absolute top-1/6 w-150 h-150 rounded-full blur-3xl will-change-transform bg-linear-to-b from-white/80 via-zinc-100/40 to-transparent dark:from-zinc-400/35 dark:via-zinc-800/20 dark:to-transparent"
                style={{
                  transform: `scale(${1 + scrollProgress * 0.7}) translate3d(0, -${scrollProgress * 70}px, 0)`,
                }}
              />
            </div>
          )}

          {/* LAYER 3: Top Intro & Typography (Pops in smoothly with spring easing as smoke clears) */}
          <div
            id="hero-typography-layer"
            className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-6 sm:space-y-8 will-change-transform max-w-4xl mx-auto px-4 z-30"
            style={{
              opacity: typographyOpacity,
              transform: `scale(${typographyScale}) translate3d(0, ${(1 - typographyRawProgress) * 16}px, 0)`,
              pointerEvents: typographyPointerEvents,
              visibility: typographyOpacity <= 0.001 ? "hidden" : "visible",
              transition: isReducedMotion
                ? "none"
                : "opacity 0.06s linear, transform 0.1s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            {/* Top Intro & Typography */}
            <div className="space-y-4 max-w-3xl mx-auto">
              {/* Availability Pill */}
              {profile?.availability && (
                <div
                  id="hero-availability-badge"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-medium bg-zinc-100 dark:bg-zinc-900/90 border border-zinc-200 dark:border-cyan-500/30 text-zinc-800 dark:text-cyan-300 shadow-sm"
                >
                  <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                  <span>{profile.availability}</span>
                </div>
              )}

              {/* Headline */}
              <h1
                id="hero-name-heading"
                className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.1]"
              >
                Hi, I'm{" "}
                <span className="bg-linear-to-r from-cyan-500 via-indigo-500 to-violet-500 bg-clip-text text-transparent">
                  {profile?.name || "Codewithbelia"}
                </span>
                .
              </h1>

              {/* Professional Title */}
              <p
                id="hero-professional-title"
                className="text-xl sm:text-2xl font-semibold text-zinc-700 dark:text-zinc-300 tracking-tight"
              >
                {profile?.professionalTitle ||
                  "Full-Stack Developer & Digital Solutions Builder"}
              </p>

              {/* Short Introduction */}
              <p
                id="hero-intro-text"
                className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed"
              >
                {profile?.shortIntroduction ||
                  "I design and develop modern, scalable, and user-focused digital solutions."}
              </p>
            </div>

            {/* Floating Glass CTA Action Dock */}
            <div className="pt-2 w-full flex justify-center">
              <div className="inline-flex flex-wrap items-center justify-center gap-3 p-2 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xl">
                <Link
                  to="/projects"
                  id="hero-cta-view-work"
                  className="px-6 py-3 rounded-xl bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-900 font-semibold text-sm inline-flex items-center gap-2 shadow-sm transition-all hover:gap-3"
                >
                  <span>View My Work</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                {activeResumeUrl ? (
                  <a
                    href={activeResumeUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    download
                    onClick={handleResumeDownload}
                    id="hero-cta-resume"
                    className="px-5 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold text-sm inline-flex items-center gap-2 border border-zinc-200 dark:border-zinc-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Resume</span>
                  </a>
                ) : (
                  <Link
                    to="/resume"
                    id="hero-cta-resume-link"
                    className="px-5 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold text-sm inline-flex items-center gap-2 border border-zinc-200 dark:border-zinc-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Resume</span>
                  </Link>
                )}

                <Link
                  to="/contact"
                  id="hero-cta-connect"
                  className="px-5 py-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-sm inline-flex items-center gap-2 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  <span>Let's Connect</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Initial Scroll Discovery Cue (Fades out immediately as user scrolls) */}
          {hintOpacity > 0.01 && (
            <div
              className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 pointer-events-none transition-opacity duration-150 z-30"
              style={{ opacity: hintOpacity }}
            >
              <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-400 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm px-2.5 py-0.5 rounded-full border border-zinc-200/60 dark:border-zinc-800/60 shadow-sm">
                Scroll to explore
              </span>
              <ChevronDown className="w-4 h-4 text-zinc-400 dark:text-zinc-500 animate-bounce" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
