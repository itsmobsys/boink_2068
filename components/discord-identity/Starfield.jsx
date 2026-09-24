"use client";

/**
 * Starfield — a quiet, cinematic background layer.
 *
 * Deliberately lightweight: a single <canvas>, ~100 points, no
 * external particle library. Four depth bands drift at different,
 * very slow speeds (parallax illusion via speed, not scroll-linked
 * transforms — this never touches scroll position, so it can't
 * fight the Reveal system or feel like parallax scroll hijacking).
 * A handful of points get a slow twinkle. Near points are tinted
 * with the brand hues (accent indigo + AI-group violet) instead of
 * white.
 *
 * Depth cues on top of the base field, all still canvas-only:
 * - Two soft nebula blobs (radial gradients, same two brand hues)
 *   drifting independently, far slower than the stars, for a hint
 * of color and scale behind the points.
 * - Cursor parallax: near bands shift more than far bands toward
 *   the pointer, offset is lerped (never snaps) so it reads as
 *   depth, not tracking. Pointer-only — no effect from touch, and
 *   fully skipped under reduced motion.
 * - A rare, subtle shooting star: one quick streak every so often,
 *   never more than one on screen, off entirely under reduced
 *   motion.
 *
 * Respects prefers-reduced-motion (render once, static, no RAF
 * loop, no parallax, no shooting stars) and reduces particle count
 * on narrow viewports.
 */

import { useEffect, useRef } from "react";

const BAND_COUNT = 4;
const BAND_SPEED = [0.0018, 0.0038, 0.0075, 0.013]; // px/frame-equivalent, very slow
// Visibility floors (raised from 0.28/0.4/0.55/0.7 + sub-1px radii:
// pixel census found the field but naked eyes read flat black on
// #08090c — these keep it quiet yet perceptible on real monitors).
const BAND_OPACITY = [0.55, 0.7, 0.85, 1.0];
const BAND_RADIUS = [1.0, 1.4, 1.8, 2.2];
const BAND_PARALLAX = [0.006, 0.014, 0.026, 0.044]; // fraction of pointer offset, far → near

// Brand hues only — same two colors used for the nebula blobs, so
// tinted stars and nebula read as one palette, not a new one.
const ACCENT_RGB = "88, 101, 242"; // --di-accent
const AI_RGB = "177, 138, 255"; // --di-group-ai

function buildStars(width, height, count) {
  const stars = [];
  for (let i = 0; i < count; i++) {
    const band = i % BAND_COUNT;
    const tinted = Math.random() < 0.1;
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: BAND_RADIUS[band],
      baseOpacity: BAND_OPACITY[band] * (0.8 + Math.random() * 0.2),
      band,
      twinkle: Math.random() < 0.18,
      twinklePhase: Math.random() * Math.PI * 2,
      rgb: tinted ? (Math.random() < 0.5 ? ACCENT_RGB : AI_RGB) : "232, 234, 237",
    });
  }
  return stars;
}

function buildNebulae(width, height) {
  return [
    {
      x: width * 0.22,
      y: height * 0.3,
      r: Math.max(width, height) * 0.55,
      rgb: ACCENT_RGB,
      opacity: 0.09,
      dx: 0.0015,
      dy: 0.0009,
      phase: 0,
    },
    {
      x: width * 0.78,
      y: height * 0.68,
      r: Math.max(width, height) * 0.5,
      rgb: AI_RGB,
      opacity: 0.07,
      dx: -0.0011,
      dy: -0.0007,
      phase: Math.PI,
    },
  ];
}

function makeShootingStar(width, height) {
  // Enters from a random point in the upper half, travels down-right.
  const x = Math.random() * width * 0.6;
  const y = Math.random() * height * 0.35;
  const angle = (18 + Math.random() * 10) * (Math.PI / 180);
  const speed = 11 + Math.random() * 5;
  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: 0,
    maxLife: 26 + Math.random() * 10, // frames
  };
}

