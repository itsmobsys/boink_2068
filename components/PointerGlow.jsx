"use client";

/* PointerGlow — one pointer-tracked highlight for a panel that opts in
   by carrying [data-glow]. Renders a single decorative layer and wires
   the pointer to the panel ROOT in globals.css (.glow-layer), never to
   individual children, so a card with fifty links still costs one
   listener.

   Design notes:
   · the layer sits at z-index -1 inside an isolated stacking context,
     so the light washes the panel's own surface and can never soften,
     tint or intercept the text and controls on top of it;
   · fine pointers only — touch devices get the plain resting state,
     and nothing here runs at all under reduced motion;
   · writes are rAF-batched, and only the two custom properties change
     (no layout, no paint invalidation beyond the one layer). */

import { useEffect, useRef } from "react";

export default function PointerGlow() {
  const ref = useRef(null);

  useEffect(() => {
    const layer = ref.current;
    const root = layer && layer.closest("[data-glow]");
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    let raf = 0;
    let px = 0;
    let py = 0;

    const flush = () => {
      raf = 0;
      root.style.setProperty("--mx", px + "px");
      root.style.setProperty("--my", py + "px");
    };
    const onMove = (e) => {
      const r = root.getBoundingClientRect();
      px = e.clientX - r.left;
      py = e.clientY - r.top;
      if (!raf) raf = requestAnimationFrame(flush);
    };
    const onEnter = () => {
      root.dataset.glow = "on";
    };
    const onLeave = () => {
      delete root.dataset.glow;
    };

    root.addEventListener("pointerenter", onEnter);
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    return () => {
      root.removeEventListener("pointerenter", onEnter);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
      delete root.dataset.glow;
    };
  }, []);

  return <span className="glow-layer" aria-hidden="true" ref={ref} />;
}
