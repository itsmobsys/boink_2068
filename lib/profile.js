/* ═══════════════════════════════════════════════════════════════
   PROFILE — single source of truth for the site (STEPS 1–3)
   ───────────────────────────────────────────────────────────────
   Server-safe module: no window / document access here, so it can
   be imported from server components and (later) server routes.

   PLACEHOLDERS ONLY. Nothing below is presented as real Discord
   data — values stay neutral until the integration lands.

   WHEN DISCORD IS WIRED (later step):
     1. Resolve DISCORD_USER_ID via a server route / server action
        (never expose a bot token client-side — see .env.example).
     2. Return the Discord CDN avatar url, `global_name`, `username`,
        account age (from the snowflake) and badges from getProfile().
     3. Hero consumes the same shape — no rewrite needed.
   ═══════════════════════════════════════════════════════════════ */

export const DISCORD_USER_ID = "920627516694200360";

export const profile = {
  // Shown large under the avatar. Placeholder typography only.
  displayName: "Your Name",

  // Shown as @username. Keep generic until the API lands.
  username: "username",

  // ✎ EDIT ME — short personal line, understated by design.
  personalLine: "building things, breaking things, existing on the internet.",

  // null = refined monogram placeholder (honest, no fake image).
  // Later: `https://cdn.discordapp.com/avatars/${DISCORD_USER_ID}/<hash>.png?size=512`
  avatarUrl: null,

  // Neutral until real Discord data arrives. Do NOT hardcode guesses.
  metaAccount: "Awaiting connection", // later e.g. "Since 2021" (from snowflake)
  metaBadges: "—", // later e.g. "3 badges"

  // Global accent. Later steps may derive this from the Discord profile.
  accent: "#8b8cff",

  // ── ABOUT (STEP 2) ──────────────────────────────────────────
  // ✎ EDIT ME — fictional/demo copy. Clearly temporary, no real
  // personal information. Replace wholesale when final words exist.
  // Not connected to Discord; stays static until a later step says so.
  about: {
    index: "01",
    eyebrow: "About",
    heading: "A little context.",
    contextLabel: "Personal context",
    lede: "Behind every handle is a person. This page is a slow reveal of mine — not a résumé, not a highlight reel, just the shape of someone who spends most of their time thinking, making, and wandering the quieter corners of the internet.",
    body: "I collect ideas the way other people collect tabs. Some become projects, most become notes, and all of them end up as texture here. If the hero was the signal, this is the static around it — deliberately kept, carefully arranged.",
    demoNote: "Demo copy — final text pending.",
    attributes: [
      { label: "Orientation", value: "Depth over noise" },
      { label: "Mode", value: "Observe, then build" },
      { label: "Status", value: "Present" },
    ],
    visual: {
      figure: "Fig. 01",
      signature: "Sig — 01",
      caption: "Identity mark — study 01",
    },
  },

  // ── VIBE (STEP 3) ───────────────────────────────────────────
  // ✎ EDIT ME — fictional/demo personality data. Clearly temporary,
  // no real personal information. Replace wholesale when final data
  // exists. ONE source: `data` below drives BOTH the JSON view and
  // the compiled interpretation — never duplicate values in JSX.
  // Not connected to Discord; stays static until a later step says so.
  vibe: {
    index: "02",
    eyebrow: "The Vibe",
    heading: "Readable by humans.",
    description:
      "This is demo data — a structured sketch of a personality, not a real profile. Press compile and watch the machine reading become a human one.",
    filename: "personality.json",
    data: {
      energy: "late-night / high-focus",
      personality: ["curious", "chaotic", "detail-obsessed"],
      interests: ["technology", "games", "internet culture"],
      likes: ["clean interfaces", "fast systems", "weird ideas"],
      dislikes: ["unnecessary complexity", "generic design"],
      aesthetic: "dark / futuristic / minimal",
      currently: "collecting tabs, shipping drafts",
    },
  },
};

/* Async boundary for the future: page.js already awaits this, so
   swapping in a server-side Discord fetch later changes nothing
   in the presentation layer. */
export async function getProfile() {
  return profile;
}
