/* ═══════════════════════════════════════════════════════════════
   PROFILE — single source of truth for the site (FINAL).
   ───────────────────────────────────────────────────────────────
   THREE DATA CATEGORIES — do not mix them:

   1. DISCORD-OWNED (live, server-side only)
      id / username / globalName / avatarUrl / bannerUrl /
      accentColor / createdYear / badgeCount — resolved by
      lib/discord.js via the identify-scope OAuth flow and merged
      below. Never hardcode these; never expose tokens.

   2. SITE-OWNED (curated, edited here)
      personalLine / about / vibe / things / currently / final —
      the owner's real words. Updating the site means editing this
      file. Nothing here comes from Discord.

   3. UI STATE (computed in components, never stored here)
      boot phase / compile phase / thought index / reveal states.

   Server-safe module: no window / document access, so it can be
   imported from server components, routes, and metadata.
   ═══════════════════════════════════════════════════════════════ */

import { getDiscordProfile } from "./discord.js";
import { defaultAvatarUrl, pickAccent, snowflakeYear } from "./discord-utils.mjs";

export const DISCORD_USER_ID = "920627516694200360";

// Local identity fallback, used ONLY until the Discord API is
// connected (or if it ever fails). Real handle, zero invented data —
// the live global_name/username replace these automatically.
const FALLBACK_USERNAME = "boink_2068";

/* ── SITE-OWNED CONTENT (category 2 — edit freely) ───────────── */

