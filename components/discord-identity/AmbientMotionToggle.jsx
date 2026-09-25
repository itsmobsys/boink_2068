"use client";

import { useEffect, useState } from "react";

const MOTION_EVENT = "boink:ambient-motion";
const MOTION_STORAGE_KEY = "boink:ambient-motion";

function readMotionPreference() {
  if (typeof window === "undefined") return true;

  try {
    const stored = window.localStorage.getItem(MOTION_STORAGE_KEY);
    if (stored === "on") return true;
    if (stored === "off") return false;
  } catch {
    // Storage can be unavailable in private or embedded browsing contexts.
  }

  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function applyMotionPreference(enabled) {
  const root = document.querySelector('[data-scope="discord-identity"]');
  if (root) root.dataset.motion = enabled ? "on" : "off";

  window.dispatchEvent(
    new CustomEvent(MOTION_EVENT, {
      detail: { enabled },
    })
  );
}

/**
 * A small explicit opt-in for the decorative background. It follows the
 * operating-system preference by default, but gives users a visible way to
 * turn the ambient motion on without changing their system settings.
 */
export function AmbientMotionToggle() {
  const [enabled, setEnabled] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const next = readMotionPreference();
    setEnabled(next);
    setReady(true);
    applyMotionPreference(next);
  }, []);

  function toggleMotion() {
    const next = !enabled;
    setEnabled(next);
    setReady(true);

    try {
      window.localStorage.setItem(MOTION_STORAGE_KEY, next ? "on" : "off");
    } catch {
      // The visual toggle still works when persistence is unavailable.
    }

    applyMotionPreference(next);
  }

  return (
    <button
      type="button"
      className="di-nav__motion di-mono"
      aria-label={enabled ? "Disable ambient background motion" : "Enable ambient background motion"}
      aria-pressed={ready ? enabled : undefined}
      data-motion-state={ready ? (enabled ? "on" : "off") : "auto"}
      onClick={toggleMotion}
      title={enabled ? "Disable ambient background motion" : "Enable ambient background motion"}
    >
      <span className="di-nav__motion-icon" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span>{ready ? (enabled ? "motion on" : "enable motion") : "motion"}</span>
    </button>
  );
}
