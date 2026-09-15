/* ═══════════════════════════════════════════════════════════════
   DISCORD UTILS — pure helpers, zero dependencies.
   ───────────────────────────────────────────────────────────────
   No secrets, no network, no browser/Node APIs here — safe to import
   anywhere (server code, routes, plain-node verification scripts).
   All functions are deterministic and side-effect free.
   ═══════════════════════════════════════════════════════════════ */

export const DISCORD_API = "https://discord.com/api/v10";
export const DISCORD_AUTHORIZE_URL = "https://discord.com/oauth2/authorize";
export const DISCORD_TOKEN_URL = "https://discord.com/api/oauth2/token";
export const DISCORD_CDN = "https://cdn.discordapp.com";

// Discord epoch: 2015-01-01T00:00:00.000Z. Snowflake timestamps are
// factual account-age data, derived locally — no API call needed.
const DISCORD_EPOCH_MS = 1420070400000n;

// Site background the accent must stay readable on (near-black).
const SITE_BG = "#060608";
// Accent is used in small mono touches site-wide, so demand full
// text-level contrast — otherwise fall back to the house accent.
const MIN_ACCENT_CONTRAST = 4.5;
export const FALLBACK_ACCENT = "#8b8cff";

// Recognized public badge bits on the identify-scope User object.
// Unknown/private bits are ignored — never invent badges.
const BADGE_BITS = [
  1n, // Staff
  2n, // Partner
  4n, // HypeSquad
  8n, // Bug Hunter Level 1
  64n, // HypeSquad Bravery
  128n, // HypeSquad Brilliance
  256n, // HypeSquad Balance
  512n, // Early Supporter
  16384n, // Bug Hunter Level 2
  131072n, // Verified Developer
  4194304n, // Active Developer
];

/* Snowflake → account-creation year (UTC). Pure BigInt math. */
export function snowflakeYear(id) {
  const ms = (BigInt(String(id)) >> 22n) + DISCORD_EPOCH_MS;
  return new Date(Number(ms)).getUTCFullYear();
}

/* Default-avatar slot for users without a custom avatar:
   (user_id >> 22) % 6 — Discord's documented formula. */
export function defaultAvatarIndex(id) {
  return Number((BigInt(String(id)) >> 22n) % 6n);
}

export function defaultAvatarUrl(id) {
  return `${DISCORD_CDN}/embed/avatars/${defaultAvatarIndex(id)}.png`;
}

/* Custom avatar. `a_` prefix = animated → gif, else png. Always
   requested at 512px: crisp on retina, small enough to stay fast. */
export function avatarUrlFor(id, hash) {
  if (!hash) return defaultAvatarUrl(id);
  const ext = String(hash).startsWith("a_") ? "gif" : "png";
  return `${DISCORD_CDN}/avatars/${id}/${hash}.${ext}?size=512`;
}

/* Banner (may be null). Same animated-hash convention. Returned for
   the profile model / metadata — never forces a visual redesign. */
export function bannerUrlFor(id, hash) {
  if (!hash) return null;
  const ext = String(hash).startsWith("a_") ? "gif" : "png";
  return `${DISCORD_CDN}/banners/${id}/${hash}.${ext}?size=1024`;
}

/* Discord sends accent_color as an integer (or null). → CSS hex. */
export function accentToCss(accentColor) {
  if (accentColor === null || accentColor === undefined) return null;
  const n = Number(accentColor);
  if (!Number.isInteger(n) || n < 0 || n > 0xffffff) return null;
  return "#" + n.toString(16).padStart(6, "0");
}

function luminance(hex) {
  const c = hex.replace("#", "");
  const srgb = [0, 2, 4].map((i) => {
    const v = parseInt(c.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

/* WCAG contrast of two hex colors. */
export function contrastRatio(a, b) {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/* A Discord accent must stay readable on the near-black background
   or it is rejected in favor of the house accent. */
export function passesAccentContrast(hex) {
  if (typeof hex !== "string" || !/^#[0-9a-f]{6}$/i.test(hex)) return false;
  return contrastRatio(hex, SITE_BG) >= MIN_ACCENT_CONTRAST;
}

/* Resolve the effective site accent: validated Discord color wins,
   anything dubious falls back — a bad value can never nuke contrast. */
export function pickAccent(accentColor) {
  const css = accentToCss(accentColor);
  if (css && passesAccentContrast(css)) return css;
  return FALLBACK_ACCENT;
}

/* Count recognized public badges from the flags bitmask. */
export function countBadges(flags) {
  if (flags === null || flags === undefined) return 0;
  const f = BigInt(flags);
  return BADGE_BITS.filter((bit) => (f & bit) !== 0n).length;
}

/* Normalize an identify-scope User object into the SMALL safe subset
   the site is allowed to know. Drops everything else (email, mfa,
   locale, tokens never appear here — the raw object never leaves
   server code and is never stored). */
export function normalizeUser(raw) {
  if (!raw || typeof raw.id !== "string") return null;
  return {
    id: raw.id,
    username: typeof raw.username === "string" ? raw.username : null,
    globalName:
      typeof raw.global_name === "string" && raw.global_name.length > 0
        ? raw.global_name
        : null,
    avatarUrl: avatarUrlFor(raw.id, raw.avatar ?? null),
    bannerUrl: bannerUrlFor(raw.id, raw.banner ?? null),
    accentColor: accentToCss(raw.accent_color ?? null),
    createdYear: snowflakeYear(raw.id),
    badgeCount: countBadges(raw.flags ?? 0),
  };
}

/* Authorization-code flow URL. identify scope ONLY — the minimum the
   site needs. response_type=code (never implicit), prompt=consent so
   the owner always sees what is being granted. */
export function buildAuthorizeUrl({ clientId, redirectUri, state }) {
  const params = new URLSearchParams({
    client_id: String(clientId),
    redirect_uri: String(redirectUri),
    response_type: "code",
    scope: "identify",
    state: String(state),
    prompt: "consent",
  });
  return `${DISCORD_AUTHORIZE_URL}?${params.toString()}`;
}

/* Minimal HTML escaping for the owner-only setup pages (values shown
   back to the authorizing owner — still escaped on principle). */
export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}
