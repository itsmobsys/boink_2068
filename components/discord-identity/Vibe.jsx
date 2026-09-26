"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { Reveal } from "./Reveal";

/**
 * Vibe — "one file, two readings."
 *
 * A chassis with a filename/status bar, a live read meter and a
 * progress hairline, then Source → Compile → Output. SOURCE tokenizes
 * the owner's real vibe.data into multi-line JSON (line-number gutter,
 * depth indentation, typed values).
 *
 * COMPILE is the one deliberate press-to-run interaction on the page,
 * and it is choreographed as an actual pass over the file rather than a
 * wait:
 *
 *   1. read sweep   — a read head walks the source line by line, the
 *                     hairline fills and the meter counts real
 *                     progress, all locked to the real line count
 *   2. handoff      — the file recedes, the output pane takes focus
 *   3. print        — each output line wipes in top-to-bottom
 *
 * Decompile plays the print backwards (lines un-print bottom-to-top)
 * while the file is restored, so the machine reads as reversible. The
 * first time the deck scrolls into view the pass plays itself once, so
 * the section demonstrates itself before anyone has to press anything.
 *
 * Machine state keys off `data-phase`; CSS does the cinema. Output copy
 * still comes only from the adapter — nothing here invents text.
 */

const STATUS = {
  idle: "Ready",
  compiling: "Compiling",
  done: "Compiled",
  decompiling: "Decompiling",
};
const EASE = [0.22, 1, 0.36, 1];

// Choreography budget. The sweep has to finish BEFORE the output starts
// printing, otherwise the machine looks like it skipped the file.
const SWEEP_MS = 1150;
const PRINT_STAGGER = 0.07;
const PRINT_MS = 720;
const COMPILE_MS = SWEEP_MS + PRINT_MS;
const DECOMPILE_MS = 700;
const HOLD_MS = 2600;
const REDUCED_MS = 160;

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

