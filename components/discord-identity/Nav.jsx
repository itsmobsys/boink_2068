"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion, useScroll, useSpring } from "motion/react";

const LINKS = [
  { href: "#di-about", label: "About" },
  { href: "#di-vibe", label: "Vibe" },
  { href: "#di-things", label: "Habits" },
  { href: "#di-currently", label: "Now" },
  { href: "#di-final", label: "End" },
];

export function Nav({ presence = "offline" }) {
  const { scrollYProgress } = useScroll();
  const reduced = useReducedMotion();
  // Mount gate (same as Reveal): useReducedMotion is null server-side,
  // so element presence must not depend on it until after mount —
  // otherwise reduced-motion users get a hydration mismatch (#418).
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    mass: 0.4,
  });

  return (
    <header className="di-nav" data-presence={presence}>
      <a className="di-skip" href="#main">
        Skip to content
      </a>
      <nav className="di-nav__inner di-container" aria-label="Sections">
        <a
          href="#top"
          className="di-nav__brand di-mono"
          aria-label="boink — back to top"
        >
          <span className="di-nav__brand-dot" aria-hidden="true" />
          boink
        </a>
        <ul className="di-nav__links di-mono">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href}>{l.label}</a>
            </li>
          ))}
        </ul>
        <span
          role="status"
          className="di-nav__status di-mono"
          aria-label={`Status ${presence}`}
        >
          <span
            className={`di-presence-dot di-presence-dot--${presence}`}
            aria-hidden="true"
          />
          <span className="di-nav__status-text">{presence}</span>
        </span>
      </nav>
      {mounted && !reduced && (
        <motion.span
          className="di-nav__progress"
          style={{ scaleX: progress }}
          aria-hidden="true"
        />
      )}
    </header>
  );
}
