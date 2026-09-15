/* ═══════════════════════════════════════════════════════════════
   PROFILE — single source of truth for the site (STEPS 1–6, FINAL)
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

  // ── THINGS I DO (STEP 4) ────────────────────────────────────
  // ✎ EDIT ME — fictional/demo behaviors. Recurring patterns, not
  // credentials: no skills, stats, timelines, or experience claims.
  // ONE source: `items` below drives desktop and mobile alike.
  // Not connected to any API; stays static until a later step says so.
  things: {
    index: "03",
    eyebrow: "Habits",
    heading: "Things I keep doing.",
    intro:
      "Nobody assigned me these tasks. They just keep happening — usually late at night, usually because something annoyed me or intrigued me. This is less a skill list and more a confession.",
    items: [
      {
        index: "01",
        label: "Build",
        title: "If it doesn't exist, that's a to-do list.",
        description:
          "Websites, bots, tools, automation, backend glue, weird little utilities. Most of it starts as “I wonder if I can make this work” and ends as a system nobody asked for.",
        detail: "Motive: curiosity",
      },
      {
        index: "02",
        label: "Break",
        title: "Poking systems until they explain themselves.",
        description:
          "Testing limits, changing things to see what happens, reverse-engineering behavior, then debugging failures I personally caused five minutes earlier.",
        detail: "Casualties: several setups",
      },
      {
        index: "03",
        label: "Experiment",
        title: "Chasing the model that just gets it.",
        description:
          "Constantly testing AI models against each other — speed versus quality, tokens versus brains, local versus cloud, agent workflow #47 versus #48.",
        detail: "Currently: probably benchmarking something",
      },
      {
        index: "04",
        label: "Optimize",
        title: "Why spend 100 resources when 20 will do?",
        description:
          "Speed, memory, tokens, watts. Stripping complexity out of systems and cost out of running them. Low-end hardware is a dare, not a limitation.",
        detail: "Philosophy: less, but faster",
      },
      {
        index: "05",
        label: "Automate",
        title: "Done twice means it gets a script.",
        description:
          "If a task repeats, it becomes code. Bots, schedulers, shortcuts — anything to never do the boring part again.",
        detail: "Manual labor: declined",
      },
      {
        index: "06",
        label: "Play",
        title: "Finding out what this hardware can actually do.",
        description:
          "Single-player rabbit holes, settings menus treated as gameplay, games running on machines that were never invited. Squeezing performance is half the fun.",
        detail: "Graphics: whatever runs",
      },
      {
        index: "07",
        label: "Lurk",
        title: "Hanging around where the interesting people are.",
        description:
          "Discord servers, niche communities, community bots and infrastructure. Not posting much — watching, building, occasionally emerging with something useful.",
        detail: "Status: present, mostly quiet",
      },
    ],
    loop: {
      caption: "The loop. It has no exit condition.",
      steps: ["Build", "Break", "Debug", "Optimize", "Ship", "Build again"],
    },
    closing: "Status: still experimenting",
  },

  // ── CURRENTLY (STEP 5) ──────────────────────────────────────
  // ✎ EDIT ME — fictional/demo snapshot. Temporary by design: this
  // section describes a *state*, not credentials — no skills, stats,
  // timelines, or experience claims. ONE source: everything below
  // drives the whole section, desktop and mobile alike.
  // Not connected to any API; no real-time behavior is implied.
  currently: {
    index: "04",
    eyebrow: "Currently",
    heading: "What I'm doing right now.",
    intro:
      "Nothing here is permanent. This is a snapshot of the current rotation — projects, rabbit holes, and open loops. It will be outdated by the time you finish reading it, and that's the point.",
    snapshotLabel: "State snapshot // 04",
    updatedLabel: "Last updated // Demo",
    featured: {
      label: "Currently building",
      statement:
        "Something that started as a “quick idea” and now has its own folder structure.",
      state: "State // Active",
    },
    states: [
      {
        name: "Experimenting",
        value:
          "Pitting coding agents against each other to see which one survives contact with my codebase.",
        glyph: "◐",
      },
      {
        name: "Playing",
        value:
          "A single-player game my hardware has no business running. It's running.",
        glyph: "○",
      },
      {
        name: "Learning",
        value:
          "The exact point where optimization stops mattering. Haven't found it. Will keep looking.",
        glyph: "◌",
      },
      {
        name: "Thinking about",
        value:
          "Whether every personal website secretly wants to be an operating system.",
        glyph: "+",
      },
      {
        name: "Obsessed with",
        value: "Boot times. Of everything. Including things that don't boot.",
        glyph: "✦",
      },
    ],
    snapshots: [
      "Current thought // Why does this need to exist? Follow-up: why not?",
      "System note // This started as a five-minute idea.",
      "Current thought // The settings menu is part of the game.",
      "System note // It works. Do not touch it. (Touching it.)",
      "Current thought // Less, but faster.",
    ],
    snapshotButton: "Random snapshot",
    loop: ["Build", "Break", "Fix", "Optimize", "Repeat"],
  },

  // ── FINAL (STEP 6 — THE END) ────────────────────────────────
  // ✎ EDIT ME — fictional/demo closing copy. Temporary by design.
  // ONE source: `thoughts` below is the full Random Thought dataset
  // (~14 entries so repeats stay rare); name/avatar come from the
  // profile root above, never duplicated here. No APIs, no tracking.
  final: {
    index: "05",
    eyebrow: "The End",
    statement: "You found me.",
    sub: "That's enough context. Still building.",
    thoughtLabel: "Random thought",
    thoughtCounter: "Thought",
    sessionNote: "End of current session",
    backToTop: "Back to top",
    loop: ["Identity", "Context", "Vibe", "Habits", "Current state", "Identity"],
    thoughts: [
      "This started as a five-minute idea.",
      "I probably optimized something that didn't need optimizing.",
      "There is almost certainly another tab open.",
      "This could have been simpler.",
      "I am probably testing something right now.",
      "Ship it, then immediately think about version two.",
      "The best interface is the one you stop noticing.",
      "Debug first, blame the cache later.",
      "Somewhere, a script I wrote is still running.",
      "Simple is a direction, not a destination.",
      "If it looks easy, you missed the interesting part.",
      "Documentation is a love letter to future me. Sorry, future me.",
      "Every system reveals itself if you poke it right.",
      "Done is a feature.",
    ],
  },
};

/* Async boundary for the future: page.js already awaits this, so
   swapping in a server-side Discord fetch later changes nothing
   in the presentation layer. */
export async function getProfile() {
  return profile;
}
