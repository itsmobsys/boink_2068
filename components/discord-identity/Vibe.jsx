"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Reveal } from "./Reveal";

/**
 * Vibe — "one file, two readings."
 *
 * SOURCE renders as an actual small config file: line numbers,
 * syntax-colored keys/values, indentation, a status bar. Fed the
 * owner's real file (vibe.sourceLines, derived from the same
 * site-owned vibe.data the previous compiler read) — the fallback
 * only covers a missing adapter, never production. COMPILE is the
 * one deliberate press-to-run interaction on the page. OUTPUT
 * re-renders that same underlying data as a human-readable read-out
 * — same facts, different form — with each line entering
 * top-to-bottom (never character-by-character).
 */

const FALLBACK_SOURCE_LINES = [
  { key: "runtime", value: '"human"', type: "string" },
  { key: "mode", value: '"building"', type: "string" },
  { key: "focus", value: '"frontend + backend systems"', type: "string" },
  { key: "caffeinated", value: "true", type: "bool" },
  { key: "uptime_days", value: "2847", type: "number" },
];

// Adapter lines carry raw keys + JSON-ish values without a type tag;
// infer the editor coloring from the value shape (tolerant of the
// fallback lines, which already carry both).
function inferType(value) {
  if (value === "true" || value === "false") return "bool";
  if (/^-?\d+(\.\d+)?$/.test(value)) return "number";
  return "string";
}

function normalizeLine(line) {
  return {
    key: String(line.key).replace(/^"|"$/g, ""),
    value: String(line.value),
    type: line.type || inferType(String(line.value)),
  };
}

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
      reduceMotion.current ? 60 : 950
    );
  }

  const filename = vibe.filename ?? "profile.json";
  const rawLines =
    vibe.sourceLines && vibe.sourceLines.length > 0
      ? vibe.sourceLines
      : FALLBACK_SOURCE_LINES;
  const sourceLines = rawLines.map(normalizeLine);
  const outputLines = vibe.outputLines ?? [];
  const totalLines = sourceLines.length + 2;

  return (
    <section className="di-section di-vibe" aria-label="Vibe">
      <div className="di-container">
        <Reveal>
          <p className="di-eyebrow di-mono">vibe</p>
        </Reveal>
        <Reveal index={1}>
          <h2 className="di-vibe__heading">One file, two readings.</h2>
        </Reveal>
        {vibe.description && (
          <Reveal index={2}>
            <p className="di-vibe__description">{vibe.description}</p>
          </Reveal>
        )}

        <div className="di-vibe__panel">
          {/* SOURCE */}
          <Reveal index={2} className="di-vibe__block di-vibe__source">
            <div className="di-vibe__editor-bar">
              <span className="di-vibe__editor-dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              <span className="di-vibe__editor-filename di-mono">{filename}</span>
            </div>

            <pre className="di-vibe__code di-mono" aria-label="Source configuration file">
              <Line n={1}>
                <Brace>{"{"}</Brace>
              </Line>
              {sourceLines.map((line, i) => (
                <Line n={i + 2} key={line.key}>
                  <motion.span
                    className="di-vibe__code-row"
                    whileHover={{ x: 3 }}
                    transition={{ duration: 0.18 }}
                  >
                    <Indent />
                    <Key>{`"${line.key}"`}</Key>
                    <Punct>: </Punct>
                    <Value type={line.type}>{line.value}</Value>
                    {i < sourceLines.length - 1 && <Punct>,</Punct>}
                  </motion.span>
                </Line>
              ))}
              <Line n={totalLines}>
                <Brace>{"}"}</Brace>
              </Line>
            </pre>

            <div className="di-vibe__editor-status di-mono">
              <span>{filename}</span>
              <span>{totalLines} lines</span>
              <span>utf-8</span>
            </div>
          </Reveal>

          {/* COMPILE */}
          <Reveal index={3} className="di-vibe__block di-vibe__compile">
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
                      : {
                          scaleX: phase === "done" ? 1 : 0,
                          opacity: phase === "done" ? 1 : 0.4,
                        }
                  }
                  transition={{ duration: 0.9, ease: "easeInOut" }}
                />
              </span>
              <span className="di-compile-btn__label">
                {phase === "compiling"
                  ? "reading file…"
                  : phase === "done"
                    ? "run again"
                    : "run"}
              </span>
            </button>
            <p className="di-vibe__compile-hint di-mono">
              {phase === "done"
                ? "same data, plain reading"
                : `interpret ${filename}`}
            </p>
          </Reveal>

          {/* OUTPUT */}
          <Reveal index={4} className="di-vibe__block di-vibe__output">
            <div className="di-vibe__block-head di-mono">output</div>
            <div className="di-vibe__output-body">
              <AnimatePresence>
                {phase === "done" &&
                  outputLines.map((line, i) => (
                    <motion.p
                      key={line.id}
                      className="di-vibe__output-line"
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
              {phase !== "done" && (
                <p className="di-vibe__output-placeholder di-mono">
                  {phase === "compiling" ? "reading…" : "waiting to compile"}
                </p>
              )}
            </div>
          </Reveal>
        </div>
      </div>
      {/* state announcement for assistive tech (visual status is implicit) */}
      <p className="sr-only" role="status">
        {`Compiler ${phase}.`}
      </p>
    </section>
  );
}

/* ---------- small syntax-styling helpers ---------- */

function Line({ n, children }) {
  return (
    <span className="di-vibe__line">
      <span className="di-vibe__lineno" aria-hidden="true">
        {n}
      </span>
      <span className="di-vibe__linecontent">{children}</span>
    </span>
  );
}

function Indent() {
  return <span className="di-vibe__indent">{"  "}</span>;
}

function Brace({ children }) {
  return <span className="di-vibe__brace">{children}</span>;
}

function Key({ children }) {
  return <span className="di-vibe__key">{children}</span>;
}

function Punct({ children }) {
  return <span className="di-vibe__punct">{children}</span>;
}

function Value({ children, type }) {
  return <span className={`di-vibe__value di-vibe__value--${type}`}>{children}</span>;
}
