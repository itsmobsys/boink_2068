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
 * - A tiny black hole with a dark event horizon, rotating accretion
 *   disk, lensing halo, and orbiting particles — always visible but
 *   deliberately small enough to stay atmospheric.
 * - A small satellite on the opposite side bobs gently, rolls, and
 *   blinks its signal beacon so the composition feels inhabited.
 * - A bright shooting star crosses the upper field every two seconds,
 *   fading from a sharp glow into a soft tail and back out.
 *
 * Respects prefers-reduced-motion (render once, static, no RAF
 * loop, no parallax, no shooting stars) unless the visitor explicitly
 * enables the motion control in the navigation, and reduces particle
 * count on narrow viewports.
 */

import { useEffect, useRef } from "react";

const BAND_COUNT = 4;
const BAND_SPEED = [0.0032, 0.0064, 0.0115, 0.019]; // px/frame-equivalent, gentle drift
const SHOOT_INTERVAL_MS = 2000; // one bright crossing every two seconds
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
    const tinted = Math.random() < 0.14;
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: BAND_RADIUS[band],
      baseOpacity: BAND_OPACITY[band] * (0.8 + Math.random() * 0.2),
      band,
      twinkle: Math.random() < 0.38,
      sparkle: Math.random() < 0.12,
      glow: Math.random() < 0.2,
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
    size: 1.2 + Math.random() * 1.2,
    rgb: Math.random() < 0.25 ? "103, 232, 209" : "232, 234, 237",
  };
}

