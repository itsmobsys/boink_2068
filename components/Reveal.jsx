"use client";

/* Reveal — tiny viewport-reveal primitive (client).
   IntersectionObserver, fires once, then disconnects. Zero idle cost:
   no scroll listeners, no animation library. Siblings of the hero's
   boot-sequence reveal system — separate namespace, same philosophy. */

import { useEffect, useRef } from "react";

export default function Reveal({ children, delay = "0s", className = "" }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("is-visible");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target); // animate once, never replay
          }
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`reveal-scroll${className ? " " + className : ""}`} style={{ "--d": delay }}>
      {children}
    </div>
  );
}
