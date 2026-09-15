/* Currently — living snapshot section (server component).
   Asymmetric: heading + featured state left, signal-rail state list
   right; random-snapshot island and tiny loop below. The only client
   code in this section is CurrentlyNote — everything else ships
   zero JavaScript. */

import CurrentlyFeatured from "./CurrentlyFeatured";
import CurrentlyLoop from "./CurrentlyLoop";
import CurrentlyNote from "./CurrentlyNote";
import CurrentlyStates from "./CurrentlyStates";
import Reveal from "./Reveal";

export default function Currently({ currently }) {
  return (
    <section className="currently scene" data-scene="currently" aria-labelledby="currently-heading">
      <div className="currently__inner">
        <div className="currently__head">
          <Reveal shift="eyebrow">
            <p className="currently__eyebrow">
              <span className="currently__eyebrow-dot" aria-hidden="true" />
              {currently.index} / {currently.eyebrow}
            </p>
          </Reveal>
          <Reveal delay="0.065s" shift="heading">
            <h2 className="currently__title" id="currently-heading">
              {currently.heading}
            </h2>
          </Reveal>
          <Reveal delay="0.13s">
            <p className="currently__intro">{currently.intro}</p>
          </Reveal>
          <Reveal delay="0.195s" shift="deep">
            <p className="currently__meta">
              <span>{currently.snapshotLabel}</span>
              <span className="currently__meta-sep" aria-hidden="true">
                ·
              </span>
              <span>{currently.updatedLabel}</span>
            </p>
          </Reveal>
        </div>

        <div className="currently__grid">
          {/* featured state enters first — the system anchor */}
          <Reveal className="currently__featured-reveal">
            <CurrentlyFeatured featured={currently.featured} />
          </Reveal>
        {/* snapshot island enters last */}
        <Reveal delay="0.2s" shift="deep">
            <CurrentlyStates states={currently.states} />
          </Reveal>
        </div>

        <Reveal delay="0.1s" shift="deep">
          <CurrentlyNote snapshots={currently.snapshots} buttonLabel={currently.snapshotButton} />
        </Reveal>

        <Reveal delay="0.24s" shift="deep">
          <CurrentlyLoop steps={currently.loop} />
        </Reveal>
      </div>
    </section>
  );
}
