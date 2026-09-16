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
        </div>

        <Reveal index={5} className="di-hero__skills-wrap">
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
