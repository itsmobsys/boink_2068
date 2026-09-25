"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Reveal } from "./Reveal";

/**
 * Vibe — "one file, two readings."
 *
 * A chassis with a filename/status bar and a progress hairline, then
 * Source → Compile → Output. SOURCE tokenizes the owner's real
 * vibe.data into multi-line JSON (line-number gutter, depth
 * indentation, typed values). COMPILE is the one deliberate
 * press-to-run interaction on the page (idle → compiling → done
 * → decompiling → idle, fully reversible). OUTPUT re-renders that same underlying data as a
 * human-readable read-out — same facts, different form — with each
 * line entering top-to-bottom (never character-by-character)
 * and exiting bottom-to-top on decompile.
 * Machine state keys off `data-phase`; CSS does the cinema.
 * Source stays on screen beside the output — the file is the point.
 */

const STATUS = {
  idle: "Ready",
  compiling: "Compiling",
  done: "Compiled",
  decompiling: "Decompiling",
};
const COMPILE_MS = 950; // matches the output lines' entrance budget
const DECOMPILE_MS = 650; // reverse-stagger exit budget (bottom-to-top)

// Adapter-missing fallback only: raw entries in the adapter's shape,
// covering every value type the tokenizer colors.
const FALLBACK_ENTRIES = [
  { key: "runtime", value: "human" },
  { key: "mode", value: "building" },
  { key: "focus", value: "frontend + backend systems" },
  { key: "caffeinated", value: true },
  { key: "uptime_days", value: 2847 },
];

function valueToken(value) {
  if (typeof value === "number") return "num";
  if (typeof value === "boolean") return "bool";
  return "str";
}

// Flatten entries into styled lines. Scalars render one line;
// arrays unfold one item per line at a deeper indent — the full
// extent of the vibe schema, so no content hides behind a stub.
function tokenize(entries) {
  const lines = [{ depth: 0, tokens: [{ t: "punct", v: "{" }] }];
  entries.forEach(({ key, value }, i) => {
    const comma = i < entries.length - 1 ? "," : "";
    if (Array.isArray(value)) {
      lines.push({
        depth: 1,
        tokens: [
          { t: "key", v: JSON.stringify(key) },
          { t: "punct", v: ": [" },
        ],
      });
      value.forEach((item, j) => {
        lines.push({
          depth: 2,
          tokens: [
            { t: valueToken(item), v: JSON.stringify(item) },
            { t: "punct", v: j < value.length - 1 ? "," : "" },
          ],
        });
      });
      lines.push({ depth: 1, tokens: [{ t: "punct", v: "]" + comma }] });
    } else {
      lines.push({
        depth: 1,
        tokens: [
          { t: "key", v: JSON.stringify(key) },
          { t: "punct", v: ": " },
          { t: valueToken(value), v: JSON.stringify(value) },
          { t: "punct", v: comma },
        ],
      });
    }
  });
  lines.push({ depth: 0, tokens: [{ t: "punct", v: "}" }] });
  return lines;
}

function OutputLine({ text }) {
  // "key: rest" → key in mint, rest in body text. Same facts,
  // better reading — the payoff for pressing run.
  const cut = text.indexOf(":");
  if (cut > 0) {
    return (
      <>
        <strong>{text.slice(0, cut)}</strong>
        {text.slice(cut)}
      </>
    );
  }
  return <>{text}</>;
}

