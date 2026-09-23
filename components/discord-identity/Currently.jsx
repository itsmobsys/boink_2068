"use client";

import { useState } from "react";
import { Reveal } from "./Reveal";

export function Currently({ currently }) {
  // Reveal indices are assigned in actual render order (rather than
  // hardcoded), so optional blocks (heading/intro/meta) never collide
  // with — or leave a gap before — the sections that follow them.
  let i = 0;
  const eyebrowIndex = i++;
  const headingIndex = currently.heading ? i++ : null;
  const introIndex = currently.intro ? i++ : null;
  const metaIndex = currently.meta ? i++ : null;
  const featuredIndex = i++;
  const supportingStart = i;
  i += currently.supporting.length;
  const signalIndex = i++;
  const snapshotIndex = i++;
  const cyclerIndex = i;

  return (
    <section className="di-section di-currently" aria-labelledby="di-currently-heading">
      <div className="di-container">
        <Reveal index={eyebrowIndex}>
          <h2 id="di-currently-heading" className="di-eyebrow di-mono">
            {currently.eyebrow}
          </h2>
        </Reveal>
        {currently.heading && (
          <Reveal index={headingIndex}>
            <p className="di-currently__heading">{currently.heading}</p>
          </Reveal>
        )}
        {currently.intro && (
          <Reveal index={introIndex}>
            <p className="di-currently__intro">{currently.intro}</p>
          </Reveal>
        )}
        {currently.meta && (
          <Reveal index={metaIndex}>
            <p className="di-currently__meta di-mono">{currently.meta}</p>
          </Reveal>
        )}

        <Reveal index={featuredIndex} className="di-currently__featured">
          <span className="di-currently__featured-label di-mono">
            {currently.featured.label}
          </span>
          <p className="di-currently__featured-value">{currently.featured.value}</p>
          {currently.featured.detail && (
            <p className="di-currently__featured-detail">{currently.featured.detail}</p>
          )}
        </Reveal>

        <ul className="di-currently__supporting">
          {currently.supporting.map((s, idx) => (
            <Reveal as="li" key={s.label} index={supportingStart + idx} size="sm">
              <div className="di-currently__row">
                <span className="di-mono di-currently__row-label">{s.label}</span>
                <span className="di-currently__row-value">{s.value}</span>
              </div>
            </Reveal>
          ))}
        </ul>

        <div className="di-currently__footer">
          <Reveal index={signalIndex} className="di-currently__signal">
            <div className="di-signal-rail" aria-hidden="true">
              {currently.signal.map((_, idx) => (
                <span
                  key={idx}
                  className="di-signal-rail__bar"
                  style={{ "--i": idx }}
                />
              ))}
            </div>
            <ul className="di-signal-rail__legend di-mono">
              {currently.signal.map((label) => (
                <li key={label}>{label}</li>
              ))}
            </ul>
          </Reveal>

          <Reveal index={snapshotIndex} className="di-currently__snapshot di-mono">
            {currently.snapshot}
          </Reveal>
        </div>

        {/* Preserved interaction: the old site's Random Snapshot island.
            Same behavior (cycle curated observations, no timers), restyled
            into this design's voice — not a redesign of the feature. */}
        {currently.snapshots && currently.snapshots.length > 1 && (
          <Reveal index={cyclerIndex}>
            <SnapshotCycler
              snapshots={currently.snapshots}
              buttonLabel={currently.snapshotButton}
            />
          </Reveal>
        )}
      </div>
    </section>
  );
}

function SnapshotCycler({ snapshots, buttonLabel }) {
  const [index, setIndex] = useState(0);
  return (
    <div className="di-snapshot-cycler">
      <button
        type="button"
        className="di-snapshot-cycler__button di-mono"
        onClick={() => setIndex((i) => (i + 1) % snapshots.length)}
      >
        <span aria-hidden="true">↻ </span>
        {buttonLabel}
      </button>
      <p className="di-snapshot-cycler__text di-mono" aria-live="polite">
        <span key={index}>{snapshots[index]}</span>
      </p>
    </div>
  );
}
