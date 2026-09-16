"use client";

/* VibeCompiler — the personality compiler interaction (client).
   Owns the only browser state in Step 3: raw → compiling → compiled,
   plus the return to raw. Everything visual keys off the `data-phase`
   attribute — React renders twice per compile, CSS does the cinema.
   No animation library, no loops, no polling. */

import { useCallback, useEffect, useRef, useState } from "react";
import { observeViewportPhase } from "./motion";
import PointerGlow from "./PointerGlow";
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

  /* Continuous-feel scroll glide for the deck (motion.js viewport
     phases): the whole stage drifts a few px and softens as it
     approaches center, settles crisp at rest. One observer, three
     panes — the deck reads as a single chassis, never stepped. */
  const stageRef = useRef(null);
  useEffect(() => observeViewportPhase(stageRef.current), []);

  const isCompiled = phase === "compiled";
  const isCompiling = phase === "compiling";

  return (
    <div
      ref={stageRef}
      className="vibe-stage"
      data-phase={phase}
      data-motion="viewport-phase"
    >
      <div className="vibe-deck" data-glow>
        {/* decorative pointer light, under the content: the chassis has
            depth, the machine state never changes because of it */}
        <PointerGlow />

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
              Rises with its siblings inside the 600–900ms band. */}
          <Reveal delay="0.1s" duration="0.7s" className="vibe-deck__pane">
            <p className="vibe-pane-tag">Source</p>
            <VibeSource data={vibe.data} />
          </Reveal>

          {/* COMPILE CONTROL */}
          <Reveal delay="0.2s" className="vibe-deck__action">
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

          {/* OUTPUT — arrives last, deepest rise + blur */}
          <Reveal delay="0.3s" shift="deep" className="vibe-deck__pane">
            <p className="vibe-pane-tag">Output</p>
            <div id="vibe-output">
              {isCompiled ? (
                <VibeCompiled data={vibe.data} />
              ) : (
                <div className="vibe-idle">
                  <span className="vibe-idle__dot" aria-hidden="true" />
                  <p className="vibe-idle__title">
                    {isCompiling ? "Compiling" : "Nothing compiled yet"}
                  </p>
                  <p className="vibe-idle__note">
                    {isCompiling
                      ? "Translating the file into plain English…"
                      : "Press Compile to read this file in plain English."}
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
