"use client";

/* Reveal — the ONE shared scroll-reveal primitive for the entire site,
   driven by motion/react (no custom entrance animation of its own).
   Classic scroll-triggered BOTTOM → TOP: hidden below at opacity 0
   with visible motion blur → rises into place → lands fully opaque
   and completely crisp → stays static (viewport once:true).
   Server components stay JavaScript-free; they declare intent via
   props and this tiny client wrapper executes it.
   Props:
     shift    depth layer: eyebrow | heading | content | deep | visual
              (vertical travel + blur depth; content = y 48 / blur 14)
     delay    stagger offset on the ~100ms grid ("0s", "0.1s", …)
     duration optional entrance length override ("0.7s")
     tempo    "steady" (default, 0.7s) | "slow" (finale, 0.9s)
   The shared observeReveal hook in motion.js still adds .is-visible on
   entry — SOLELY as a trigger hook for descendant CSS cascades (Things
   rows, Currently states, Vibe source lines, word cascades), which live
   on child elements and never fight this wrapper's own properties.
   Reduced motion needs no branching here: the global reduced-motion
   CSS forces .reveal-scroll to its resting state with !important,
   which overrides motion's inline styles — content is immediately
   visible with no movement, blur, or stagger. */

import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { observeReveal } from "./motion";

/* Depth layers: vertical rise (px) + entrance blur (px). Mirrors the
   old CSS shift ramp so every section keeps its designed intensity. */
const SHIFTS = {
  eyebrow: { y: 24, blur: 8 },
  heading: { y: 36, blur: 12 },
  content: { y: 48, blur: 14 },
  deep: { y: 60, blur: 16 },
  visual: { y: 56, blur: 16 },
};

/* Premium ease-out shared by every entrance. */
const EASE = [0.22, 1, 0.36, 1];

/* Call sites pass CSS durations ("0.1s", "0.7s"); motion needs seconds. */
function toSeconds(value, fallback) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const text = value.trim();
    const ms = text.match(/^([\d.]+)\s*ms$/);
    if (ms) return parseFloat(ms[1]) / 1000;
    const s = text.match(/^([\d.]+)\s*s$/);
    if (s) return parseFloat(s[1]);
  }
  return fallback;
}

export default function Reveal({
  children,
  delay = "0s",
  duration,
  tempo = "steady",
  className = "",
  shift = "content",
}) {
  const ref = useRef(null);

  /* Hook-only: publishes .is-visible for descendant cascades. The
     wrapper's own entrance is owned entirely by motion below. */
  useEffect(() => observeReveal(ref.current), []);

  const depth = SHIFTS[shift] || SHIFTS.content;
  const delaySec = toSeconds(delay, 0);
  const durSec = toSeconds(duration, tempo === "slow" ? 0.9 : 0.7);

  return (
    <motion.div
      ref={ref}
      data-motion="reveal"
      data-depth={shift}
      className={`reveal-scroll${className ? " " + className : ""}`}
      style={{ "--d": delay }}
      initial={{ opacity: 0, y: depth.y, filter: `blur(${depth.blur}px)` }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.2, margin: "0px 0px -5% 0px" }}
      transition={{ duration: durSec, delay: delaySec, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
