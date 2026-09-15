/* ThingsIDo — recurring behaviors section (server component).
   Editorial index, not a skills grid: eyebrow / heading / intro, the
   vertical sequence, a minimal loop diagram, one quiet status line.
   All motion via the shared Reveal primitive — zero JavaScript here. */

import Reveal from "./Reveal";
import ThingsList from "./ThingsList";

export default function ThingsIDo({ things }) {
  return (
    <section className="things" aria-labelledby="things-heading">
      <div className="things__inner">
        <div className="things__head">
          <Reveal>
            <p className="things__eyebrow">
              <span className="things__eyebrow-dot" aria-hidden="true" />
              {things.index} / {things.eyebrow}
            </p>
          </Reveal>
          <Reveal delay="0.08s">
            <h2 className="things__title" id="things-heading">
              {things.heading}
            </h2>
          </Reveal>
          <Reveal delay="0.16s">
            <p className="things__intro">{things.intro}</p>
          </Reveal>
        </div>

        <ThingsList items={things.items} />

        <Reveal delay="0.1s">
          <div className="things-loop" aria-label="Recurring loop">
            <ol className="things-loop__steps">
              {things.loop.steps.map((step, i) => (
                <li className="things-loop__step" key={`${step}-${i}`}>
                  <span className="things-loop__node">{step}</span>
                  <span
                    aria-hidden="true"
                    className={
                      i === things.loop.steps.length - 1
                        ? "things-loop__link things-loop__link--return"
                        : "things-loop__link"
                    }
                  >
                    {i === things.loop.steps.length - 1 ? "↺" : "↓"}
                  </span>
                </li>
              ))}
            </ol>
            <p className="things-loop__caption">{things.loop.caption}</p>
          </div>
        </Reveal>

        <Reveal delay="0.12s">
          <p className="things__closing">
            <span className="things__pulse" aria-hidden="true" />
            {things.closing}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
