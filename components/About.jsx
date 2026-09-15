/* About — editorial introduction (server component).
   Asymmetric: eyebrow + heading + visual anchor left, copy right,
   understated attribute row below. All motion is delegated to the
   tiny Reveal client primitive — this file ships zero JavaScript. */

import AboutVisual from "./AboutVisual";
import Reveal from "./Reveal";

export default function About({ about }) {
  return (
    <section className="about" aria-labelledby="about-heading">
      <div className="about__inner">
        <div className="about__grid">
          {/* LEFT — index, heading, visual anchor */}
          <div className="about__head">
            <Reveal>
              <p className="about__eyebrow">
                <span className="about__eyebrow-dot" aria-hidden="true" />
                {about.index} / {about.eyebrow}
              </p>
            </Reveal>
            <Reveal delay="0.08s">
              <h2 className="about__title" id="about-heading">
                {about.heading}
              </h2>
            </Reveal>
            <Reveal delay="0.16s">
              <AboutVisual visual={about.visual} />
            </Reveal>
          </div>

          {/* RIGHT — copy */}
          <div className="about__copy">
            <Reveal delay="0.1s">
              <p className="about__context">
                <span className="about__context-label">{about.contextLabel}</span>
                <span className="about__context-rule" aria-hidden="true" />
              </p>
            </Reveal>
            <Reveal delay="0.18s">
              <p className="about__lede">{about.lede}</p>
            </Reveal>
            <Reveal delay="0.26s">
              <p className="about__body">{about.body}</p>
            </Reveal>
            <Reveal delay="0.34s">
              <p className="about__demo-note">
                <span aria-hidden="true">— </span>
                {about.demoNote}
              </p>
            </Reveal>
          </div>
        </div>

        {/* LOWER — quiet attribute row */}
        <Reveal delay="0.1s">
          <div className="about__foot">
            <dl className="about__attrs">
              {about.attributes.map((attr) => (
                <div className="about__attr" key={attr.label}>
                  <dt className="about__attr-label">{attr.label}</dt>
                  <dd className="about__attr-value">{attr.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
