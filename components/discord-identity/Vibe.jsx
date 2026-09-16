"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Reveal } from "./Reveal";

const FALLBACK_SOURCE_LINES = [
  { key: '"runtime"', value: '"human"' },
  { key: '"mode"', value: '"building"' },
  { key: '"latency"', value: '"low, mostly"' },
  { key: '"uptime"', value: '"since forever"' },
];

/**
 * Vibe — SOURCE -> COMPILE -> OUTPUT.
 *
 * Source: a small JSON specimen with syntax hierarchy, each line
 * revealing on scroll and lifting subtly on hover. Fed the owner's
 * real file (vibe.sourceLines, derived from the same site-owned
 * vibe.data the old compiler read) — the fallback only covers a
 * missing adapter, never production.
 *
 * Compile: a single deliberate button press. This is the one
 * user-triggered interaction on the page beyond hover — pressing it
 * runs a short, honest "compiling" choreography (not a timer for its
 * own sake, it visibly gates the output) and then reveals Output.
 *
 * Output: blocks fade in top -> bottom, each block moving DOWN into
 * place (translateY from negative to 0) and sharpening from blur,
 * never assembled character-by-character.
 */
export function Vibe({ vibe }) {
  const [phase, setPhase] = useState("idle");
  const timer = useRef(null);
  const reduceMotion = useRef(false);

  useEffect(() => {
    reduceMotion.current =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function handleCompile() {
    if (phase === "compiling") return;
    // Re-run after a finished compile: reset first so the output
    // exit plays, then run the choreography again.
    if (phase === "done") setPhase("idle");
    setPhase("compiling");
    if (timer.current) clearTimeout(timer.current);
    timer.current = window.setTimeout(
      () => {
        setPhase("done");
        timer.current = null;
      },
      reduceMotion.current ? 60 : 900
    );
  }

  const sourceLines =
    vibe.sourceLines && vibe.sourceLines.length > 0
      ? vibe.sourceLines
      : FALLBACK_SOURCE_LINES;
  const outputLines = vibe.outputLines ?? [];

  return (
    <section className="di-section di-vibe" aria-label="Vibe">
      <div className="di-container">
        <Reveal>
          <p className="di-eyebrow di-mono">{vibe.eyebrow}</p>
        </Reveal>
        {(vibe.heading || vibe.description) && (
          <div className="di-vibe__intro">
            {vibe.heading && (
              <Reveal index={1}>
                <h2 className="di-vibe__heading">{vibe.heading}</h2>
              </Reveal>
            )}
            {vibe.description && (
              <Reveal index={2}>
                <p className="di-vibe__description">{vibe.description}</p>
              </Reveal>
            )}
          </div>
        )}

        <div className="di-vibe__panel">
          <Reveal index={1} className="di-vibe__block di-vibe__source">
            <div className="di-vibe__block-head di-mono">
              {vibe.filename ?? "source"}
            </div>
            <pre className="di-vibe__source-code di-mono" aria-label="Source configuration">
              <span className="di-vibe__brace">{"{"}</span>
              {sourceLines.map((line, i) => (
                <motion.span
                  className="di-vibe__source-line"
                  key={line.key}
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="di-vibe__key">{line.key}</span>
                  <span className="di-vibe__punct">: </span>
                  <span className="di-vibe__value">{line.value}</span>
                  {i < sourceLines.length - 1 && (
                    <span className="di-vibe__punct">,</span>
                  )}
                </motion.span>
              ))}
              <span className="di-vibe__brace">{"}"}</span>
            </pre>
          </Reveal>

          <Reveal index={2} className="di-vibe__block di-vibe__compile">
            <div className="di-vibe__block-head di-mono">compile</div>
            <button
              type="button"
              className="di-compile-btn"
              onClick={handleCompile}
              disabled={phase === "compiling"}
              aria-live="polite"
            >
              <span className="di-compile-btn__chassis" aria-hidden="true">
                <motion.span
                  className="di-compile-btn__wire"
                  animate={
                    phase === "compiling"
                      ? { scaleX: [0, 1], opacity: [0.4, 1] }
                      : { scaleX: phase === "done" ? 1 : 0, opacity: phase === "done" ? 1 : 0.4 }
                  }
                  transition={{ duration: 0.85, ease: "easeInOut" }}
                />
              </span>
              <span className="di-compile-btn__label">
                {phase === "compiling"
                  ? "compiling…"
                  : phase === "done"
                    ? "run again"
                    : "run"}
              </span>
            </button>
          </Reveal>

          <div className="di-vibe__block di-vibe__output">
            <div className="di-vibe__block-head di-mono">output</div>
            <div className="di-vibe__output-body">
              <AnimatePresence>
                {phase === "done" &&
                  outputLines.map((line, i) => (
                    <motion.p
                      key={line.id}
                      className="di-vibe__output-line di-mono"
                      initial={{ opacity: 0, y: -10, filter: "blur(6px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0 }}
                      transition={{
                        duration: 0.5,
                        delay: i * 0.11,
                        ease: [0.16, 0.9, 0.3, 1],
                      }}
                    >
                      {line.text}
                    </motion.p>
                  ))}
              </AnimatePresence>
              {phase === "idle" && (
                <p className="di-vibe__output-placeholder di-mono">
                  waiting for compile
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* state announcement for assistive tech (visual status is implicit) */}
      <p className="sr-only" role="status">
        {`Compiler ${phase}.`}
      </p>
    </section>
  );
}
