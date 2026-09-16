"use client";

/* SceneContinuity — mounts once (inside Hero), observes everything.
   Wires every [data-scene] node (hero + the five sections) into the
   single shared scene observer from motion.js, adds the viewport-phase
   glide classes, and starts the one shared scroll-velocity defocus
   loop. Renders nothing, ships no visuals, owns no state: section
   hairlines, the hero → about lighting transition, the subtle
   past-scene dimming and the temporary scroll defocus all key off the
   classes / custom properties this sets. */

import { useEffect } from "react";
import { initScrollMotion, observeScene, observeViewportPhase } from "./motion";

export default function SceneContinuity() {
  useEffect(() => {
    const cleanups = [];
    // Landmarks only — never `body`: the hero publishes
    // body[data-scene], so a bare [data-scene] selector would observe
    // the body itself on remount and fight the hero signal.
    const nodes = document.querySelectorAll("main[data-scene], section[data-scene]");
    nodes.forEach((el) => cleanups.push(observeScene(el)));

    /* Site-wide viewport glide: the five section roots ride the same
       shared viewport-phase observer as the Vibe deck (vp-below /
       vp-center / vp-above classes; CSS in globals.css). The class is
       added here — client-side only, so SSR markup and hydration stay
       identical. Restrained by design: approach softens, center rests
       crisp, leaving only drifts (is-past already dims the inner). */
    const sections = document.querySelectorAll(".about, .vibe, .things, .currently, .final");
    sections.forEach((el) => {
      el.classList.add("scene-root");
      cleanups.push(observeViewportPhase(el));
    });

    /* Shared scroll state — ONE scroll listener + ONE rAF loop for the
       whole page. Publishes --sblur / --sdepth and
       html[data-scroll-motion="on"] while the page is moving; only the
       gated layers in globals.css react. Returns a disposer. */
    cleanups.push(initScrollMotion());

    return () => {
      for (const fn of cleanups) fn();
    };
  }, []);
  return null;
}
