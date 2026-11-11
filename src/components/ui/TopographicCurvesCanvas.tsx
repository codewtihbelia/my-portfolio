import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';

interface StandaloneBlob {
  baseXRatio: number;
  baseYRatio: number;
  radiusX: number;
  radiusY: number;
  rotation: number;
  speed: number;
  // Multi-harmonic frequencies for organic amoeba deformation (non-circular)
  h1: number;
  h2: number;
  h3: number;
  amp1: number;
  amp2: number;
  amp3: number;
  phase: number;
  opacity: number;
}

interface ContourCurve {
  // Array of normalized control points across the viewport
  points: Array<{ x: number; y: number }>;
  speed: number;
  waveAmp: number;
  waveFreq: number;
  phase: number;
  opacity: number;
}

interface AmbientGlowBlob {
  baseXRatio: number;
  baseYRatio: number;
  radius: number;
  speed: number;
  phase: number;
}

export const TopographicCurvesCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse coordinates with spring lerp
    const mouse = {
      targetX: -1000,
      targetY: -1000,
      currentX: -1000,
      currentY: -1000,
      active: false
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
      mouse.targetX = -1000;
      mouse.targetY = -1000;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    const handleResize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ====================================================================
    // 1. STANDALONE ORGANIC AMOEBA BLOBS (Single-layer contours, NO concentric circles)
    // Matches landonorris.com isolated organic loops (e.g. top-right amoeba)
    // ====================================================================
    const blobs: StandaloneBlob[] = [
      // Top-Right organic loop (directly matching landonorris.com upper-right amoeba)
      {
        baseXRatio: 0.88,
        baseYRatio: 0.18,
        radiusX: 130,
        radiusY: 95,
        rotation: 0.35,
        speed: 0.0006,
        h1: 2,
        h2: 3,
        h3: 5,
        amp1: 32,
        amp2: 20,
        amp3: 12,
        phase: 0.5,
        opacity: 0.55
      },
      // Left-side elongated organic contour (floating in left margin)
      {
        baseXRatio: 0.12,
        baseYRatio: 0.42,
        radiusX: 170,
        radiusY: 220,
        rotation: -0.25,
        speed: 0.0005,
        h1: 3,
        h2: 2,
        h3: 4,
        amp1: 45,
        amp2: 28,
        amp3: 16,
        phase: 1.8,
        opacity: 0.48
      },
      // Lower-right organic pool
      {
        baseXRatio: 0.82,
        baseYRatio: 0.78,
        radiusX: 160,
        radiusY: 130,
        rotation: 0.5,
        speed: 0.0007,
        h1: 2,
        h2: 4,
        h3: 3,
        amp1: 38,
        amp2: 24,
        amp3: 14,
        phase: 3.2,
        opacity: 0.45
      },
      // Bottom-left subtle organic loop
      {
        baseXRatio: 0.28,
        baseYRatio: 0.86,
        radiusX: 140,
        radiusY: 110,
        rotation: -0.4,
        speed: 0.00055,
        h1: 3,
        h2: 5,
        h3: 2,
        amp1: 34,
        amp2: 18,
        amp3: 10,
        phase: 4.7,
        opacity: 0.42
      },
      // Top-center gentle amoebic drift
      {
        baseXRatio: 0.48,
        baseYRatio: 0.10,
        radiusX: 180,
        radiusY: 115,
        rotation: 0.15,
        speed: 0.00065,
        h1: 4,
        h2: 2,
        h3: 3,
        amp1: 30,
        amp2: 22,
        amp3: 12,
        phase: 2.3,
        opacity: 0.38
      }
    ];

    // ====================================================================
    // 2. SWEEPING TOPOGRAPHIC CONTOUR LINES (Meandering elevation isolines, NOT straight stripes)
    // Curving across canvas with wide, natural topographic bends
    // ====================================================================
    const contours: ContourCurve[] = [
      // Top contour entering from upper-left and sweeping diagonally across toward bottom-right
      {
        points: [
          { x: -0.05, y: 0.12 },
          { x: 0.22, y: 0.28 },
          { x: 0.48, y: 0.22 },
          { x: 0.74, y: 0.45 },
          { x: 1.05, y: 0.52 }
        ],
        speed: 0.00045,
        waveAmp: 36,
        waveFreq: 2.2,
        phase: 0.2,
        opacity: 0.45
      },
      // Sweeping contour along right edge curving down and around bottom
      {
        points: [
          { x: 0.95, y: -0.05 },
          { x: 0.78, y: 0.32 },
          { x: 0.92, y: 0.58 },
          { x: 0.68, y: 0.82 },
          { x: 0.45, y: 1.05 }
        ],
        speed: 0.0004,
        waveAmp: 42,
        waveFreq: 1.8,
        phase: 1.5,
        opacity: 0.42
      },
      // Broad S-curve flowing through mid-left across bottom-center
      {
        points: [
          { x: -0.05, y: 0.68 },
          { x: 0.25, y: 0.52 },
          { x: 0.52, y: 0.72 },
          { x: 0.78, y: 0.62 },
          { x: 1.05, y: 0.88 }
        ],
        speed: 0.0005,
        waveAmp: 34,
        waveFreq: 2.5,
        phase: 2.8,
        opacity: 0.4
      },
      // Deep topographic boundary curve wrapping around upper-center
      {
        points: [
          { x: 0.15, y: -0.05 },
          { x: 0.35, y: 0.38 },
          { x: 0.62, y: 0.34 },
          { x: 0.85, y: 0.15 },
          { x: 1.05, y: 0.25 }
        ],
        speed: 0.00038,
        waveAmp: 30,
        waveFreq: 2.0,
        phase: 4.1,
        opacity: 0.36
      }
    ];

    // ====================================================================
    // 3. SOFT AMBIENT FLUID BLOBS (Faint translucent patches matching landonorris.com lower-left)
    // ====================================================================
    const ambientBlobs: AmbientGlowBlob[] = [
      { baseXRatio: 0.15, baseYRatio: 0.72, radius: 240, speed: 0.0004, phase: 0.0 },
      { baseXRatio: 0.85, baseYRatio: 0.25, radius: 260, speed: 0.00035, phase: 2.4 },
      { baseXRatio: 0.55, baseYRatio: 0.85, radius: 200, speed: 0.00045, phase: 4.2 }
    ];

    let time = 0;

    // Helper: Draw smooth closed spline through points using Catmull-Rom midpoints
    const drawSmoothClosedCurve = (points: Array<{ x: number; y: number }>) => {
      const len = points.length;
      if (len < 3) return;

      ctx.beginPath();
      const firstMidX = (points[len - 1].x + points[0].x) / 2;
      const firstMidY = (points[len - 1].y + points[0].y) / 2;
      ctx.moveTo(firstMidX, firstMidY);

      for (let i = 0; i < len; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % len];
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
      }
      ctx.closePath();
    };

    // Helper: Draw smooth open spline through arbitrary control points
    const drawSmoothOpenCurve = (points: Array<{ x: number; y: number }>) => {
      const len = points.length;
      if (len < 2) return;

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);

      for (let i = 0; i < len - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const midX = (p0.x + p1.x) / 2;
        const midY = (p0.y + p1.y) / 2;
        ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
      }
      ctx.lineTo(points[len - 1].x, points[len - 1].y);
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse spring interpolation
      if (mouse.active) {
        mouse.currentX += (mouse.targetX - mouse.currentX) * 0.08;
        mouse.currentY += (mouse.targetY - mouse.currentY) * 0.08;
      } else {
        mouse.currentX += (-1000 - mouse.currentX) * 0.08;
        mouse.currentY += (-1000 - mouse.currentY) * 0.08;
      }

      const isDark = document.documentElement.classList.contains('dark') || theme === 'dark';
      const warpRadius = 240;

      // ------------------------------------------------------------------
      // STEP 1: RENDER SOFT AMBIENT FLUID BLOBS (Subtle background depth)
      // ------------------------------------------------------------------
      for (const ab of ambientBlobs) {
        const abTime = time * ab.speed * 1000 + ab.phase;
        const cx = width * ab.baseXRatio + Math.cos(abTime) * 35;
        const cy = height * ab.baseYRatio + Math.sin(abTime * 0.8) * 30;

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, ab.radius);
        if (isDark) {
          grad.addColorStop(0, 'rgba(99, 102, 241, 0.035)');
          grad.addColorStop(0.6, 'rgba(79, 70, 229, 0.015)');
          grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
        } else {
          grad.addColorStop(0, 'rgba(161, 161, 170, 0.055)');
          grad.addColorStop(0.6, 'rgba(212, 212, 216, 0.025)');
          grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, ab.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // ------------------------------------------------------------------
      // STEP 2: RENDER STANDALONE ORGANIC AMOEBA BLOBS (Single-layer contours, NO concentric rings)
      // ------------------------------------------------------------------
      for (const blob of blobs) {
        const blobTime = time * blob.speed * 1200 + blob.phase;
        // Subtle drift of blob center
        const cx = width * blob.baseXRatio + Math.sin(blobTime * 0.7) * 20;
        const cy = height * blob.baseYRatio + Math.cos(blobTime * 0.5) * 18;

        const numPoints = 48;
        const points: Array<{ x: number; y: number }> = [];

        const cosRot = Math.cos(blob.rotation);
        const sinRot = Math.sin(blob.rotation);

        for (let i = 0; i < numPoints; i++) {
          const angle = (i / numPoints) * Math.PI * 2;

          // Multi-harmonic amoeba modulation (asymmetric, irregular liquid shape)
          const m1 = Math.sin(angle * blob.h1 + blobTime) * blob.amp1;
          const m2 = Math.cos(angle * blob.h2 - blobTime * 0.85) * blob.amp2;
          const m3 = Math.sin(angle * blob.h3 + blobTime * 1.25) * blob.amp3;

          // Non-uniform radii along axes + multi-wave deformation
          const rx = blob.radiusX + m1 + m2 + m3;
          const ry = blob.radiusY + (m1 * 0.8) - (m2 * 0.6) + m3;

          // Local ellipse coordinates
          const localX = Math.cos(angle) * rx;
          const localY = Math.sin(angle) * ry;

          // Rotated world coordinates
          let ptX = cx + localX * cosRot - localY * sinRot;
          let ptY = cy + localX * sinRot + localY * cosRot;

          // Interactive cursor ripple
          const dx = ptX - mouse.currentX;
          const dy = ptY - mouse.currentY;
          const dist = Math.hypot(dx, dy);

          if (dist < warpRadius) {
            const force = Math.cos((dist / warpRadius) * (Math.PI / 2));
            const push = force * 38 * (1 - dist / warpRadius);
            ptX += (dx / (dist || 1)) * push;
            ptY += (dy / (dist || 1)) * push;
          }

          points.push({ x: ptX, y: ptY });
        }

        drawSmoothClosedCurve(points);

        // Clean, delicate 1px contour line styling matching landonorris.com
        if (isDark) {
          ctx.strokeStyle = `rgba(148, 163, 184, ${blob.opacity * 0.32})`;
          ctx.lineWidth = 1.15;
        } else {
          ctx.strokeStyle = `rgba(161, 161, 170, ${blob.opacity * 0.52})`;
          ctx.lineWidth = 1.2;
        }

        ctx.stroke();
      }

      // ------------------------------------------------------------------
      // STEP 3: RENDER SWEEPING TOPOGRAPHIC CONTOURS (Curved elevation isolines)
      // ------------------------------------------------------------------
      for (const contour of contours) {
        const cTime = time * contour.speed * 1200 + contour.phase;
        const interpolatedPoints: Array<{ x: number; y: number }> = [];

        // Densify control points along the curve with organic normal displacement
        const steps = 44;
        const pts = contour.points;

        for (let s = 0; s <= steps; s++) {
          const t = s / steps;
          // Spline segment calculation
          const totalSegments = pts.length - 1;
          const segmentIndex = Math.min(Math.floor(t * totalSegments), totalSegments - 1);
          const segmentT = (t * totalSegments) - segmentIndex;

          const p0 = pts[Math.max(0, segmentIndex - 1)];
          const p1 = pts[segmentIndex];
          const p2 = pts[Math.min(pts.length - 1, segmentIndex + 1)];
          const p3 = pts[Math.min(pts.length - 1, segmentIndex + 2)];

          // Catmull-Rom cubic interpolation for ultra-smooth non-linear path
          const t2 = segmentT * segmentT;
          const t3 = t2 * segmentT;

          let px = 0.5 * (
            (2 * p1.x) +
            (-p0.x + p2.x) * segmentT +
            (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
            (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
          ) * width;

          let py = 0.5 * (
            (2 * p1.y) +
            (-p0.y + p2.y) * segmentT +
            (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
            (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
          ) * height;

          // Organic undulation along the path
          const wave = Math.sin(t * Math.PI * contour.waveFreq + cTime) * contour.waveAmp +
                       Math.cos(t * Math.PI * 3.5 - cTime * 0.7) * (contour.waveAmp * 0.35);

          py += wave;

          // Interactive cursor ripple
          const dx = px - mouse.currentX;
          const dy = py - mouse.currentY;
          const dist = Math.hypot(dx, dy);

          if (dist < warpRadius) {
            const force = Math.cos((dist / warpRadius) * (Math.PI / 2));
            const push = force * 32 * (1 - dist / warpRadius);
            px += (dx / (dist || 1)) * push;
            py += (dy / (dist || 1)) * push;
          }

          interpolatedPoints.push({ x: px, y: py });
        }

        drawSmoothOpenCurve(interpolatedPoints);

        if (isDark) {
          ctx.strokeStyle = `rgba(99, 102, 241, ${contour.opacity * 0.26})`;
          ctx.lineWidth = 1.15;
        } else {
          ctx.strokeStyle = `rgba(161, 161, 170, ${contour.opacity * 0.5})`;
          ctx.lineWidth = 1.2;
        }

        ctx.stroke();
      }

      time += 0.005;

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationFrameId);
      } else if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [theme]);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden transition-opacity duration-700 opacity-90"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
    </div>
  );
};
