/* Vibe — personality compiler section (server component).
   Editorial intro (eyebrow / heading / description) then the compiler
   deck. All browser state lives inside VibeCompiler — this file ships
   zero JavaScript. */

import Reveal from "./Reveal";
import VibeCompiler from "./VibeCompiler";

export default function Vibe({ vibe }) {
  return (
    <section className="vibe" aria-labelledby="vibe-heading">
      <div className="vibe__inner">
        <div className="vibe__head">
          <Reveal>
            <p className="vibe__eyebrow">
              <span className="vibe__eyebrow-dot" aria-hidden="true" />
              {vibe.index} / {vibe.eyebrow}
            </p>
          </Reveal>
          <Reveal delay="0.08s">
            <h2 className="vibe__title" id="vibe-heading">
              {vibe.heading}
            </h2>
          </Reveal>
          <Reveal delay="0.16s">
            <p className="vibe__description">{vibe.description}</p>
          </Reveal>
        </div>

        <Reveal delay="0.1s">
          <VibeCompiler vibe={vibe} />
        </Reveal>
      </div>
    </section>
  );
}
