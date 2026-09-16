"use client";

import "./tokens.css";
import "./discord-identity.css";

import { Hero } from "./Hero";
import { About } from "./About";
import { Vibe } from "./Vibe";
import { ThingsIDo } from "./ThingsIDo";
import { Currently } from "./Currently";
import { Final } from "./Final";
import { Starfield } from "./Starfield";

/**
 * Top-level page component. Purely presentational — all content
 * comes in via `data`, composed by lib/discord-identity/adapt.js from
 * the existing backend (lib/profile.js: live Discord identity merged
 * with site-owned content). Nothing here fetches, authenticates, or
 * touches the backend — it just renders the finished object.
 */
export function DiscordIdentityPage({ data }) {
  return (
    <div data-scope="discord-identity" className="di-root">
      <Starfield />
      <Hero profile={data.profile} skills={data.skills} />
      <About about={data.about} />
      <Vibe vibe={data.vibe} />
      <ThingsIDo things={data.things} />
      <Currently currently={data.currently} />
      <Final final={data.final} />
    </div>
  );
}