// FNV-1a over the real file contents. It is a display fingerprint for
// the compiled read-out, not a security or integrity claim.
function fingerprint(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).toUpperCase().padStart(8, "0");
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
  const [readIndex, setReadIndex] = useState(-1);
  const [runId, setRunId] = useState(0);

  const stageRef = useRef(null);
  const meterRef = useRef(null);
  const timers = useRef([]);
  const frame = useRef(0);
  const autoPlayed = useRef(false);

  // Mount gate (same as Reveal): useReducedMotion() is null on SSR and
  // on the first client render, so branching on it directly would
  // mismatch hydration. Everything below reads the gated value.
  const prefersReducedRaw = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const prefersReduced = mounted ? prefersReducedRaw === true : false;

  const inView = useInView(stageRef, { once: true, amount: 0.3 });

  const entries = useMemo(
    () =>
      vibe.sourceLines && vibe.sourceLines.length > 0
        ? vibe.sourceLines
        : FALLBACK_ENTRIES,
    [vibe.sourceLines]
  );
  const outputLines = vibe.outputLines ?? [];
  const sourceLines = useMemo(() => tokenize(entries), [entries]);
  const lineCount = sourceLines.length;

  // Derived from the same entries the panes render — real numbers.
  const charCount = useMemo(
    () =>
      entries.reduce(
        (total, entry) => total + entry.key.length + JSON.stringify(entry.value).length,
        0
      ),
    [entries]
  );
  const fileHash = useMemo(
    () =>
      fingerprint(
        entries.map((entry) => `${entry.key}:${JSON.stringify(entry.value)}`).join("|")
      ),
    [entries]
  );

  const later = (fn, ms) => {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  };
  const clearLater = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };

  useEffect(
    () => () => {
      clearLater();
      if (frame.current) window.cancelAnimationFrame(frame.current);
    },
    []
  );

  // The read pass. One rAF drives the numeric meter straight onto the
  // DOM (no re-render churn) and only pushes React state when the read
  // head actually lands on a new line, so the sweep costs ~1 re-render
  // per source line instead of 60 per second.
  useEffect(() => {
    if (phase !== "compiling" || prefersReduced) return;
    const started = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - started) / SWEEP_MS);
      const eased = 1 - (1 - t) * (1 - t);
      if (meterRef.current) {
        const pct = String(Math.round(eased * 100)).padStart(3, "0");
        meterRef.current.textContent = `${pct}%`;
      }
      const next = eased >= 1 ? lineCount - 1 : Math.floor(eased * lineCount);
      setReadIndex((prev) => (prev === next ? prev : next));
      if (t < 1) frame.current = window.requestAnimationFrame(step);
    };
    frame.current = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frame.current);
  }, [phase, prefersReduced, lineCount]);

  // Settle. The read head only exists while the machine is reading, and
  // the meter holds its final value for as long as the read-out is on
  // screen, so the status bar reports a finished pass rather than
  // snapping back to zero the instant the output appears.
  useEffect(() => {
    setReadIndex(-1);
    if (!meterRef.current) return;
    meterRef.current.textContent = phase === "done" ? "100%" : "000%";
  }, [phase]);

  function startCompile() {
    clearLater();
    setRunId((n) => n + 1);
    setPhase("compiling");
    later(() => setPhase("done"), prefersReduced ? REDUCED_MS : COMPILE_MS);
  }

  function startDecompile() {
    clearLater();
    setPhase("decompiling");
    later(() => setPhase("idle"), prefersReduced ? REDUCED_MS : DECOMPILE_MS);
  }

  function handleCompile() {
    if (phase === "compiling" || phase === "decompiling") return;
    if (phase === "done") startDecompile();
    else startCompile();
  }

  // Self-demonstrating first pass: run the machine once when the deck
  // arrives, hold the compiled read-out long enough to read, then revert
  // so the button is still an obvious thing to press.
  useEffect(() => {
    if (!inView || autoPlayed.current || prefersReduced) return;
    if (!outputLines.length) return;
    autoPlayed.current = true;
    const kick = later(() => {
      setRunId((n) => n + 1);
      setPhase("compiling");
      later(() => {
        setPhase("done");
        later(() => {
          setPhase("decompiling");
          later(() => setPhase("idle"), DECOMPILE_MS);
        }, HOLD_MS);
      }, COMPILE_MS);
    }, 850);
    return () => window.clearTimeout(kick);
  }, [inView, prefersReduced, outputLines.length]);

  const filename = vibe.filename ?? "profile.json";
  const eyebrow =
    vibe.eyebrow && vibe.eyebrow.includes("/")
      ? vibe.eyebrow
      : `02 / ${vibe.eyebrow ?? "The Vibe"}`;
  const isCompiling = phase === "compiling";
  const isDone = phase === "done";
  const isDecompiling = phase === "decompiling";
  const isBusy = isCompiling || isDecompiling;
  const showIdle = !isDone && !isDecompiling;
  const readCount = readIndex < 0 ? 0 : readIndex + 1;

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
          <div
            className="di-vibe__stage"
            data-phase={phase}
            ref={stageRef}
          >
            <div className="di-vibe__deck">
              {/* chassis dressing: blueprint bed, CRT sweep, corner
                  brackets and a lock flash. All keyed off data-phase. */}
              <span className="di-vibe__deck-bed" aria-hidden="true" />
              <span className="di-vibe__deck-scan" aria-hidden="true" />
              <span className="di-vibe__deck-flash" aria-hidden="true" />
              <span className="di-vibe__deck-corner di-vibe__deck-corner--tl" aria-hidden="true" />
              <span className="di-vibe__deck-corner di-vibe__deck-corner--tr" aria-hidden="true" />
              <span className="di-vibe__deck-corner di-vibe__deck-corner--bl" aria-hidden="true" />
              <span className="di-vibe__deck-corner di-vibe__deck-corner--br" aria-hidden="true" />

              {/* status bar — the visual anchor that reacts to the pass */}
              <div className="di-vibe__deck-bar di-mono">
                <span className="di-vibe__deck-file">
                  <span className="di-vibe__deck-dot" aria-hidden="true" />
                  {filename}
                </span>
                <span className="di-vibe__deck-meter" aria-hidden="true">
                  <span className="di-vibe__deck-meter-pct" ref={meterRef}>
                    000%
                  </span>
                  <span className="di-vibe__deck-meter-sep">·</span>
                  <span className="di-vibe__deck-meter-lines">
                    {readCount}/{lineCount} ln
                  </span>
                </span>
                <span className="di-vibe__deck-status" key={phase}>
                  {STATUS[phase]}
                </span>
              </div>
              <div className="di-vibe__deck-progress" aria-hidden="true" />

              <div className="di-vibe__deck-grid">
                {/* SOURCE — stays on screen beside the output. It holds
                    the read head while the machine works, then recedes
                    once the read-out lands. */}
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
                        data-read={i === readIndex ? "true" : undefined}
                        data-past={i < readIndex ? "true" : undefined}
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
                        outputLines.map((line, i) => {
                          const isLast = i === outputLines.length - 1;
                          return (
                            <motion.p
                              key={`${runId}-${line.id}`}
                              className="di-vibe__output-line"
                              style={{ "--i": i }}
                              initial={
                                prefersReduced
                                  ? { opacity: 0 }
                                  : {
                                      opacity: 0,
                                      y: 6,
                                      clipPath: "inset(0 100% 0 0)",
                                    }
                              }
                              animate={
                                prefersReduced
                                  ? { opacity: 1 }
                                  : {
                                      opacity: 1,
                                      y: 0,
                                      clipPath: "inset(0 0% 0 0)",
                                    }
                              }
                              // Reverse of the entrance: the line wipes
                              // out right-to-left bottom-to-top, so
                              // decompile reads as compile played back.
                              exit={
                                prefersReduced
                                  ? {
                                      opacity: 0,
                                      transition: { duration: 0.12 },
                                    }
                                  : {
                                      opacity: 0,
                                      y: -4,
                                      clipPath: "inset(0 0 0 100%)",
                                      transition: {
                                        duration: 0.28,
                                        delay:
                                          (outputLines.length - 1 - i) * 0.06,
                                        ease: EASE,
                                      },
                                    }
                              }
                              transition={{
                                duration: prefersReduced ? 0 : 0.36,
                                delay: prefersReduced
                                  ? 0
                                  : i * PRINT_STAGGER,
                                ease: EASE,
                              }}
                            >
                              <OutputLine text={line.text} />
                              {isLast && (
                                <span
                                  className="di-vibe__output-caret"
                                  aria-hidden="true"
                                />
                              )}
                            </motion.p>
                          );
                        })}
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
                        {/* the file's own key index — real keys, so the
                            empty pane still shows what is loaded */}
                        <ul
                          className="di-vibe__idle-schema di-mono"
                          aria-hidden="true"
                        >
                          {entries.map((entry, i) => (
                            <li style={{ "--i": i }} key={entry.key}>
                              {entry.key}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <AnimatePresence>
                      {isDone && (
                        <motion.p
                          className="di-vibe__output-foot di-mono"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{
                            duration: prefersReduced ? 0 : 0.4,
                            delay: prefersReduced
                              ? 0
                              : outputLines.length * PRINT_STAGGER + 0.1,
                            ease: EASE,
                          }}
                        >
                          <span>{outputLines.length} lines</span>
                          <span>{charCount} chars</span>
                          <span className="di-vibe__output-foot-fp">
                            fp {fileHash}
                          </span>
                        </motion.p>
                      )}
                    </AnimatePresence>
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
