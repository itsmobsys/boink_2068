"use client";

/* HeroAvatar — client component (pointer parallax + image load state).
   Rounded tile (~30px), blurred duplicate lighting, halo, sheen.
   Restrained: max ~8px translation, ~3.5deg tilt, hover scale 1.015. */

import { useEffect, useRef, useState } from "react";

export default function HeroAvatar({ displayName, avatarUrl }) {
  const wrapRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const showImg = Boolean(avatarUrl) && !failed;
  // Monogram fallback: first letter of the live (or fallback) name.
  const monogram = ((displayName || "—").trim().charAt(0) || "—").toUpperCase();

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const scope = wrap.closest("main") || window;
    let raf = 0;
    let tx = 0,
      ty = 0,
      cx = 0,
      cy = 0;

    const render = () => {
      raf = 0;
      cx += (tx - cx) * 0.075;
      cy += (ty - cy) * 0.075;
      wrap.style.setProperty("--px", cx.toFixed(2) + "px");
      wrap.style.setProperty("--py", cy.toFixed(2) + "px");
      wrap.style.setProperty("--ry", (cx * 0.42).toFixed(2) + "deg");
      wrap.style.setProperty("--rx", (-cy * 0.42).toFixed(2) + "deg");
      wrap.style.setProperty("--lx", (cx * 3).toFixed(2) + "px");
      wrap.style.setProperty("--ly", (cy * 3).toFixed(2) + "px");
      if (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) {
        raf = requestAnimationFrame(render);
      }
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };

    const onMove = (e) => {
      const r = wrap.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / window.innerWidth;
      const dy = (e.clientY - (r.top + r.height / 2)) / window.innerHeight;
      tx = Math.max(-1, Math.min(1, dx)) * 8;
      ty = Math.max(-1, Math.min(1, dy)) * 8;
      kick();
    };
    const onLeave = () => {
      tx = 0;
      ty = 0;
      kick();
    };

    scope.addEventListener("pointermove", onMove);
    scope.addEventListener("pointerleave", onLeave);
    return () => {
      scope.removeEventListener("pointermove", onMove);
      scope.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      className="hero-avatar reveal"
      style={{ "--d": "0.3s" }}
      id="avatarWrap"
      data-magnetic
      ref={wrapRef}
    >
      {/* blurred duplicate → atmospheric lighting, no extra image request */}
      <div className="hero-avatar__halo" aria-hidden="true" />
      <div className="hero-avatar__blur" aria-hidden="true" />

      <div className="hero-avatar__tilt">
        <div className="hero-avatar__frame">
          {/* fallback tile: correct size, no layout shift */}
          <div className="hero-avatar__fallback" aria-hidden="true">
            <span className="hero-avatar__monogram">{monogram}</span>
            <span className="hero-avatar__fallback-shimmer" />
          </div>
          {/* real avatar fades in over the fallback once decoded */}
          {showImg && (
            <img
              className={"hero-avatar__img" + (loaded ? " is-loaded" : "")}
              src={avatarUrl}
              alt={displayName + " avatar"}
              draggable={false}
              onLoad={() => setLoaded(true)}
              onError={() => setFailed(true)}
            />
          )}
          <div className="hero-avatar__sheen" aria-hidden="true" />
          <div className="hero-avatar__border" aria-hidden="true" />
        </div>
      </div>

      {/* presence dot: decorative until a future presence layer lands */}
      <div className="hero-avatar__presence" title="Discord presence">
        <span className="hero-avatar__presence-dot" />
      </div>
    </div>
  );
}
