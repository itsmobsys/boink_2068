/* ═══════════════════════════════════════════════════════════════
   ADAPT — integration surface between the existing backend and
   Claude's rebuilt frontend (components/discord-identity).

   Belongs to NEITHER side's internals:
   - input:  the profile object from lib/profile.js getProfile()
             (live Discord identity + presence merged with
             site-owned content — backend contracts untouched)
   - output: the DiscordIdentityData shape the new UI renders,
             plus a few optional compat extras (snapshots, thoughts,
             headings, loop steps) that preserve the existing working
             interactions without redesigning Claude's components.

   Server-safe module: no window / document access, so it can be
   imported from server components and metadata code.
   ═══════════════════════════════════════════════════════════════ */

// PresenceStatus accepted by the new UI. "unavailable" (bridge down)
// is never a invented status — it renders as offline, and the text
// label next to the dot always carries the real meaning.
function toPresenceStatus(status) {
  return status === "online" || status === "idle" || status === "dnd"
    ? status
    : "offline";
}

// Skill group accents. The new UI gives every chip a required group
// (frontend | backend | infra | ai | tooling | platform) with its own
// curated hue + a legend row — map the existing skill names onto those
// six groups explicitly (mirrors the sample-data assignments).
const SKILL_GROUP_BY_NAME = {
  "next.js": "frontend",
  react: "frontend",
  javascript: "frontend",
  typescript: "frontend",
  html: "frontend",
  css: "frontend",
  "node.js": "backend",
  python: "backend",
  flask: "backend",
  sql: "backend",
  "rest apis": "backend",
  postgresql: "infra",
  sqlite: "infra",
  redis: "infra",
  linux: "infra",
  docker: "infra",
  "docker compose": "infra",
  ollama: "ai",
  openrouter: "ai",
  ai: "ai",
  "ai agents": "ai",
  git: "tooling",
  github: "tooling",
  "github actions": "tooling",
  playwright: "tooling",
  aws: "platform",
  vercel: "platform",
  railway: "platform",
  render: "platform",
  discord: "platform",
};

function skillGroup(name) {
  return SKILL_GROUP_BY_NAME[String(name).toLowerCase()] || "tooling";
}

// Vibe Output lines derived from the SAME site-owned vibe.data the
// old compiler read — never duplicated copy. Short mono lines in the
// new Output pane's voice.
function vibeOutputLines(vibe) {
  const d = vibe && vibe.data ? vibe.data : null;
  if (!d) return undefined;
  const join = (v) => (Array.isArray(v) ? v.join(" / ") : String(v));
  return [
    { id: "energy", text: `energy: ${d.energy}` },
    { id: "personality", text: `personality: ${join(d.personality)}` },
    { id: "interests", text: `interests: ${join(d.interests)}` },
    { id: "likes", text: `likes: ${join(d.likes)}` },
    { id: "dislikes", text: `dislikes: ${join(d.dislikes)}` },
    { id: "aesthetic", text: `aesthetic: ${d.aesthetic}` },
  ];
}

// Source entries pass through the SAME site-owned vibe.data the old
// compiler read — raw scalars and arrays, never duplicated copy. The
// component tokenizes them into the old multi-line JSON presentation
// (arrays unfold one item per line, values typed for coloring), so the
// Source pane shows the owner's real file, not placeholder copy.
function vibeSourceLines(vibe) {
  const d = vibe && vibe.data ? vibe.data : null;
  if (!d) return undefined;
  return Object.entries(d).map(([key, value]) => ({ key, value }));
}

export function toIdentityData(profile) {
  const about = profile.about || {};
  const vibe = profile.vibe || {};
  const things = profile.things || {};
  const currently = profile.currently || {};
  const final = profile.final || {};
  const attrs = Array.isArray(about.attributes) ? about.attributes : [];
  const foundAt = attrs.find((a) => /found at/i.test(a.label || ""));

  return {
    profile: {
      displayName: profile.displayName,
      username: profile.username,
      avatarUrl: profile.avatarUrl,
      tagline: profile.personalLine,
      presence: toPresenceStatus(profile.presence && profile.presence.status),
      // Short status is uppercase ("ONLINE"); sentence-case it for the
      // meta row so it reads as a label, not a shout.
      presenceDetail:
        profile.presence && profile.presence.longLabel
          ? profile.presence.longLabel.toLowerCase()
          : undefined,
      location: foundAt ? foundAt.value : undefined,
      timezoneLabel: undefined, // no backend source — omitted, not invented
      memberSinceLabel: profile.metaAccount || undefined,
    },
    skills: (profile.skills || []).map((s) => ({
      label: s.name,
      group: skillGroup(s.name),
    })),
    about: {
      eyebrow: `${about.index} / ${about.eyebrow}`,
      heading: about.heading,
      statement: about.lede,
      body: about.body,
      details: attrs.map((a) => ({ label: a.label, value: a.value })),
      contextLabel: about.contextLabel,
    },
    vibe: {
      eyebrow: vibe.eyebrow,
      heading: vibe.heading,
      description: vibe.description,
      filename: vibe.filename,
      sourceLines: vibeSourceLines(vibe),
      outputLines: vibeOutputLines(vibe),
    },
    things: {
      eyebrow: `${things.index} / ${things.eyebrow}`,
      heading: things.heading,
      intro: things.intro,
      items: (things.items || []).map((item) => ({
        title: `${item.label} — ${item.title}`,
        description: item.detail
          ? `${item.description} ${item.detail}`
          : item.description,
      })),
      loopSteps: things.loop ? things.loop.steps : undefined,
      loopCaption: things.loop ? things.loop.caption : undefined,
      closing: things.closing,
    },
    currently: {
      eyebrow: `${currently.index} / ${currently.eyebrow}`,
      heading: currently.heading,
      intro: currently.intro,
      meta: [currently.snapshotLabel, currently.updatedLabel]
        .filter(Boolean)
        .join(" · "),
      featured: {
        label: currently.featured.label,
        value: currently.featured.statement,
        detail: currently.featured.state,
      },
      supporting: (currently.states || []).map((s) => ({
        label: s.name,
        value: s.value,
      })),
      signal: currently.loop || [],
      snapshot: currently.snapshots ? currently.snapshots[0] : "",
      // Compat extras powering the preserved Random Snapshot island:
      snapshots: currently.snapshots || [],
      snapshotButton: currently.snapshotButton || "Random snapshot",
    },
    final: {
      eyebrow: `${final.index} / ${final.eyebrow}`,
      statement: final.statement,
      supportingText: final.sub,
      randomThought: final.thoughts ? final.thoughts[0] : "",
      // Compat extras powering the preserved Random Thought island:
      thoughts: final.thoughts || [],
      thoughtLabel: final.thoughtLabel || "Random thought",
      thoughtCounter: final.thoughtCounter || "Thought",
      backToTop: final.backToTop || "Back to top",
      sessionNote: final.sessionNote,
      trail: final.loop || [],
    },
  };
}
