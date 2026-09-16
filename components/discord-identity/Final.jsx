"use client";

import { useState } from "react";
import { Reveal } from "./Reveal";

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
    <section className="di-section di-final" aria-label="Closing">
      <div className="di-container di-final__inner">
        <Reveal slow>
          <p className="di-eyebrow di-mono">{final.eyebrow}</p>
        </Reveal>

        <Reveal slow index={1}>
          <div className="di-final__mark" aria-hidden="true">
            <span />
          </div>
        </Reveal>

        <Reveal slow index={2}>
          <p className="di-final__statement">{final.statement}</p>
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

        <Reveal slow index={5} className="di-final__loop">
          <div className="di-final__loop-dashes" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          {final.trail && final.trail.length > 0 && (
            <p className="di-final__trail di-mono">{final.trail.join(" · ")}</p>
          )}
        </Reveal>

        <Reveal slow index={6}>
          <button type="button" className="di-back-to-top di-mono" onClick={scrollToTop}>
            {final.backToTop ?? "back to top"}
          </button>
          {final.sessionNote && (
            <p className="di-final__session di-mono">{final.sessionNote}</p>
          )}
        </Reveal>
      </div>
    </section>
  );
}

function ThoughtCycler({ thoughts, buttonLabel, counterLabel }) {
  const [index, setIndex] = useState(0);

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
      <p className="di-final__thought di-mono" aria-live="polite">
        <span className="di-final__thought-label">
          {buttonLabel} — {counterLabel} / {String(index + 1).padStart(2, "0")}
        </span>{" "}
        <span key={index}>“{thoughts[index]}”</span>
      </p>
      <button type="button" className="di-thought-cycler__button di-mono" onClick={again}>
        <span aria-hidden="true">↻ </span>
        {buttonLabel}
      </button>
    </div>
  );
}
