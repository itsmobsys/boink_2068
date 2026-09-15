"use client";

/* SceneContinuity — mounts once (inside Hero), observes everything.
   Wires every [data-scene] node (hero + the five sections) into the
   single shared scene observer from motion.js. Renders nothing, ships
   no visuals, owns no state: section hairlines, the hero → about
   lighting transition, and the subtle past-scene dimming all key off
   the is-inview / is-past classes and body[data-scene] this sets. */

import { useEffect } from "react";
import { observeScene } from "./motion";

export default function SceneContinuity() {
  useEffect(() => {
    const cleanups = [];
    // Landmarks only — never `body`: the hero publishes
    // body[data-scene], so a bare [data-scene] selector would observe
    // the body itself on remount and fight the hero signal.
    const nodes = document.querySelectorAll("main[data-scene], section[data-scene]");
    nodes.forEach((el) => cleanups.push(observeScene(el)));
    return () => {
      for (const fn of cleanups) fn();
    };
  }, []);
  return null;
}
