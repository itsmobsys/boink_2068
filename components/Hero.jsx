"use client";

/* Hero — client orchestrator (boot sequence state only).
   INITIALIZING → IDENTITY FOUND → cinematic staggered reveal.
   Static children stay server-renderable; only this shell is client. */

import { useEffect, useState } from "react";
import Background from "./Background";
import CursorAura from "./CursorAura";
import HeroAvatar from "./HeroAvatar";
import HeroIdentity from "./HeroIdentity";
import HeroMetadata from "./HeroMetadata";
import ScrollIndicator from "./ScrollIndicator";

export default function Hero({ profile, children }) {
  // boot → found → ready. SSR renders "boot" visuals; effects upgrade.
  const [phase, setPhase] = useState("boot");

  useEffect(() => {
    document.body.dataset.state = "boot";
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("found");
      document.body.dataset.state = "ready";
      return;
    }
    const t1 = setTimeout(() => setPhase("found"), 550);
    const t2 = setTimeout(() => {
      setPhase("ready");
      document.body.dataset.state = "ready";
    }, 950);
    // safety: never trap the visitor behind a wait
    const t3 = setTimeout(() => {
      document.body.dataset.state = "ready";
      setPhase("ready");
    }, 2500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <div className="site" style={{ "--accent": profile.accent }}>
      <Background />
      <CursorAura />

      {/* ── HERO · FIRST VIEWPORT ONLY ── */}
      <main className="hero" id="hero">
        {/* boot status: extremely subtle, clears fast */}
        <p className="hero__boot" role="status" aria-live="polite">
          <span className="hero__boot-dot" aria-hidden="true" />
          <span>{phase === "boot" ? "INITIALIZING" : "IDENTITY FOUND"}</span>
        </p>

        <div className="hero__label reveal" style={{ "--d": "0.15s" }}>
          <span className="hero__label-line" aria-hidden="true" />
          <span className="hero__label-text">Digital Identity</span>
          <span className="hero__label-line" aria-hidden="true" />
        </div>

        <HeroAvatar
          displayName={profile.displayName}
          avatarUrl={profile.avatarUrl}
          presence={profile.presence}
        />

        <HeroIdentity
          displayName={profile.displayName}
          username={profile.username}
          personalLine={profile.personalLine}
        />

        <HeroMetadata
          metaAccount={profile.metaAccount}
          metaBadges={profile.metaBadges}
          presence={profile.presence}
        />

        <ScrollIndicator />

        {/* hairline edge: suggests the section below */}
        <div className="hero__edge" aria-hidden="true" />
      </main>

      {/* Step 2+ sections compose here via children — page.js owns the order. */}
      {children}
    </div>
  );
}
