/* About — editorial introduction (server component).
   Asymmetric: eyebrow + heading + visual anchor left, copy right,
   understated attribute row below. All motion is delegated to the
   tiny Reveal client primitive — this file ships zero JavaScript. */

import AboutVisual from "./AboutVisual";
import Reveal from "./Reveal";
import SplitText from "./SplitText";

export default function About({ about }) {
  return (
    <section className="about scene" data-scene="about" aria-labelledby="about-heading">
      <div className="about__inner">
        <div className="about__grid">
          {/* LEFT — index, heading, visual anchor */}
          <div className="about__head">
            <Reveal shift="eyebrow">
              <p className="about__eyebrow">
                <span className="about__eyebrow-dot" aria-hidden="true" />
                {about.index} / {about.eyebrow}
              </p>
            </Reveal>
            <Reveal delay="0.1s" shift="heading">
              <h2 className="about__title" id="about-heading">
                {about.heading}
              </h2>
            </Reveal>
            <Reveal delay="0.2s" shift="visual">
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
            <Reveal delay="0.2s">
              <p className="about__lede">
                <SplitText text={about.lede} />
              </p>
            </Reveal>
            <Reveal delay="0.3s">
              <p className="about__body">{about.body}</p>
            </Reveal>
          </div>
        </div>

        {/* LOWER — quiet attribute row */}
        <Reveal delay="0.2s" shift="deep">
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
