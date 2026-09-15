"use client";

/* VibeCompiler — the personality compiler interaction (client).
   Owns the only browser state in Step 3: raw → compiling → compiled,
   plus the return to raw. Everything visual keys off the `data-phase`
   attribute — React renders twice per compile, CSS does the cinema.
   No animation library, no loops, no polling. */

import { useCallback, useEffect, useRef, useState } from "react";
import Reveal from "./Reveal";
import VibeCompiled from "./VibeCompiled";
import VibeSource from "./VibeSource";

const STATUS = { raw: "Ready", compiling: "Compiling", compiled: "Compiled" };
const COMPILE_MS = 620; // total transition budget stays well under a second

export default function VibeCompiler({ vibe }) {
  const [phase, setPhase] = useState("raw"); // raw | compiling | compiled
  const timer = useRef(null);
  const reduceMotion = useRef(false);

  useEffect(() => {
    reduceMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const compile = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setPhase("compiling");
    timer.current = setTimeout(
      () => {
        setPhase("compiled");
        timer.current = null;
      },
      reduceMotion.current ? 60 : COMPILE_MS
    );
  }, []);

  const viewSource = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    setPhase("raw");
  }, []);

  const isCompiled = phase === "compiled";
  const isCompiling = phase === "compiling";

  return (
    <div className="vibe-stage" data-phase={phase}>
      <div className="vibe-deck">
        {/* status bar — the visual anchor that reacts to compilation */}
        <Reveal shift="eyebrow">
          <div className="vibe-deck__bar">
            <span className="vibe-deck__file">
              <span className="vibe-deck__dot" aria-hidden="true" />
              {vibe.filename}
            </span>
            <span className="vibe-deck__status" aria-hidden="true">
              {STATUS[phase]}
            </span>
          </div>
        </Reveal>
        <div className="vibe-deck__progress" aria-hidden="true" />

        <div className="vibe-deck__grid">
          {/* SOURCE — layout class composes onto the Reveal grid item.
              Enters slightly faster than its siblings (shorter run). */}
          <Reveal delay="0.065s" duration="0.5s" className="vibe-deck__pane">
            <p className="vibe-pane-tag">Source</p>
            <VibeSource data={vibe.data} />
          </Reveal>

          {/* COMPILE CONTROL */}
          <Reveal delay="0.13s" className="vibe-deck__action">
            <span className="vibe-deck__wire" aria-hidden="true" />
            <button
              type="button"
              className="vibe-compile"
              onClick={isCompiled ? viewSource : compile}
              disabled={isCompiling}
              aria-expanded={isCompiled}
              aria-controls="vibe-output"
            >
              <span className="vibe-compile__label">
                {isCompiled ? "View source" : isCompiling ? "Compiling" : "Compile"}
              </span>
              <span className="vibe-compile__arrow" aria-hidden="true">
                {isCompiled ? "↑" : "→"}
              </span>
              {!isCompiled && !isCompiling && (
                <kbd className="vibe-compile__key" aria-hidden="true">
                  ⏎
                </kbd>
              )}
            </button>
            <span className="vibe-deck__wire" aria-hidden="true" />
          </Reveal>

          {/* OUTPUT — arrives last, deepest travel */}
          <Reveal delay="0.195s" shift="deep" className="vibe-deck__pane">
            <p className="vibe-pane-tag">Output</p>
            <div id="vibe-output">
              {isCompiled ? (
                <VibeCompiled data={vibe.data} />
              ) : (
                <div className="vibe-idle">
                  <span className="vibe-idle__dot" aria-hidden="true" />
                  <p className="vibe-idle__title">
                    {isCompiling ? "Resolving source" : "Awaiting input"}
                  </p>
                  <p className="vibe-idle__note">
                    {isCompiling ? "Personality taking shape." : "Press compile to resolve the source."}
                  </p>
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </div>

      {/* state announcement for assistive tech (visual status is aria-hidden) */}
      <p className="sr-only" role="status">
        {`Compiler ${STATUS[phase].toLowerCase()}.`}
      </p>
    </div>
  );
}
