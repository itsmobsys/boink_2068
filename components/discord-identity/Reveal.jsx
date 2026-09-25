"use client";

/**
 * Reveal — the site's single scroll-triggered entrance primitive.
 *
 * Content starts a small distance below with a soft opacity fade; as
 * it enters the viewport it rises and settles without a scale or blur
 * jump. This is intentionally the ONE recurring motion pattern on the
 * page — every section composes it rather than inventing its own
 * variant, so the effect reads as one coherent idea rather than
 * scattered animation.
 *
 * The travel distance and stagger are deliberately restrained: scroll
 * should feel like a continuous camera move, not a sequence of late
 * pop-ins. Reduced-motion visitors receive an instant, opacity-only
 * reveal.
 */

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

export function Reveal({
  children,
  index = 0,
  size = "default",
  slow = false,
  className,
  as = "div",
  repeat = false,
  ...elementProps
}) {
  const ref = useRef(null);
  const inView = useInView(ref, {
    once: !repeat,
    amount: 0.08,
    // Expand the observation area vertically so an element begins its
    // entrance just before it reaches the viewport. The animation then
    // finishes naturally instead of chasing a fast scroll position.
    margin: "12% 0px",
  });
  const reduced = useReducedMotion();

  // Mount gate: the first client render must be byte-identical to SSR
  // (window is undefined there), otherwise React 19 throws a hydration
  // mismatch (#418) that kills every client effect on the page —
  // including the Starfield canvas. So observation stays off until the
  // mount commit, then the client arms the entrance observer.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Progressive enhancement: without IntersectionObserver (old
  // browsers, embedded WebViews) the entrance can never trigger, so
  // render the resting state immediately instead of stranding content
  // at opacity 0. The server-rendered hidden state is paired with the
  // noscript override in app/layout.js, so no-JS visitors still get
  // readable content.
  const hasIntersectionObserver =
    typeof window !== "undefined" &&
    typeof window.IntersectionObserver === "function";
  // During the first client render we keep the server's hidden state.
  // Once mounted, browsers without IntersectionObserver get the resting
  // state immediately; browsers with it wait for the actual trigger.
  const shouldShow =
    reduced || inView || (mounted && !hasIntersectionObserver);

  const riseVar = size === "sm" ? "var(--di-rise-sm)" : "var(--di-rise)";

  // Keep the flight long enough to feel cinematic, but short enough
  // that a quick scroll never leaves empty-looking sections behind.
  const duration = reduced ? 0 : slow ? 0.8 : 0.68;
  const staggerStep = slow ? 0.05 : 0.045;
  const maxStagger = slow ? 0.24 : 0.22;
  const safeIndex = Number.isFinite(index) ? Math.max(0, index) : 0;
  const delay = reduced ? 0 : Math.min(safeIndex * staggerStep, maxStagger);

  const MotionTag = motion[as];

  // Do not animate scale or blur here. Both make text rasterize again
  // during the reveal and are the main source of the “pop” on fast
  // scrolls. A small translate plus opacity is cheaper and steadier.
  // The CSS token collapses the translate automatically for reduced
  // motion, so the initial SSR/client style stays deterministic.
  const hidden = { opacity: 0, y: riseVar };
  const shown = { opacity: 1, y: 0 };

  // Avoid permanent will-change promotion across dozens of off-screen
  // wrappers; Motion's transform/opacity animation is short-lived and
  // does not need a compositor hint left on every node.
  return (
    <MotionTag
      {...elementProps}
      ref={ref}
      className={className}
      data-reveal=""
      initial={hidden}
      animate={shouldShow ? shown : hidden}
      transition={{
        duration,
        delay: shouldShow ? delay : 0,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </MotionTag>
  );
}

/**
 * RevealGroup — convenience wrapper for a list of siblings that
 * should stagger in together (e.g. skill chips, "Things I Do" rows).
 * Pass the same `size`/`slow` props you'd pass to individual Reveals.
 */
export function RevealGroup({ children, size = "default", slow = false, className }) {
  return (
    <div className={className}>
      {children.map((child, i) => (
        <Reveal key={i} index={i} size={size} slow={slow}>
          {child}
        </Reveal>
      ))}
    </div>
  );
}
