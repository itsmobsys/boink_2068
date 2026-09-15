"use client";

/* CurrentlyNote — random snapshot island (client).
   The ONLY browser state in Step 5: an index cycling through the
   curated observations in profile data. No timers, no polling,
   no loops — zero cost when idle. The note is aria-live so assistive
   tech announces each rotation; the swap animation re-triggers via
   key and is neutralized globally under reduced motion. */

import { useState } from "react";

export default function CurrentlyNote({ snapshots, buttonLabel }) {
  const [index, setIndex] = useState(0);

  return (
    <div className="cur-note">
      <button
        type="button"
        className="cur-note__button"
        onClick={() => setIndex((i) => (i + 1) % snapshots.length)}
      >
        <span className="cur-note__dice" aria-hidden="true">
          ↻
        </span>
        {buttonLabel}
      </button>
      <p className="cur-note__text" aria-live="polite">
        <span className="cur-note__line" key={index}>
          {snapshots[index]}
        </span>
      </p>
    </div>
  );
}
