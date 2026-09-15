"use client";

/* CursorAura — client component (pointer tracking + hover state).
   Native pointer stays. Adds a subtle ~5px dot + soft trailing ring.
   Fine-pointer devices only; disabled with reduced motion. */

import { useEffect, useRef } from "react";

export default function CursorAura() {
  const rootRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const root = rootRef.current;
    if (!root) return;

    let mx = -100,
      my = -100,
      rx = -100,
      ry = -100;
    let raf = 0;

    const onMove = (e) => {
      mx = e.clientX;
      my = e.clientY;
      root.style.setProperty("--cx", mx + "px");
      root.style.setProperty("--cy", my + "px");
    };

    const follow = () => {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      root.style.setProperty("--rx2", rx + "px");
      root.style.setProperty("--ry2", ry + "px");
      raf = requestAnimationFrame(follow);
    };
    raf = requestAnimationFrame(follow);

    const targets = Array.from(document.querySelectorAll("[data-magnetic], a, button"));
    const onEnter = () => root.classList.add("is-hover");
    const onLeave = () => root.classList.remove("is-hover");
    targets.forEach((el) => {
      el.addEventListener("pointerenter", onEnter);
      el.addEventListener("pointerleave", onLeave);
    });

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      targets.forEach((el) => {
        el.removeEventListener("pointerenter", onEnter);
        el.removeEventListener("pointerleave", onLeave);
      });
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="cursor" aria-hidden="true" ref={rootRef}>
      <div className="cursor__ring" />
      <div className="cursor__dot" />
    </div>
  );
}
