/* ═══════════════════════════════════════════════════════════════
   PROFILE — single source of truth for the site (FINAL).
   ───────────────────────────────────────────────────────────────
   THREE DATA CATEGORIES — do not mix them:

   1. DISCORD-OWNED (live, server-side only)
      id / username / globalName / avatarUrl / bannerUrl /
      accentColor / createdYear / badgeCount — resolved by
      lib/discord.js via the identify-scope OAuth flow and merged
      below. Never hardcode these; never expose tokens.
      Live presence ({ status, available, source }) arrives through
      the separate Railway Gateway bridge (lib/discord-presence.js)
      and merges into `discord.presence` — OAuth and presence fail
      independently by design.

   2. SITE-OWNED (curated, edited here)
      personalLine / about / vibe / things / currently / final —
      the owner's real words. Updating the site means editing this
      file. Nothing here comes from Discord.

   3. UI STATE (computed in components, never stored here)
      boot phase / compile phase / thought index / reveal states.

   Server-safe module: no window / document access, so it can be
   imported from server components, routes, and metadata.
   ═══════════════════════════════════════════════════════════════ */

import { getDiscordPresence, getDiscordProfile } from "./discord.js";
import { PRESENCE_LABELS, UNAVAILABLE_PRESENCE } from "./discord-presence.mjs";
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

  // ✎ Toolbelt chips under the Hero metadata. Site-owned like all
  // copy: { name, color } — color tints ONLY the tiny dot (plus a
  // whisper of glow on hover), never the chip itself.
  skills: [
    { name: "Node.js", color: "#6cc24a" },
    { name: "Next.js", color: "#c9c9d4" },
    { name: "React", color: "#61dafb" },
    { name: "JavaScript", color: "#f7df1e" },
    { name: "TypeScript", color: "#3178c6" },
    { name: "HTML", color: "#e34f26" },
    { name: "CSS", color: "#1572b6" },
    { name: "Python", color: "#4b8bbe" },
    { name: "Flask", color: "#b0b7c3" },
    { name: "SQL", color: "#6e8efb" },
    { name: "PostgreSQL", color: "#4169e1" },
    { name: "SQLite", color: "#0f80cc" },
    { name: "Redis", color: "#dc382d" },
    { name: "REST APIs", color: "#7fb3ff" },
    { name: "Linux", color: "#e0862a" },
    { name: "Git", color: "#f05032" },
    { name: "GitHub", color: "#c9c9d4" },
    { name: "Docker", color: "#2496ed" },
    { name: "Docker Compose", color: "#2496ed" },
    { name: "AWS", color: "#ff9900" },
    { name: "Vercel", color: "#ffffff" },
    { name: "Railway", color: "#8f9aa3" },
    { name: "Render", color: "#46e3b7" },
    { name: "GitHub Actions", color: "#2088ff" },
    { name: "Playwright", color: "#45ba4b" },
    { name: "Discord", color: "#5865f2" },
    { name: "Ollama", color: "#d0d0d8" },
    { name: "OpenRouter", color: "#a78bfa" },
    { name: "AI", color: "#f472b6" },
    { name: "AI Agents", color: "#c084fc" },
  ],

  about: {
    index: "01",
    eyebrow: "About",
    heading: "A little context.",
    contextLabel: "In short",
    lede: "I build websites, bots, and backend systems, and I take things apart to find out how they work. If something can be automated, rebuilt, or made faster, I'm usually already halfway into it. Most of what I know came from breaking something first and reading the error message after.",
    body: "I treat AI as a tool rather than a shortcut — models get benchmarked, coding agents get tested, and I keep track of what actually costs time and money to run. The rest of it goes into Linux installs I didn't need, hardware that should have been retired years ago, games running on machines that were never meant for them, and Discord servers full of people building stranger things than I am.",
    attributes: [
      { label: "Focus", value: "Web apps, bots, and automation" },
      { label: "Approach", value: "Build it, break it, fix it properly" },
      { label: "Found at", value: "Mostly around Discord" },
    ],
    visual: {
      figure: "Fig. 01",
      signature: "Sig — 01",
      caption: "Identity mark",
    },
  },

  // Vibe is SITE-OWNED by nature: Discord has no personality model.
  // ONE source: `data` drives BOTH the JSON view and the compiled
  // interpretation — never duplicate values in JSX.
  vibe: {
    index: "02",
    eyebrow: "The Vibe",
    heading: "One file, two readings.",
    description:
      "A short JSON file describing how I work — energy, personality, interests, likes, dislikes, aesthetic. It's written by me, not measured by anything. Press Compile and the same data comes back in plain English.",
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
      currently: "tracked in the Currently section below",
    },
  },

  things: {
    index: "03",
    eyebrow: "Habits",
    heading: "Things I keep doing.",
    intro:
      "Nobody assigned me these. They just keep happening — usually late at night, usually because one thing annoyed me or looked interesting. Less a skill list, more a log of what I actually spend time on.",
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
    updatedLabel: "Updated // September 2026",
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
        value: "Whether this site needs another section, or fewer.",
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
      "I'm probably testing something right now.",
      "Ship it, then immediately start thinking about version two.",
      "Debug first, blame the cache later.",
      "Somewhere, a script I wrote is still running.",
      "One small thing on this page annoyed me into building the whole site.",
      "The bug is always in the part I was sure was fine.",
      "Everything here is version two of something.",
      "I'll tidy that up later. I won't.",
      "There's a faster way to do this, and I'll find it at 2am.",
    ],
  },
};

/* ── COMPOSITION (categories 1 + 2 → what components render) ────
   Async boundary: Discord resolves here, components stay unaware.
   Every field below is safe for the browser — tokens never leave
   lib/discord.js. Anything Discord can't provide falls back to
   truthful local values (never invented data). */
export async function getProfile() {
  // OAuth identity and Gateway presence resolve in parallel and fail
  // independently: a dead bridge must not kill the avatar, and a
  // revoked token must not kill the status dot. Both never throw.
  const [discord, bridgePresence] = await Promise.all([getDiscordProfile(), getDiscordPresence()]);

  // Display priority: live global_name → live username → local handle.
  const username = discord?.username || FALLBACK_USERNAME;
  const displayName = discord?.globalName || username;
  // Account age is factual from the known user ID — no API needed.
  const createdYear = discord?.createdYear || snowflakeYear(DISCORD_USER_ID);
  const badgeCount = discord?.badgeCount ?? 0;

  // Presence labels are computed server-side so components stay dumb:
  // short fits the metadata row, long names the accessible title.
  // Unknown bridge output can never produce a label — it falls back
  // to UNAVAILABLE, never to a guessed status.
  const rawPresence =
    bridgePresence && typeof bridgePresence.status === "string" ? bridgePresence : UNAVAILABLE_PRESENCE;
  const status = PRESENCE_LABELS[rawPresence.status] ? rawPresence.status : "unavailable";
  const presence = {
    status,
    available: status !== "unavailable" && rawPresence.available === true,
    source: typeof rawPresence.source === "string" && rawPresence.source ? rawPresence.source : "bridge",
    label: PRESENCE_LABELS[status].short,
    longLabel: PRESENCE_LABELS[status].long,
  };

  return {
    displayName,
    username,
    personalLine: site.personalLine,
    skills: site.skills,
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
    // Presence nests inside per the data model AND mirrors top-level
    // for the Hero (same reference): the bridge is independent of
    // OAuth, so status survives even when `discord` is null.
    discord: discord ? { ...discord, presence } : null,
    presence,
    about: site.about,
    vibe: site.vibe,
    things: site.things,
    currently: site.currently,
    final: site.final,
  };
}
