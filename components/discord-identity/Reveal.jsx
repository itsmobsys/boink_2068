"use client";

/**
 * Reveal — the site's single scroll-triggered entrance primitive.
 *
 * Content starts slightly below, blurred and very slightly scaled
 * down; as it enters the viewport it rises, sharpens, and settles.
 * This is intentionally the ONE recurring motion pattern on the
 * page — every section composes it rather than inventing its own
 * variant, so the effect reads as one coherent idea rather than
 * scattered animation.
 *
 * Respects prefers-reduced-motion via the CSS custom properties
 * defined in tokens.css (--di-rise / --di-blur / --di-scale collapse
 * to 0 / 0 / 1), so this component does not need to branch on the
 * media query itself — it just animates between token-driven values.
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
}) {
  const ref = useRef(null);
  const inView = useInView(ref, {
    once: !repeat,
    margin: "-10% 0px -10% 0px",
  });
  const reduced = useReducedMotion();

  // Mount gate: the first client render must be byte-identical to SSR
  // (window is undefined there), otherwise React 19 throws a hydration
  // mismatch (#418) that kills every client effect on the page —
  // including the Starfield canvas. So observation stays off until the
  // mount commit, then this re-renders with entrances armed.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Progressive enhancement: without IntersectionObserver (old
  // browsers, embedded WebViews) the entrance can never trigger, so
  // render the resting state immediately instead of stranding content
  // at opacity 0. SSR also renders visible (window is undefined),
  // which keeps no-JS and crawlers on the readable markup.
  const canObserve =
    mounted &&
    typeof window !== "undefined" &&
    typeof window.IntersectionObserver === "function";

  const riseVar = size === "sm" ? "var(--di-rise-sm)" : "var(--di-rise)";
  const blurVar = size === "sm" ? "var(--di-blur-sm)" : "var(--di-blur)";

  // Integration tune: 0.85s default so the rise/blur flight stays
  // perceivable across a full slow-scroll pass (tokens, ease, stagger
  // and trigger unchanged — same animation, slightly longer flight).
  const duration = reduced ? 0 : slow ? 1.1 : 0.85;
  const delay = reduced ? 0 : index * (slow ? 0.13 : 0.09);

  const MotionTag = motion[as];

  const hidden = {
    opacity: 0,
    y: riseVar,
    scale: "var(--di-scale)",
    filter: `blur(${blurVar})`,
  };
  const shown = { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" };

  return (
    <MotionTag
      ref={ref}
      className={className}
      initial={canObserve ? hidden : false}
      animate={inView || !canObserve ? shown : undefined}
      transition={{
        duration,
        delay,
        ease: [0.16, 0.9, 0.3, 1],
      }}
      style={{ willChange: inView ? "auto" : "transform, filter, opacity" }}
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
