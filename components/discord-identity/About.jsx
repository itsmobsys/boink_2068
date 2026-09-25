"use client";

import { Reveal } from "./Reveal";

function indexFromEyebrow(eyebrow) {
  // Eyebrow arrives as "01 / About" — derive the figure number from
  // the existing copy instead of inventing a label.
  if (typeof eyebrow === "string") {
    const m = eyebrow.match(/^(\d+)/);
    if (m) return m[1];
  }
  return "01";
}

export function About({ about, profile }) {
  const index = indexFromEyebrow(about.eyebrow);
  const pills = [
    ...(about.details || []).map((d) => d.value),
    profile?.memberSinceLabel,
  ].filter(Boolean);

  return (
    <section
      id="di-about"
      className="di-section di-about"
      aria-labelledby="di-about-heading"
    >
      <div className="di-container di-about__grid">
        <div className="di-about__lead">
          <Reveal>
            <p className="di-eyebrow di-mono">{about.eyebrow}</p>
          </Reveal>
          <Reveal index={1}>
            <h2 id="di-about-heading" className="di-about__heading">
              {about.heading}
            </h2>
          </Reveal>
          <Reveal index={2}>
            <p className="di-about__statement">{about.statement}</p>
          </Reveal>
        </div>

        <div className="di-about__body-col">
          <Reveal index={3} className="di-about__card-wrap" as="div">
            <div className="di-about__card" aria-hidden="true">
              <div className="di-about__card-top di-mono">
                <span>{about.contextLabel ?? "In short"}</span>
                <span>Fig. {index}</span>
              </div>
              <div className="di-about__card-mark" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <p className="di-about__card-sig">Sig — {index}</p>
              <p className="di-about__card-cap di-mono">Identity mark</p>
              {pills.length > 0 && (
                <ul className="di-about__card-meta di-mono">
                  {pills.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              )}
              <div className="di-about__card-foot di-mono">
                <span>signal / stable</span>
                <span>↗</span>
              </div>
            </div>
          </Reveal>

          <Reveal index={4}>
            <p className="di-about__body">{about.body}</p>
          </Reveal>

          <Reveal index={5}>
            <dl className="di-about__details di-mono">
              {about.details.map((d) => (
                <div className="di-about__detail-row" key={d.label}>
                  <dt>{d.label}</dt>
                  <dd>{d.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
