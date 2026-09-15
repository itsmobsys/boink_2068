/* Final — the closing scene (server component).
   Centered, spacious, quiet: eyebrow → identity mark → statement →
   short line → random thought → loop → back to top. Only
   RandomThought carries client state; everything else ships zero
   JavaScript. There is nothing after this section. */

import FinalIdentity from "./FinalIdentity";
import FinalLoop from "./FinalLoop";
import RandomThought from "./RandomThought";
import Reveal from "./Reveal";

export default function Final({ final, displayName, avatarUrl }) {
  return (
    <section className="final" aria-labelledby="final-heading">
      <div className="final__inner">
        <Reveal>
          <p className="final__eyebrow">
            <span className="final__eyebrow-dot" aria-hidden="true" />
            {final.index} / {final.eyebrow}
          </p>
        </Reveal>

        <Reveal delay="0.08s">
          <FinalIdentity displayName={displayName} avatarUrl={avatarUrl} />
        </Reveal>

        <Reveal delay="0.16s">
          <h2 className="final__statement" id="final-heading">
            {final.statement}
          </h2>
        </Reveal>

        <Reveal delay="0.24s">
          <p className="final__sub">{final.sub}</p>
        </Reveal>

        <Reveal delay="0.3s">
          <RandomThought
            thoughts={final.thoughts}
            buttonLabel={final.thoughtLabel}
            counterLabel={final.thoughtCounter}
          />
        </Reveal>

        <Reveal delay="0.34s">
          <FinalLoop steps={final.loop} />
        </Reveal>

        <Reveal delay="0.38s">
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
