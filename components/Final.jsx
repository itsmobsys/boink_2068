/* Final — the closing scene (server component).
   Centered, spacious, quiet: eyebrow → identity mark → statement →
   short line → random thought → loop → back to top. Only
   RandomThought carries client state; everything else ships zero
   JavaScript. There is nothing after this section. */

import FinalIdentity from "./FinalIdentity";
import FinalLoop from "./FinalLoop";
import RandomThought from "./RandomThought";
import Reveal from "./Reveal";
import SplitText from "./SplitText";

export default function Final({ final, displayName, avatarUrl }) {
  return (
    <section className="final scene" data-scene="final" aria-labelledby="final-heading">
      <div className="final__inner">
        <Reveal shift="eyebrow" tempo="slow">
          <p className="final__eyebrow">
            <span className="final__eyebrow-dot" aria-hidden="true" />
            {final.index} / {final.eyebrow}
          </p>
        </Reveal>

        {/* identity mark arrives first — the camera's resting point */}
        <Reveal delay="0.1s" shift="heading" tempo="slow">
          <FinalIdentity displayName={displayName} avatarUrl={avatarUrl} />
        </Reveal>

        <Reveal delay="0.2s" shift="heading" tempo="slow">
          <h2 className="final__statement" id="final-heading">
            {final.statement}
          </h2>
        </Reveal>

        <Reveal delay="0.3s" tempo="slow">
          <p className="final__sub">
            <SplitText text={final.sub} />
          </p>
        </Reveal>

        <Reveal delay="0.4s" tempo="slow">
          <RandomThought
            thoughts={final.thoughts}
            buttonLabel={final.thoughtLabel}
            counterLabel={final.thoughtCounter}
          />
        </Reveal>

        <Reveal delay="0.5s" tempo="slow">
          <FinalLoop steps={final.loop} />
        </Reveal>

        <Reveal delay="0.6s" shift="eyebrow" tempo="slow">
          <div className="final__exit">
            <a className="final__top" href="#hero">
              {final.backToTop}
              <span aria-hidden="true"> ↑</span>
            </a>
            <p className="final__session">{final.sessionNote}</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
