"use client";

/**
 * Starfield — a quiet, cinematic background layer.
 *
 * Deliberately lightweight: a single <canvas>, a few dozen points,
 * no external particle library. Three depth bands drift at
 * different, very slow speeds (parallax illusion via speed, not
 * scroll-linked transforms — this never touches scroll position,
 * so it can't fight the Reveal system or feel like parallax scroll
 * hijacking). A handful of points get a slow twinkle. A few near
 * points are tinted with the accent color instead of white.
 *
 * Respects prefers-reduced-motion (render once, static, no RAF loop)
 * and reduces particle count on narrow viewports.
 */

import { useEffect, useRef } from "react";

const BAND_SPEED = [0.0025, 0.006, 0.012]; // px/frame-equivalent, very slow
const BAND_OPACITY = [0.35, 0.5, 0.65];

function buildStars(width, height, count) {
  const stars = [];
  for (let i = 0; i < count; i++) {
    const band = i % 3;
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: band === 2 ? 1.4 : band === 1 ? 1 : 0.7,
      baseOpacity: BAND_OPACITY[band] * (0.6 + Math.random() * 0.4),
      band,
      twinkle: Math.random() < 0.18,
      twinklePhase: Math.random() * Math.PI * 2,
      accent: Math.random() < 0.08,
    });
  }
  return stars;
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

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let stars = [];
    let rafId = 0;
    let t = 0;

    function resize() {
      const parent = canvas.parentElement;
      width = parent ? parent.clientWidth : window.innerWidth;
      height = parent ? parent.clientHeight : window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = isMobile ? 42 : 90;
      stars = buildStars(width, height, count);
      draw(); // paint immediately so there's no blank flash on resize
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      for (const s of stars) {
        let opacity = s.baseOpacity;
        if (s.twinkle && !reduced) {
          opacity *=
            0.55 + 0.45 * Math.sin(t * 0.0006 + s.twinklePhase);
        }
        ctx.beginPath();
        ctx.fillStyle = s.accent
          ? `rgba(88, 101, 242, ${opacity})`
          : `rgba(232, 234, 237, ${opacity})`;
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function step() {
      t += 16.7; // approximate ms per frame, independent of actual rAF cadence
      for (const s of stars) {
        s.y += BAND_SPEED[s.band];
        if (s.y > height + 4) {
          s.y = -4;
          s.x = Math.random() * width;
        }
      }
      draw();
      rafId = requestAnimationFrame(step);
    }

    resize();
    window.addEventListener("resize", resize);

    if (!reduced) {
      rafId = requestAnimationFrame(step);
    }

    return () => {
      window.removeEventListener("resize", resize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="di-starfield" aria-hidden="true">
      <canvas ref={canvasRef} className="di-starfield__canvas" />
    </div>
  );
}
