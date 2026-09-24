"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Reveal } from "./Reveal";

const TRAIL_HREFS = ["#top", "#di-about", "#di-vibe", "#di-things", "#di-currently", "#top"];

export function Final({ final }) {
  function scrollToTop() {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.scrollTo(0, 0);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <section
      id="di-final"
      className="di-section di-final"
      aria-labelledby="di-final-heading"
    >
      <span className="di-final__bgword" aria-hidden="true">
        boink
      </span>
      <div className="di-container di-final__inner">
        <h2 id="di-final-heading" className="sr-only">
          {final.eyebrow}
        </h2>
        <Reveal slow>
          <p className="di-eyebrow di-mono">{final.eyebrow}</p>
        </Reveal>

        <Reveal slow index={1}>
          <div className="di-final__mark" aria-hidden="true">
            <span />
          </div>
        </Reveal>

        <Reveal slow index={2}>
          <p className="di-final__statement">
            <span className="di-gradient-text">{final.statement}</span>
          </p>
        </Reveal>

        <Reveal slow index={3}>
          <p className="di-final__supporting">{final.supportingText}</p>
        </Reveal>

        {/* Preserved interaction: the old site's Random Thought island.
            Initial render is deterministic (index 0) so SSR and hydration
            agree — randomness lives only inside the click handler. */}
        <Reveal slow index={4}>
          {final.thoughts && final.thoughts.length > 1 ? (
            <ThoughtCycler
              thoughts={final.thoughts}
              buttonLabel={final.thoughtLabel}
              counterLabel={final.thoughtCounter}
            />
          ) : (
            <p className="di-final__thought di-mono">
              <span className="di-final__thought-label">random thought —</span>{" "}
              {final.randomThought}
            </p>
          )}
        </Reveal>

        <Reveal slow index={5}>
          <button type="button" className="di-back-to-top di-mono" onClick={scrollToTop}>
            {final.backToTop ?? "back to top"}
          </button>
          {final.sessionNote && (
            <p className="di-final__session di-mono">{final.sessionNote}</p>
          )}
        </Reveal>
      </div>

      <footer className="di-footer">
        <div className="di-container di-footer__inner">
          {final.trail && final.trail.length > 0 && (
            <ul className="di-footer__trail di-mono">
              {final.trail.map((label, i) => (
                <li key={`${label}-${i}`}>
                  <a href={TRAIL_HREFS[i % TRAIL_HREFS.length]}>{label}</a>
                </li>
              ))}
            </ul>
          )}
          <div className="di-footer__meta di-mono">
            <span>© 2026 boink</span>
            <a
              href="https://github.com/itsmobsys"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </section>
  );
}

function ThoughtCycler({ thoughts, buttonLabel, counterLabel }) {
  const [index, setIndex] = useState(0);
  const prefersReduced = useReducedMotion();
  // Same mount gate as SnapshotCycler: useReducedMotion() is null on
  // SSR + first client render, so branching motion `initial` on it
  // mismatches hydration. Pin first renders to animated, honor OS after.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const reduced = mounted ? prefersReduced : false;

  const again = () => {
    setIndex((current) => {
      if (thoughts.length < 2) return current;
      let next = Math.floor(Math.random() * thoughts.length);
      while (next === current) {
        next = Math.floor(Math.random() * thoughts.length);
      }
      return next;
    });
  };

  return (
    <div className="di-thought-cycler">
      <p className="di-final__thought di-mono">
        <span className="di-final__thought-label" aria-hidden="true">
          {buttonLabel} — {counterLabel} / {String(index + 1).padStart(2, "0")}
        </span>{" "}
        <span className="sr-only">
          {buttonLabel}, {counterLabel} {index + 1} of {thoughts.length}:
        </span>
        <span aria-live="polite" aria-atomic="true">
          <AnimatePresence mode="wait">
            <motion.span
              key={index}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
              animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
              transition={{ duration: reduced ? 0 : 0.25, ease: "easeOut" }}
            >
              “{thoughts[index]}”
            </motion.span>
          </AnimatePresence>
        </span>
      </p>
      <button type="button" className="di-thought-cycler__button di-mono" onClick={again}>
        <span aria-hidden="true">↻ </span>
        {buttonLabel}
      </button>
    </div>
  );
}
