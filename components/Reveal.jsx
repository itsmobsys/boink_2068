"use client";

/* Reveal — the one shared reveal primitive for the entire site.
   Server components stay JavaScript-free; they declare intent via
   props and this tiny client wrapper executes it through the shared
   observer in motion.js (one IntersectionObserver for ALL reveals).
   Props:
     shift    depth layer: eyebrow | heading | content | deep | visual
     delay    stagger offset on the 65ms grid ("0s", "0.065s", …)
     duration optional entrance length override ("0.5s") — intensity
     tempo    "steady" (default) | "slow" (final-scene restraint)
   Rendered attributes (data-motion / data-depth) make every animated
   node greppable for QA. SSR markup is identical with or without JS —
   effects only ever ADD the is-visible class, never restructure. */

import { useEffect, useRef } from "react";
import { observeReveal } from "./motion";

const SHIFTS = {
  eyebrow: "reveal-shift-eyebrow",
  heading: "reveal-shift-heading",
  content: "reveal-shift-content",
  deep: "reveal-shift-deep",
  visual: "reveal-shift-visual",
};

export default function Reveal({
  children,
  delay = "0s",
  duration,
  tempo = "steady",
  className = "",
  shift = "content",
}) {
  const ref = useRef(null);

  useEffect(() => observeReveal(ref.current), []);

  const style = { "--d": delay };
  if (duration) style["--dur"] = duration;

  return (
    <div
      ref={ref}
      data-motion="reveal"
      data-depth={shift}
      className={`reveal-scroll ${SHIFTS[shift] || SHIFTS.content}${
        tempo === "slow" ? " reveal-tempo-slow" : ""
      }${className ? " " + className : ""}`}
      style={style}
    >
      {children}
    </div>
  );
}
