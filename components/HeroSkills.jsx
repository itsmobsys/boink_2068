"use client";

/* HeroSkills — the toolbelt chips, directly below the Hero metadata.
   Pure presentation plus one optional light: data still arrives via
   props from lib/profile.js (site-owned `skills`), never hardcoded,
   and the items stay informational — plain list items, not buttons or
   links.

   Two deliberate behaviours:
   · entrance — each chip carries its own --i, so the shared boot gate
     in globals.css (body[data-state="ready"]) cascades them on the
     same stagger the rest of the hero uses. No per-chip JS, no
     library;
   · presence — one pointer listener on the ROW (never on the thirty
     chips) publishes --mx/--my, and globals.css turns that into a soft
     accent light travelling behind the pills. The light is decorative
     and lives under the chips, so text contrast never changes.

   Fine pointers only: touch devices simply get the staggered entrance
   and the per-chip hover styles. */

import { useEffect, useRef } from "react";

export default function HeroSkills({ skills }) {
  const rowRef = useRef(null);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    let raf = 0;
    let px = 0;
    let py = 0;

    const flush = () => {
      raf = 0;
      row.style.setProperty("--mx", px + "px");
      row.style.setProperty("--my", py + "px");
    };
    const onMove = (e) => {
      const r = row.getBoundingClientRect();
      px = e.clientX - r.left;
      py = e.clientY - r.top;
      if (!raf) raf = requestAnimationFrame(flush);
    };
    const onEnter = () => {
      row.dataset.glow = "on";
    };
    const onLeave = () => {
      delete row.dataset.glow;
    };

    row.addEventListener("pointerenter", onEnter);
    row.addEventListener("pointermove", onMove);
    row.addEventListener("pointerleave", onLeave);
    return () => {
      row.removeEventListener("pointerenter", onEnter);
      row.removeEventListener("pointermove", onMove);
      row.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
      delete row.dataset.glow;
    };
  }, []);

  if (!Array.isArray(skills) || skills.length === 0) return null;

  return (
    <ul className="hero__skills" aria-label="Tools and skills" ref={rowRef}>
      {skills.map((skill, i) => (
        <li
          key={skill.name}
          className="hero__skill"
          style={{ "--dot": skill.color, "--i": i }}
        >
          <i aria-hidden="true" />
          {skill.name}
        </li>
      ))}
    </ul>
  );
}
