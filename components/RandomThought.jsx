"use client";

/* RandomThought — the revisit mechanic (client).
   The ONLY browser state in Step 6: an index into the local thoughts
   dataset. Random pick, never repeats the current entry back-to-back.
   Initial render is deterministic (index 0) so SSR and hydration
   agree — randomness lives only inside the click handler. Swap
   animation re-triggers via key; neutralized globally if the visitor
   prefers reduced motion. */

import { useState } from "react";

export default function RandomThought({ thoughts, buttonLabel, counterLabel }) {
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
    <div className="final-thought">
      <button type="button" className="final-thought__button" onClick={again}>
        <span className="final-thought__dice" aria-hidden="true">
          ↻
        </span>
        {buttonLabel}
      </button>
      <p className="final-thought__line" aria-live="polite">
        <span className="final-thought__count" aria-hidden="true">
          {counterLabel} / {String(index + 1).padStart(2, "0")}
        </span>
        <span className="final-thought__text" key={index}>
          “{thoughts[index]}”
        </span>
      </p>
    </div>
  );
}