export function Starfield() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const motionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );
    const rootMotion = document
      .querySelector('[data-scope="discord-identity"]')
      ?.dataset.motion;
    let motionEnabled =
      rootMotion === "on"
        ? true
        : rootMotion === "off"
          ? false
          : !motionQuery.matches;
    let reduced = !motionEnabled;
    const isMobile = window.innerWidth < 640;
    const canHover =
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
    let nextShootAt = motionEnabled
      ? performance.now() + SHOOT_INTERVAL_MS
      : Infinity;
    const blackHole = { x: 0, y: 0, radius: 0, tilt: -0.24 };
    const satellite = { x: 0, y: 0, radius: 0, tilt: -0.12 };

    function setMotionEnabled(next) {
      const enabled = Boolean(next);
      if (enabled === motionEnabled) {
        draw();
        return;
      }

      motionEnabled = enabled;
      reduced = !enabled;

      if (enabled) {
        shootingStar = null;
        nextShootAt = performance.now() + SHOOT_INTERVAL_MS;
        if (!rafId) rafId = requestAnimationFrame(step);
      } else {
        shootingStar = null;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = 0;
        draw();
      }
    }

    function handleMotionPreference(event) {
      if (typeof event.detail?.enabled === "boolean") {
        setMotionEnabled(event.detail.enabled);
      }
    }

    function resize() {
      const parent = canvas.parentElement;
      width = parent ? parent.clientWidth : window.innerWidth;
      height = parent ? parent.clientHeight : window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = isMobile ? 68 : 128;
      stars = buildStars(width, height, count);
      nebulae = buildNebulae(width, height);
      blackHole.x = width * (isMobile ? 0.8 : 0.82);
      blackHole.y = height * (isMobile ? 0.2 : 0.22);
      blackHole.radius = Math.max(34, Math.min(86, Math.min(width, height) * 0.075));
      blackHole.tilt = isMobile ? -0.34 : -0.24;
      satellite.x = width * (isMobile ? 0.2 : 0.15);
      satellite.y = height * (isMobile ? 0.66 : 0.62);
      satellite.radius = Math.max(18, Math.min(36, Math.min(width, height) * 0.035));
      satellite.tilt = isMobile ? -0.08 : -0.12;
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

    function drawSatellite() {
      const { x: baseX, y: baseY, radius: r, tilt } = satellite;
      if (!r) return;

      const bob = reduced ? 0 : Math.sin(t * 0.00115) * r * 1.35;
      const drift = reduced ? 0 : Math.sin(t * 0.00042 + 1.4) * r * 0.32;
      const roll = tilt + (reduced ? 0 : Math.sin(t * 0.0007) * 0.075);
      const pulse = 0.5 + 0.5 * Math.sin(t * 0.0018 + 0.8);
      const x = baseX + drift;
      const y = baseY + bob;

      ctx.save();
      ctx.globalCompositeOperation = "screen";

      // A restrained halo keeps the satellite discoverable against the dark
      // field without turning it into a second hero object.
      const glowRadius = r * (3.2 + pulse * 0.35);
      const glow = ctx.createRadialGradient(x, y, r * 0.2, x, y, glowRadius);
      glow.addColorStop(0, `rgba(103, 232, 209, ${0.12 + pulse * 0.035})`);
      glow.addColorStop(0.35, `rgba(139, 125, 255, ${0.07 + pulse * 0.025})`);
      glow.addColorStop(1, "rgba(139, 125, 255, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      // A faint orbit path makes the up/down motion feel like a deliberate
      // flight path rather than a random floating decoration.
      ctx.strokeStyle = `rgba(103, 232, 209, ${0.1 + pulse * 0.05})`;
      ctx.lineWidth = 0.8;
      ctx.setLineDash([r * 0.12, r * 0.48]);
      ctx.beginPath();
      ctx.ellipse(baseX, baseY, r * 2.45, r * 0.78, tilt, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.translate(x, y);
      ctx.rotate(roll);
      ctx.globalCompositeOperation = "source-over";

      const panelWidth = r * 1.38;
      const panelHeight = r * 0.7;
      const panelOffset = r * 0.88;
      const panelGradient = ctx.createLinearGradient(-panelOffset - panelWidth, 0, panelOffset + panelWidth, 0);
      panelGradient.addColorStop(0, "#101a38");
      panelGradient.addColorStop(0.45, "#263c73");
      panelGradient.addColorStop(0.55, "#1b2d5b");
      panelGradient.addColorStop(1, "#0d1631");
      ctx.fillStyle = panelGradient;
      ctx.strokeStyle = "rgba(103, 232, 209, 0.52)";
      ctx.lineWidth = Math.max(0.7, r * 0.035);

      for (const direction of [-1, 1]) {
        const panelX = direction < 0 ? -panelOffset - panelWidth : panelOffset;
        ctx.fillRect(panelX, -panelHeight / 2, panelWidth, panelHeight);
        ctx.strokeRect(panelX, -panelHeight / 2, panelWidth, panelHeight);
        ctx.strokeStyle = "rgba(157, 170, 204, 0.26)";
        ctx.lineWidth = 0.55;
        for (let cell = 1; cell < 4; cell += 1) {
          const cellX = panelX + (panelWidth / 4) * cell;
          ctx.beginPath();
          ctx.moveTo(cellX, -panelHeight / 2);
          ctx.lineTo(cellX, panelHeight / 2);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(panelX, 0);
        ctx.lineTo(panelX + panelWidth, 0);
        ctx.stroke();
        ctx.strokeStyle = "rgba(103, 232, 209, 0.52)";
        ctx.lineWidth = Math.max(0.7, r * 0.035);
      }

      // Central bus, antenna, and a tiny warm beacon.
      const bodyGradient = ctx.createLinearGradient(0, -r * 0.72, 0, r * 0.72);
      bodyGradient.addColorStop(0, "#d9ddff");
      bodyGradient.addColorStop(0.28, "#8189b7");
      bodyGradient.addColorStop(0.7, "#252d4d");
      bodyGradient.addColorStop(1, "#11172c");
      ctx.fillStyle = bodyGradient;
      ctx.strokeStyle = "rgba(225, 229, 255, 0.7)";
      ctx.lineWidth = Math.max(0.75, r * 0.04);
      ctx.beginPath();
      ctx.roundRect(-r * 0.42, -r * 0.66, r * 0.84, r * 1.32, r * 0.16);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = "rgba(225, 229, 255, 0.72)";
      ctx.lineWidth = Math.max(0.65, r * 0.035);
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.66);
      ctx.lineTo(0, -r * 1.16);
      ctx.stroke();
      ctx.fillStyle = "#b9c1ef";
      ctx.beginPath();
      ctx.arc(0, -r * 1.2, r * 0.1, 0, Math.PI * 2);
      ctx.fill();

      const beaconAlpha = reduced ? 0.85 : Math.sin(t * 0.009) > 0.1 ? 1 : 0.24;
      const beaconGlow = ctx.createRadialGradient(0, r * 0.38, 0, 0, r * 0.38, r * 0.5);
      beaconGlow.addColorStop(0, `rgba(255, 125, 151, ${0.9 * beaconAlpha})`);
      beaconGlow.addColorStop(0.25, `rgba(255, 125, 151, ${0.32 * beaconAlpha})`);
      beaconGlow.addColorStop(1, "rgba(255, 125, 151, 0)");
      ctx.fillStyle = beaconGlow;
      ctx.beginPath();
      ctx.arc(0, r * 0.38, r * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255, 190, 204, ${beaconAlpha})`;
      ctx.beginPath();
      ctx.arc(0, r * 0.38, Math.max(0.8, r * 0.09), 0, Math.PI * 2);
      ctx.fill();

      // Two tiny signal arcs make the satellite feel connected to the same
      // living signal system as the rest of the background.
      ctx.strokeStyle = `rgba(103, 232, 209, ${0.22 + pulse * 0.18})`;
      ctx.lineWidth = Math.max(0.6, r * 0.03);
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.02, -0.85, 0.85);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.18, -0.7, 0.7);
      ctx.stroke();

      // Expanding signal rings make the bobbing motion easier to read and
      // add a second, slower rhythm to the satellite's beacon.
      if (!reduced) {
        const signalPhase = (t * 0.00052) % 1;
        for (let index = 0; index < 2; index += 1) {
          const phase = (signalPhase + index * 0.5) % 1;
          const ringRadius = r * (1.55 + phase * 2.6);
          const ringAlpha = Math.sin(phase * Math.PI) * 0.16;
          ctx.strokeStyle = `rgba(103, 232, 209, ${ringAlpha})`;
          ctx.lineWidth = Math.max(0.55, r * 0.025);
          ctx.beginPath();
          ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    function drawBlackHole() {
      const { x, y, radius: r, tilt } = blackHole;
      if (!r) return;

      const pulse = 0.5 + 0.5 * Math.sin(t * 0.0011);
      const spin = t * 0.00042;
      const cosTilt = Math.cos(tilt);
      const sinTilt = Math.sin(tilt);

      ctx.save();
      ctx.globalCompositeOperation = "screen";

      // A wide gravitational glow makes the object readable without turning
      // the whole background into a bright object.
      const glowRadius = r * (3.1 + pulse * 0.16);
      const glow = ctx.createRadialGradient(x, y, r * 0.25, x, y, glowRadius);
      glow.addColorStop(0, `rgba(139, 125, 255, ${0.12 + pulse * 0.04})`);
      glow.addColorStop(0.36, `rgba(103, 232, 209, ${0.09 + pulse * 0.035})`);
      glow.addColorStop(0.7, "rgba(101, 91, 220, 0.035)");
      glow.addColorStop(1, "rgba(101, 91, 220, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      // The tilted disk is drawn in a flattened coordinate system so its
      // hot inner edge and transparent outer edge read as a real accretion
      // disk rather than a flat neon ring.
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(tilt);
      ctx.scale(1, 0.29);
      ctx.rotate(spin);
      const disk = ctx.createRadialGradient(0, 0, r * 0.38, 0, 0, r * 2.75);
      disk.addColorStop(0, "rgba(0, 0, 0, 0)");
      disk.addColorStop(0.27, `rgba(103, 232, 209, ${0.035 + pulse * 0.025})`);
      disk.addColorStop(0.46, `rgba(184, 169, 255, ${0.18 + pulse * 0.08})`);
      disk.addColorStop(0.57, `rgba(103, 232, 209, ${0.3 + pulse * 0.1})`);
      disk.addColorStop(0.7, "rgba(139, 125, 255, 0.08)");
      disk.addColorStop(1, "rgba(139, 125, 255, 0)");
      ctx.fillStyle = disk;
      ctx.beginPath();
      ctx.arc(0, 0, r * 2.75, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Two offset, dashed lensing rings imply light bending around the
      // horizon and give the small object a living mechanical rhythm.
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(tilt);
      ctx.scale(1, 0.23);
      ctx.rotate(-spin * 1.35);
      ctx.strokeStyle = `rgba(185, 175, 255, ${0.12 + pulse * 0.06})`;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([r * 0.18, r * 0.48]);
      ctx.beginPath();
      ctx.arc(0, 0, r * 2.08, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "rgba(103, 232, 209, 0.18)";
      ctx.setLineDash([r * 0.08, r * 0.7]);
      ctx.beginPath();
      ctx.arc(0, 0, r * 2.45, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Tiny particles orbit independently from the disk's main rotation.
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      for (let i = 0; i < 16; i += 1) {
        const angle = spin * (1.6 + (i % 3) * 0.08) + (i / 16) * Math.PI * 2;
        const orbit = r * (1.55 + (i % 4) * 0.22);
        const localX = Math.cos(angle) * orbit;
        const localY = Math.sin(angle) * orbit * 0.34;
        const px = x + localX * cosTilt - localY * sinTilt;
        const py = y + localX * sinTilt + localY * cosTilt;
        const size = 0.7 + ((i * 7) % 5) * 0.32;
        const alpha = 0.28 + (0.5 + 0.5 * Math.sin(t * 0.002 + i)) * 0.52;
        const tint = i % 3 === 0 ? "103, 232, 209" : "185, 175, 255";

        ctx.strokeStyle = `rgba(${tint}, ${alpha * 0.42})`;
        ctx.lineWidth = size * 0.7;
        ctx.beginPath();
        ctx.moveTo(px - Math.cos(angle) * size * 2.2, py - Math.sin(angle) * size * 2.2);
        ctx.lineTo(px, py);
        ctx.stroke();
        ctx.fillStyle = `rgba(${tint}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // The event horizon is deliberately opaque and sits above the disk,
      // creating the small "hole" at the center of all the light.
      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      const core = ctx.createRadialGradient(
        x - r * 0.08,
        y - r * 0.06,
        r * 0.04,
        x,
        y,
        r * 0.76
      );
      core.addColorStop(0, "rgba(0, 0, 0, 1)");
      core.addColorStop(0.7, "rgba(0, 0, 0, 0.99)");
      core.addColorStop(0.88, "rgba(4, 5, 10, 0.86)");
      core.addColorStop(1, "rgba(4, 5, 10, 0)");
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(x, y, r * 0.78, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(185, 175, 255, ${0.28 + pulse * 0.14})`;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.arc(x, y, r * 0.68, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // A final bright crescent makes the lensing effect legible even when
      // the black hole is small on a phone.
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.translate(x, y);
      ctx.rotate(tilt);
      ctx.scale(1, 0.29);
      ctx.strokeStyle = `rgba(103, 232, 209, ${0.28 + pulse * 0.16})`;
      ctx.lineWidth = r * 0.045;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.08, -0.85, 0.72);
      ctx.stroke();
      ctx.restore();
      ctx.restore();
    }

    function drawShootingStar() {
      if (!shootingStar) return;
      const s = shootingStar;
      const progress = s.life / s.maxLife;
      const fadeIn = Math.min(1, progress / 0.12);
      const fadeOut = Math.min(1, (1 - progress) / 0.24);
      const fade = Math.max(0, Math.min(fadeIn, fadeOut));
      const tailX = s.x - s.vx * 4.4;
      const tailY = s.y - s.vy * 4.4;
      const angle = Math.atan2(s.vy, s.vx);

      ctx.save();
      ctx.globalCompositeOperation = "screen";

      // A soft halo blooms around the head, then contracts as the star fades.
      const glowRadius = s.size * (6.5 + Math.sin(progress * Math.PI) * 2.5);
      const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, glowRadius);
      glow.addColorStop(0, `rgba(${s.rgb}, ${0.78 * fade})`);
      glow.addColorStop(0.18, `rgba(${s.rgb}, ${0.26 * fade})`);
      glow.addColorStop(1, `rgba(${s.rgb}, 0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(s.x, s.y, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      const tail = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
      tail.addColorStop(0, `rgba(${s.rgb}, 0)`);
      tail.addColorStop(0.45, `rgba(${s.rgb}, ${0.18 * fade})`);
      tail.addColorStop(1, `rgba(255, 255, 255, ${0.92 * fade})`);
      ctx.strokeStyle = tail;
      ctx.lineWidth = s.size * 1.8;
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(s.x, s.y);
      ctx.stroke();

      ctx.strokeStyle = `rgba(255, 255, 255, ${0.86 * fade})`;
      ctx.lineWidth = Math.max(0.65, s.size * 0.48);
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(s.x, s.y);
      ctx.stroke();

      // A tiny four-point flare makes the crossing read as a star rather
      // than just a moving line.
      ctx.translate(s.x, s.y);
      ctx.rotate(angle);
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.8 * fade})`;
      ctx.lineWidth = Math.max(0.55, s.size * 0.38);
      ctx.beginPath();
      ctx.moveTo(-s.size * 2.6, 0);
      ctx.lineTo(s.size * 2.6, 0);
      ctx.moveTo(0, -s.size * 2.2);
      ctx.lineTo(0, s.size * 2.2);
      ctx.stroke();
      ctx.fillStyle = `rgba(255, 255, 255, ${0.92 * fade})`;
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(0.8, s.size * 0.55), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      drawNebulae();

      for (const s of stars) {
        let opacity = s.baseOpacity;
        if (s.twinkle && !reduced) {
          opacity *= 0.72 + 0.28 * Math.sin(t * 0.0006 + s.twinklePhase);
        }
        const px = canHover ? pointerX * BAND_PARALLAX[s.band] : 0;
        const py = canHover ? pointerY * BAND_PARALLAX[s.band] : 0;
        const x = s.x + px;
        const y = s.y + py;

        if (s.glow && !reduced) {
          const glowRadius = s.radius * 5;
          const halo = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
          halo.addColorStop(0, `rgba(${s.rgb}, ${0.2 * opacity})`);
          halo.addColorStop(0.28, `rgba(${s.rgb}, ${0.07 * opacity})`);
          halo.addColorStop(1, `rgba(${s.rgb}, 0)`);
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        if (s.sparkle && !reduced) {
          const sparkleOpacity = 0.24 + opacity * 0.62;
          ctx.strokeStyle = `rgba(${s.rgb}, ${sparkleOpacity})`;
          ctx.lineWidth = 0.65;
          ctx.beginPath();
          ctx.moveTo(x - s.radius * 3.2, y);
          ctx.lineTo(x + s.radius * 3.2, y);
          ctx.moveTo(x, y - s.radius * 3.2);
          ctx.lineTo(x, y + s.radius * 3.2);
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.fillStyle = `rgba(${s.rgb}, ${opacity})`;
        ctx.arc(x, y, s.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      drawSatellite();
      drawBlackHole();
      drawShootingStar();
    }

    function step() {
      const now = performance.now();
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
        }
      } else if (now >= nextShootAt) {
        shootingStar = makeShootingStar(width, height);
        nextShootAt = now + SHOOT_INTERVAL_MS;
      }

      draw();
      rafId = requestAnimationFrame(step);
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("boink:ambient-motion", handleMotionPreference);
    if (canHover) {
      window.addEventListener("pointermove", handlePointerMove);
    }

    if (motionEnabled && !rafId) {
      rafId = requestAnimationFrame(step);
    }

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("boink:ambient-motion", handleMotionPreference);
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