const site = {
  // ✎ Curated sentence. Discord provides no bio — this is yours.
  personalLine: "Building things, breaking things, and figuring out how they work.",

  about: {
    index: "01",
    eyebrow: "About",
    heading: "A little context.",
    contextLabel: "The human",
    lede: "I build things because I can't not build things. Websites, bots, automation, backend systems — if something can be made, taken apart, or made faster, I'm already halfway into it. Most of what I know came from breaking things first and reading the error messages after.",
    body: "AI does its best work in my setup as a tool, not a miracle — models get benchmarked, agents get tested, tokens get counted. The rest of the time goes to Linux installs that didn't need to happen, hardware that should probably be retired, games running on machines that were never invited, and Discord communities full of people building weirder stuff than me.",
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

  // Vibe is SITE-OWNED by nature: Discord has no personality model.
  // ONE source: `data` drives BOTH the JSON view and the compiled
  // interpretation — never duplicate values in JSX.
  vibe: {
    index: "02",
    eyebrow: "The Vibe",
    heading: "Readable by humans.",
    description:
      "A structured sketch of how I operate — written by me, not measured by anything. Press compile and watch the machine reading become a human one.",
    filename: "personality.json",
    data: {
      energy: "late-night / high-focus / always experimenting",
      personality: ["curious", "detail-obsessed", "productively chaotic", "persistent"],
      interests: [
        "coding",
        "AI",
        "automation",
        "Discord",
        "gaming",
        "Linux",
        "hardware",
        "web systems",
        "internet culture",
      ],
      likes: [
        "clean interfaces",
        "fast systems",
        "useful automation",
        "clever solutions",
        "low resource usage",
        "weird experiments",
      ],
      dislikes: [
        "unnecessary complexity",
        "bloated software",
        "slow tooling",
        "repetitive work",
        "generic design",
        "simple things made difficult",
      ],
      aesthetic: "dark / futuristic / minimal / technical / cinematic",
      currently: "see the Currently section — it moves too fast",
    },
  },

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
        title: "Websites, tools, bots, and ideas that became real.",
        description:
          "If it can be built, automated, or wired into a backend, it's already on my list. Most projects start as “I wonder if this could work” and end as systems people actually use.",
        detail: "Motive: curiosity",
      },
      {
        index: "02",
        label: "Break",
        title: "Poking systems until they show how they work.",
        description:
          "Experimenting, debugging, changing things to see what happens — then fixing what I broke while learning exactly why it broke.",
        detail: "Casualties: several setups",
      },
      {
        index: "03",
        label: "Experiment",
        title: "Always testing the next model, agent, or stack.",
        description:
          "New AI models, coding agents, frameworks, APIs, workflows — everything gets tried, compared, and judged on speed versus quality. The hunt for the setup that just gets it never really ends.",
        detail: "Currently: probably benchmarking something",
      },
      {
        index: "04",
        label: "Optimize",
        title: "Less CPU, less RAM, fewer tokens, less waiting.",
        description:
          "Cutting latency, complexity, and resource usage wherever it hides. If something is slow, bloated, or doing work nobody asked for, it gets fixed or replaced.",
        detail: "Philosophy: less, but faster",
      },
      {
        index: "05",
        label: "Automate",
        title: "Repetitive work becomes a script. Always.",
        description:
          "Tasks done twice turn into scripts, bots, and workflows. Boring work is a bug, and automation is the patch.",
        detail: "Manual labor: declined",
      },
      {
        index: "06",
        label: "Play",
        title: "Games on hardware that has to try harder.",
        description:
          "Gaming and experimenting — single-player rabbit holes, settings pushed until something gives, old machines punching above their weight.",
        detail: "Graphics: whatever runs",
      },
      {
        index: "07",
        label: "Lurk",
        title: "Around Discord, internet culture, and rabbit holes.",
        description:
          "Hanging out in communities, following interesting projects, falling into technical rabbit holes. Mostly quiet, occasionally emerging with something useful.",
        detail: "Status: present, mostly quiet",
      },
    ],
    loop: {
      caption: "The loop. It has no exit condition.",
      steps: ["Build", "Break", "Debug", "Optimize", "Ship", "Build again"],
    },
    closing: "Status: still experimenting",
  },

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
        "This website — turning a Discord identity into a place on the internet.",
      state: "State // Active",
    },
    states: [
      {
        name: "Experimenting",
        value:
          "New AI models and coding agents — same benchmark gauntlet, new contenders.",
        glyph: "◐",
      },
      {
        name: "Playing",
        value: "Something from the backlog, on hardware doing its best.",
        glyph: "○",
      },
      {
        name: "Learning",
        value: "Where the real latency in my setup actually lives.",
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
        value: "Shaving seconds off things nobody else times.",
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

/* ── COMPOSITION (categories 1 + 2 → what components render) ────
   Async boundary: Discord resolves here, components stay unaware.
   Every field below is safe for the browser — tokens never leave
   lib/discord.js. Anything Discord can't provide falls back to
   truthful local values (never invented data). */
export async function getProfile() {
  let discord = null;
  try {
    discord = await getDiscordProfile();
  } catch {
    discord = null;
  }

  // Display priority: live global_name → live username → local handle.
  const username = discord?.username || FALLBACK_USERNAME;
  const displayName = discord?.globalName || username;
  // Account age is factual from the known user ID — no API needed.
  const createdYear = discord?.createdYear || snowflakeYear(DISCORD_USER_ID);
  const badgeCount = discord?.badgeCount ?? 0;

  return {
    displayName,
    username,
    personalLine: site.personalLine,
    // Live avatar when linked; otherwise Discord's own default avatar
    // for this user ID (real CDN asset, upgrades automatically).
    avatarUrl: discord?.avatarUrl || defaultAvatarUrl(DISCORD_USER_ID),
    // Validated Discord accent or the house accent — never unreadable.
    accent: pickAccent(discord?.accentColor ?? null),
    metaAccount: `Since ${createdYear}`,
    metaBadges: !discord
      ? "Not linked"
      : badgeCount > 0
        ? `${badgeCount} Badge${badgeCount > 1 ? "s" : ""}`
        : "No badges",
    // Safe normalized Discord subset (or null) — for future use.
    discord,
    about: site.about,
    vibe: site.vibe,
    things: site.things,
    currently: site.currently,
    final: site.final,
  };
}
