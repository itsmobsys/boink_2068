"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Reveal } from "./Reveal";

const PRESENCE_LABEL = {
  online: "online",
  idle: "idle",
  dnd: "do not disturb",
  offline: "offline",
};

function Tagline({ text }) {
  // Lift the closing clause into the accent treatment when the profile
  // copy has the familiar shape. Unknown copy stays completely intact.
  const phrase = "figuring out how they work";
  if (typeof text === "string" && text.includes(phrase)) {
    const [head] = text.split(phrase);
    return (
      <>
        {head}
        <strong>{phrase}.</strong>
      </>
    );
  }
  return <>{text}</>;
}

function HeroAvatar({ profile }) {
  return (
    <div className="di-hero__avatar-wrap">
      <div className="di-hero__avatar-halo" aria-hidden="true" />
      <div className="di-hero__avatar-orbit di-hero__avatar-orbit--one" aria-hidden="true" />
      <div className="di-hero__avatar-orbit di-hero__avatar-orbit--two" aria-hidden="true" />
      <img
        src={profile.avatarUrl}
        alt={`${profile.displayName} (@${profile.username})`}
        className="di-hero__avatar"
        width={180}
        height={180}
        loading="eager"
        decoding="async"
      />
      <span className="di-hero__avatar-ring" aria-hidden="true" />
      <span
        className={`di-presence-dot di-presence-dot--${profile.presence} di-hero__presence`}
        aria-hidden="true"
      />
      <span className="di-hero__status-pill di-mono">
        <span
          className={`di-presence-dot di-presence-dot--${profile.presence}`}
          aria-hidden="true"
        />
        {PRESENCE_LABEL[profile.presence] ?? profile.presence}
      </span>
    </div>
  );
}

export function Hero({ profile, skills }) {
  const reduced = useReducedMotion();
  // Same mount gate as Reveal: the first client render must match SSR
  // exactly (React 19 throws #418 on any mismatch).
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const canObserve =
    mounted &&
    typeof window !== "undefined" &&
    typeof window.IntersectionObserver === "function";

  return (
    <section className="di-section di-hero" aria-label="Introduction">
      <div className="di-hero__aurora" aria-hidden="true" />
      <div className="di-hero__grid-lines" aria-hidden="true" />
      <div className="di-hero__coordinates di-mono" aria-hidden="true">
        <span>00° 00′ 00″</span>
        <span>signal / 001</span>
      </div>

      <div className="di-container di-hero__inner">
        <div className="di-hero__layout">
          <div className="di-hero__copy">
            <Reveal>
              <p className="di-hero__kicker di-mono">
                <span className="di-hero__kicker-line" aria-hidden="true" />
                A living profile <span>/</span> 01
              </p>
            </Reveal>

            <Reveal index={1}>
              <h1 className="di-hero__name">{profile.displayName}</h1>
            </Reveal>

            <Reveal index={2}>
              <div className="di-hero__meta-row di-mono">
                <span className="di-hero__username">@{profile.username}</span>
                <span className="di-hero__meta-separator" aria-hidden="true">
                  /
                </span>
                <span className="di-hero__meta-caption">
                  {profile.memberSinceLabel || "discord identity"}
                </span>
              </div>
            </Reveal>

            <Reveal index={3}>
              <p className="di-hero__tagline">
                <Tagline text={profile.tagline} />
              </p>
            </Reveal>

            <Reveal index={4}>
              <div className="di-hero__actions">
                <a
                  className="di-github-button di-github-button--primary di-mono"
                  href="https://github.com/itsmobsys"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Visit itsmobsys on GitHub (opens in new tab)"
                >
                  <svg
                    className="di-github-button__icon"
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="currentColor"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                  </svg>
                  <span>View GitHub</span>
                </a>
                <a className="di-github-button di-mono" href="#di-about">
                  <span>Explore the signal</span>
                  <span aria-hidden="true">↘</span>
                </a>
              </div>
            </Reveal>

            <Reveal index={5}>
              <div className="di-hero__microcopy di-mono">
                <span className="di-hero__microcopy-mark" aria-hidden="true" />
                <span>Scroll to decode the layers</span>
              </div>
            </Reveal>
          </div>

          <Reveal index={2} size="sm" className="di-hero__visual">
            <div className="di-hero__profile-card" data-presence={profile.presence}>
              <div className="di-hero__card-top di-mono">
                <span>PROFILE / 001</span>
                <span className="di-hero__card-live">
                  <span
                    className={`di-presence-dot di-presence-dot--${profile.presence}`}
                    aria-hidden="true"
                  />
                  live identity
                </span>
              </div>
              <HeroAvatar profile={profile} />
              <div className="di-hero__card-copy">
                <p className="di-hero__card-label di-mono">display name</p>
                <p className="di-hero__card-name">{profile.displayName}</p>
                <p className="di-hero__card-handle di-mono">@{profile.username}</p>
              </div>
              <div className="di-hero__card-divider" aria-hidden="true" />
              <div className="di-hero__card-bottom di-mono">
                <span>{profile.location || "identity / in motion"}</span>
                <span className="di-hero__card-signal" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
              </div>
              <div className="di-hero__card-scan" aria-hidden="true" />
            </div>
          </Reveal>
        </div>

        <Reveal index={7} className="di-hero__toolkit">
          <div className="di-hero__toolkit-head di-mono">
            <span>Toolkit / active surfaces</span>
            <span>{String(skills.length).padStart(2, "0")} loaded</span>
          </div>
          <ul className="di-hero__skills" role="list">
            {skills.map((skill, i) => (
              <motion.li
                key={skill.label}
                className="di-chip"
                data-group={skill.group}
                tabIndex={0}
                initial={!canObserve || reduced ? false : { opacity: 0, y: 12 }}
                whileInView={
                  !canObserve || reduced ? { opacity: 1 } : { opacity: 1, y: 0 }
                }
                viewport={{ once: true, margin: "-5% 0px" }}
                transition={{
                  duration: reduced ? 0 : 0.45,
                  delay: reduced ? 0 : 0.05 + i * 0.03,
                  ease: [0.16, 0.9, 0.3, 1],
                }}
                whileHover={reduced ? undefined : { y: -3 }}
              >
                <span className="di-chip__dot" aria-hidden="true" />
                <span className="di-chip__label">{skill.label}</span>
              </motion.li>
            ))}
          </ul>
        </Reveal>

        <Reveal index={8} className="di-hero__scroll-cue di-mono">
          <a href="#di-about" tabIndex={-1}>
            <span>begin / 01</span>
            <span className="di-hero__scroll-line" />
          </a>
        </Reveal>
      </div>
    </section>
  );
}