export function Starfield() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const isMobile = window.innerWidth < 640;
    const canHover =
      !reduced &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let stars = [];
    let nebulae = [];
    let rafId = 0;
    let t = 0;

    // Pointer offset from viewport center, in px, smoothed toward the
    // real pointer position each frame rather than snapping to it.
    let pointerX = 0;
    let pointerY = 0;
    let pointerTargetX = 0;
    let pointerTargetY = 0;

    let shootingStar = null;
    let nextShootAt = reduced ? Infinity : 240 + Math.random() * 360; // frames until first streak

    function resize() {
      const parent = canvas.parentElement;
      width = parent ? parent.clientWidth : window.innerWidth;
      height = parent ? parent.clientHeight : window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = isMobile ? 55 : 110;
      stars = buildStars(width, height, count);
      nebulae = buildNebulae(width, height);
      draw(); // paint immediately so there's no blank flash on resize
    }

    function handlePointerMove(e) {
      pointerTargetX = e.clientX - width / 2;
      pointerTargetY = e.clientY - height / 2;
    }

    function drawNebulae() {
      for (const n of nebulae) {
        const nx = n.x + Math.sin(t * n.dx + n.phase) * width * 0.06;
        const ny = n.y + Math.cos(t * n.dy + n.phase) * height * 0.06;
        const gradient = ctx.createRadialGradient(nx, ny, 0, nx, ny, n.r);
        gradient.addColorStop(0, `rgba(${n.rgb}, ${n.opacity})`);
        gradient.addColorStop(1, `rgba(${n.rgb}, 0)`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }
    }

    function drawShootingStar() {
      if (!shootingStar) return;
      const s = shootingStar;
      const progress = s.life / s.maxLife;
      const fade = progress < 0.15 ? progress / 0.15 : 1 - (progress - 0.15) / 0.85;
      const tailX = s.x - s.vx * 3.2;
      const tailY = s.y - s.vy * 3.2;

      const gradient = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
      gradient.addColorStop(0, "rgba(232, 234, 237, 0)");
      gradient.addColorStop(1, `rgba(232, 234, 237, ${0.85 * fade})`);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(s.x, s.y);
      ctx.stroke();
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      drawNebulae();

      for (const s of stars) {
        let opacity = s.baseOpacity;
        if (s.twinkle && !reduced) {
          opacity *= 0.8 + 0.2 * Math.sin(t * 0.0006 + s.twinklePhase);
        }
        const px = canHover ? pointerX * BAND_PARALLAX[s.band] : 0;
        const py = canHover ? pointerY * BAND_PARALLAX[s.band] : 0;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${s.rgb}, ${opacity})`;
        ctx.arc(s.x + px, s.y + py, s.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      drawShootingStar();
    }

    function step() {
      t += 16.7; // approximate ms per frame, independent of actual rAF cadence

      pointerX += (pointerTargetX - pointerX) * 0.04;
      pointerY += (pointerTargetY - pointerY) * 0.04;

      for (const s of stars) {
        s.y += BAND_SPEED[s.band];
        if (s.y > height + 4) {
          s.y = -4;
          s.x = Math.random() * width;
        }
      }

      if (shootingStar) {
        shootingStar.x += shootingStar.vx;
        shootingStar.y += shootingStar.vy;
        shootingStar.life += 1;
        if (
          shootingStar.life >= shootingStar.maxLife ||
          shootingStar.x > width + 40 ||
          shootingStar.y > height + 40
        ) {
          shootingStar = null;
          nextShootAt = t / 16.7 + 420 + Math.random() * 600;
        }
      } else if (t / 16.7 >= nextShootAt) {
        shootingStar = makeShootingStar(width, height);
      }

      draw();
      rafId = requestAnimationFrame(step);
    }

    resize();
    window.addEventListener("resize", resize);
    if (canHover) {
      window.addEventListener("pointermove", handlePointerMove);
    }

    if (!reduced) {
      rafId = requestAnimationFrame(step);
    }

    return () => {
      window.removeEventListener("resize", resize);
      if (canHover) {
        window.removeEventListener("pointermove", handlePointerMove);
      }
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="di-starfield" aria-hidden="true">
      <canvas ref={canvasRef} className="di-starfield__canvas" />
    </div>
  );
}