export function Vibe({ vibe }) {
  const [phase, setPhase] = useState("idle");
  const timer = useRef(null);
  const reduceMotion = useRef(false);
  const prefersReducedRaw = useReducedMotion();
  // Mount gate (same as SnapshotCycler): useReducedMotion() is null on
  // SSR + first client render — branching motion `initial` on it
  // mismatches hydration. Output lines only mount post-interaction, but
  // keep the value deterministic from the first render regardless.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const prefersReduced = mounted ? prefersReducedRaw : false;

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
    if (phase === "compiling" || phase === "decompiling") return;
    // Done → decompile: flip straight to "decompiling", which
    // unmounts the lines so AnimatePresence plays the reverse-stagger
    // exit DURING the phase (hairline drains simultaneously), then
    // drop to idle which restores the source pane + idle ghost.
    if (phase === "done") {
      setPhase("decompiling");
      if (timer.current) clearTimeout(timer.current);
      timer.current = window.setTimeout(
        () => {
          setPhase("idle");
          timer.current = null;
        },
        reduceMotion.current ? 60 : DECOMPILE_MS
      );
      return;
    }
    setPhase("compiling");
    if (timer.current) clearTimeout(timer.current);
    timer.current = window.setTimeout(
      () => {
        setPhase("done");
        timer.current = null;
      },
      reduceMotion.current ? 60 : COMPILE_MS
    );
  }

  const filename = vibe.filename ?? "profile.json";
  const eyebrow =
    vibe.eyebrow && vibe.eyebrow.includes("/")
      ? vibe.eyebrow
      : `02 / ${vibe.eyebrow ?? "The Vibe"}`;
  const entries =
    vibe.sourceLines && vibe.sourceLines.length > 0
      ? vibe.sourceLines
      : FALLBACK_ENTRIES;
  const sourceLines = tokenize(entries);
  const outputLines = vibe.outputLines ?? [];
  const isCompiling = phase === "compiling";
  const isDone = phase === "done";
  const isDecompiling = phase === "decompiling";
  const isBusy = isCompiling || isDecompiling;
  const showIdle = !isDone && !isDecompiling;

  return (
    <section
      id="di-vibe"
      className="di-section di-vibe"
      aria-labelledby="di-vibe-heading"
    >
      <div className="di-container di-container--wide">
        <Reveal>
          <p className="di-eyebrow di-mono">{eyebrow}</p>
        </Reveal>
        <Reveal index={1}>
          <h2 id="di-vibe-heading" className="di-vibe__heading">
            One file, two readings.
          </h2>
        </Reveal>
        {vibe.description && (
          <Reveal index={2}>
            <p className="di-vibe__description">{vibe.description}</p>
          </Reveal>
        )}

        <Reveal index={3} size="sm">
          <div className="di-vibe__section-meta di-mono" aria-label="Vibe file metadata">
            <span>input / structured</span>
            <span className="di-vibe__section-meta-rule" aria-hidden="true" />
            <span>output / human</span>
          </div>
        </Reveal>

        <Reveal index={4}>
          <div className="di-vibe__stage" data-phase={phase}>
            <div className="di-vibe__deck">
              {/* status bar — the visual anchor that reacts to compilation */}
              <div className="di-vibe__deck-bar di-mono">
                <span className="di-vibe__deck-file">
                  <span className="di-vibe__deck-dot" aria-hidden="true" />
                  {filename}
                </span>
                <span className="di-vibe__deck-status">{STATUS[phase]}</span>
              </div>
              <div className="di-vibe__deck-progress" aria-hidden="true" />

              <div className="di-vibe__deck-grid">
                {/* SOURCE — stays on screen beside the output; dims
                    while the machine runs so the reading lands clean */}
                <div className="di-vibe__pane di-vibe__pane--source">
                  <div className="di-vibe__pane-clip">
                    <p className="di-vibe__pane-tag di-mono">Source</p>
                    <div
                      className="di-vibe__src di-mono"
                      role="region"
                      aria-label="Source configuration file"
                    >
                    {sourceLines.map((line, i) => (
                      <div
                        className="di-vibe__src-line"
                        style={{ "--i": i }}
                        key={i}
                      >
                        <span
                          className="di-vibe__src-gutter"
                          aria-hidden="true"
                        >
                          {i + 1}
                        </span>
                        <code
                          className="di-vibe__src-code"
                          style={{ "--depth": line.depth }}
                        >
                          {line.tokens.map((tok, j) => (
                            <span
                              className={`di-vibe__src-${tok.t}`}
                              key={j}
                            >
                              {tok.v}
                            </span>
                          ))}
                        </code>
                      </div>
                    ))}
                    </div>
                  </div>
                </div>

                {/* COMPILE */}
                <div className="di-vibe__action">
                  <span className="di-vibe__wire" aria-hidden="true" />
                  <button
                    type="button"
                    className="di-vibe__compile"
                    onClick={handleCompile}
                    disabled={isBusy}
                    aria-busy={isBusy}
                    aria-controls="di-vibe-output"
                  >
                    <span className="di-vibe__compile-label">
                      {isCompiling
                        ? "reading file…"
                        : isDecompiling
                          ? "reverting…"
                          : isDone
                            ? "decompile"
                            : "run"}
                    </span>
                    <span className="di-vibe__compile-arrow" aria-hidden="true">
                      {isDone || isDecompiling ? "←" : "→"}
                    </span>
                  </button>
                  <span className="di-vibe__wire" aria-hidden="true" />
                  <p className="di-vibe__compile-hint di-mono">
                    {isDone
                      ? `restore ${filename}`
                      : isDecompiling
                        ? "clearing the plain reading…"
                        : `interpret ${filename}`}
                  </p>
                </div>

                {/* OUTPUT */}
                <div className="di-vibe__pane">
                  <p className="di-vibe__pane-tag di-mono">Output</p>
                  <div
                    className="di-vibe__output-body"
                    id="di-vibe-output"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    <AnimatePresence>
                      {isDone &&
                        outputLines.map((line, i) => (
                          <motion.p
                            key={line.id}
                            className="di-vibe__output-line"
                            initial={
                              prefersReduced
                                ? { opacity: 0 }
                                : { opacity: 0, y: -10, filter: "blur(6px)" }
                            }
                            animate={
                              prefersReduced
                                ? { opacity: 1 }
                                : { opacity: 1, y: 0, filter: "blur(0px)" }
                            }
                            // Reverse of the entrance: lines sink down and
                            // blur out bottom-to-top, so decompile reads as
                            // compile played backwards.
                            exit={
                              prefersReduced
                                ? { opacity: 0, transition: { duration: 0.12 } }
                                : {
                                    opacity: 0,
                                    y: 10,
                                    filter: "blur(6px)",
                                    transition: {
                                      duration: 0.3,
                                      delay:
                                        (outputLines.length - 1 - i) * 0.07,
                                      ease: [0.16, 0.9, 0.3, 1],
                                    },
                                  }
                            }
                            transition={{
                              duration: prefersReduced ? 0 : 0.5,
                              delay: prefersReduced ? 0 : i * 0.11,
                              ease: [0.16, 0.9, 0.3, 1],
                            }}
                          >
                            <OutputLine text={line.text} />
                          </motion.p>
                        ))}
                    </AnimatePresence>
                    {showIdle && (
                      <div className="di-vibe__idle">
                        <span
                          className="di-vibe__idle-dot"
                          aria-hidden="true"
                        />
                        <p className="di-vibe__idle-title di-mono">
                          {isCompiling ? "Compiling" : "Nothing compiled yet"}
                        </p>
                        <p className="di-vibe__idle-note di-mono">
                          {isCompiling
                            ? "Translating the file into plain English…"
                            : "Press run to read this file in plain English."}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
      {/* state announcement for assistive tech (visual status is implicit) */}
      <p className="sr-only" role="status">
        {`Compiler ${STATUS[phase].toLowerCase()}.`}
      </p>
    </section>
  );
}
