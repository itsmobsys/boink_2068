"use client";

import { motion } from "motion/react";
import { Reveal } from "./Reveal";

const PRESENCE_LABEL = {
  online: "online",
  idle: "idle",
  dnd: "do not disturb",
  offline: "offline",
};

export function Hero({ profile, skills }) {
  return (
    <section className="di-section di-hero" aria-label="Introduction">
      <div className="di-container di-hero__inner">
        <div className="di-hero__identity">
          <Reveal size="sm">
            <div className="di-hero__avatar-wrap">
              <div className="di-hero__avatar-halo" aria-hidden="true" />
              <img
                src={profile.avatarUrl}
                alt=""
                className="di-hero__avatar"
                width={180}
                height={180}
              />
              <span
                className={`di-presence-dot di-presence-dot--${profile.presence} di-hero__presence`}
                aria-hidden="true"
              />
            </div>
          </Reveal>

          <Reveal index={1}>
            <h1 className="di-hero__name">{profile.displayName}</h1>
          </Reveal>

          <Reveal index={2}>
            <div className="di-hero__meta-row di-mono">
              <span className="di-hero__username">@{profile.username}</span>
              <span className="di-hero__dot" aria-hidden="true">
                ·
              </span>
              <span className="di-hero__presence-label">
                <span
                  className={`di-presence-dot di-presence-dot--${profile.presence}`}
                  aria-hidden="true"
                />
                {PRESENCE_LABEL[profile.presence]}
                {profile.presenceDetail ? ` — ${profile.presenceDetail}` : ""}
              </span>
            </div>
          </Reveal>

          <Reveal index={3}>
            <p className="di-hero__tagline">{profile.tagline}</p>
          </Reveal>

          {(profile.location || profile.timezoneLabel || profile.memberSinceLabel) && (
            <Reveal index={4}>
              <ul className="di-hero__meta-list di-mono">
                {profile.location && <li>{profile.location}</li>}
                {profile.timezoneLabel && <li>{profile.timezoneLabel}</li>}
                {profile.memberSinceLabel && <li>{profile.memberSinceLabel}</li>}
              </ul>
            </Reveal>
          )}

          <Reveal index={5}>
            <div className="di-hero__actions">
              <a
                className="di-github-button di-mono"
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
                <span>GitHub</span>
              </a>
            </div>
          </Reveal>
        </div>

        <Reveal index={6} className="di-hero__skills-wrap">
          <ul className="di-hero__skills" role="list">
            {skills.map((skill, i) => (
              <motion.li
                key={skill.label}
                className="di-chip"
                data-group={skill.group}
                initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true, margin: "-5% 0px" }}
                transition={{
                  duration: 0.5,
                  delay: 0.5 + i * 0.035,
                  ease: [0.16, 0.9, 0.3, 1],
                }}
                whileHover={{ y: -3 }}
              >
                <span className="di-chip__dot" aria-hidden="true" />
                <span className="di-chip__label">{skill.label}</span>
              </motion.li>
            ))}
          </ul>
          <ul className="di-hero__skills-legend di-mono" aria-hidden="true">
            {SKILL_GROUP_ORDER.map((group) => (
              <li key={group} data-group={group}>
                <span className="di-chip__dot" />
                {SKILL_GROUP_LABEL[group]}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

const SKILL_GROUP_ORDER = [
  "frontend",
  "backend",
  "infra",
  "ai",
  "tooling",
  "platform",
];

const SKILL_GROUP_LABEL = {
  frontend: "frontend",
  backend: "backend",
  infra: "infrastructure",
  ai: "ai",
  tooling: "tooling",
  platform: "platforms",
};
