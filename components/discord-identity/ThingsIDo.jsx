"use client";

import { motion } from "motion/react";
import { Reveal } from "./Reveal";

/**
 * The rows here genuinely are a sequence (a numbered list of
 * activities the person moves through), so numbering is earned
 * rather than decorative — see frontend-design guidance.
 *
 * Compat extras (heading/intro/loopSteps/loopCaption/closing) carry
 * the owner's existing section copy into this design unchanged —
 * same voice, no redesign, rendered only when provided.
 */
export function ThingsIDo({ things }) {
  const loopSteps =
    things.loopSteps && things.loopSteps.length > 0
      ? things.loopSteps
      : ["build", "ship", "observe", "refine"];
  return (
    <section className="di-section di-things" aria-labelledby="di-things-heading">
      <div className="di-container">
        <Reveal>
          <h2 id="di-things-heading" className="di-eyebrow di-mono">
            {things.eyebrow}
          </h2>
        </Reveal>
        {things.heading && (
          <Reveal index={1}>
            <p className="di-things__heading">{things.heading}</p>
          </Reveal>
        )}
        {things.intro && (
          <Reveal index={2}>
            <p className="di-things__intro">{things.intro}</p>
          </Reveal>
        )}

        <ol className="di-things__list">
          {things.items.map((thing, i) => (
            <Reveal as="li" key={thing.title} index={i + 1} size="sm">
              <motion.div className="di-things__row" whileHover="hover">
                <span className="di-things__index di-mono">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="di-things__row-text">
                  <h3 className="di-things__title">{thing.title}</h3>
                  <p className="di-things__desc">{thing.description}</p>
                </div>
                <motion.span
                  className="di-things__row-line"
                  variants={{
                    hover: { scaleX: 1, opacity: 1 },
                  }}
                  initial={{ scaleX: 0.4, opacity: 0.3 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  aria-hidden="true"
                />
              </motion.div>
            </Reveal>
          ))}
        </ol>

        <Reveal index={things.items.length + 1} className="di-things__loop">
          <LoopDiagram steps={loopSteps} />
        </Reveal>
        {things.loopCaption && (
          <Reveal index={things.items.length + 2}>
            <p className="di-things__caption di-mono">{things.loopCaption}</p>
          </Reveal>
        )}
        {things.closing && (
          <Reveal index={things.items.length + 3}>
            <p className="di-things__closing di-mono">{things.closing}</p>
          </Reveal>
        )}
      </div>
    </section>
  );
}

function LoopDiagram({ steps }) {
  return (
    <div className="di-loop" role="img" aria-label={`Continuous loop: ${steps.join(", ")}`}>
      <svg viewBox="0 0 560 140" className="di-loop__svg" aria-hidden="true">
        <path
          d="M60,70 H500"
          className="di-loop__path"
          fill="none"
        />
        {steps.map((_, i) => {
          const x = steps.length > 1 ? 60 + (i * 440) / (steps.length - 1) : 280;
          return <circle key={i} cx={x} cy={70} r={5} className="di-loop__node" />;
        })}
        <path
          d="M500,70 C540,70 540,20 500,20 C400,20 200,20 100,20 C40,20 40,55 60,68"
          className="di-loop__return"
          fill="none"
        />
      </svg>
      <ul className="di-loop__labels di-mono">
        {steps.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
    </div>
  );
}
