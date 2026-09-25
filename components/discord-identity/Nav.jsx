"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion, useScroll, useSpring } from "motion/react";
import { AmbientMotionToggle } from "./AmbientMotionToggle";

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
  const [menuOpen, setMenuOpen] = useState(false);

  // Keep the compact mobile menu from staying open after a rotation or
  // a desktop resize. This is UI-only and does not affect any data flow.
  useEffect(() => {
    const closeOnResize = () => setMenuOpen(false);
    window.addEventListener("resize", closeOnResize);
    return () => window.removeEventListener("resize", closeOnResize);
  }, []);

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
    <header
      className="di-nav"
      data-presence={presence}
      data-menu-open={menuOpen ? "true" : "false"}
    >
      <a className="di-skip" href="#main">
        Skip to content
      </a>
      <nav className="di-nav__inner di-container" aria-label="Sections">
        <a
          href="#top"
          className="di-nav__brand di-mono"
          aria-label="boink — back to top"
          onClick={() => setMenuOpen(false)}
        >
          <span className="di-nav__brand-dot" aria-hidden="true" />
          <span className="di-nav__brand-word">boink</span>
          <span className="di-nav__brand-suffix">/ personal signal</span>
        </a>

        <button
          type="button"
          className="di-nav__toggle di-mono"
          aria-expanded={menuOpen}
          aria-controls="di-nav-links"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span>{menuOpen ? "Close" : "Menu"}</span>
          <span className="di-nav__toggle-icon" aria-hidden="true">
            <i />
            <i />
          </span>
        </button>

        <ul
          id="di-nav-links"
          className={`di-nav__links di-mono${menuOpen ? " is-open" : ""}`}
        >
          {LINKS.map((link, index) => (
            <li key={link.href}>
              <a href={link.href} onClick={() => setMenuOpen(false)}>
                <span className="di-nav__link-index" aria-hidden="true">
                  0{index + 1}
                </span>
                <span>{link.label}</span>
              </a>
            </li>
          ))}
        </ul>

        <AmbientMotionToggle />

        <span
          role="status"
          className="di-nav__status di-mono"
          aria-label={`Status ${presence}`}
        >
          <span
            className={`di-presence-dot di-presence-dot--${presence}`}
            aria-hidden="true"
          />
          <span className="di-nav__status-copy">
            <span className="di-nav__status-text">{presence}</span>
            <span className="di-nav__status-caption">discord presence</span>
          </span>
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
