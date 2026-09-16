"use client";

import { Reveal } from "./Reveal";

export function About({ about }) {
  return (
    <section className="di-section di-about" aria-labelledby="di-about-heading">
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
          <Reveal index={3} className="di-about__specimen" as="div">
            <div className="di-about__specimen-inner" aria-hidden="true">
              <span className="di-about__specimen-ring" />
              <span className="di-about__specimen-ring di-about__specimen-ring--2" />
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
