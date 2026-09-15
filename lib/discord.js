/* ═══════════════════════════════════════════════════════════════
   DISCORD — server-side integration boundary (SERVER ONLY).
   ───────────────────────────────────────────────────────────────
   `import "server-only"` below makes any client-side import a build
   error — secrets and tokens can never leak into browser bundles.

   DATA FLOW (one direction, UI never touches Discord):
     Discord API → getDiscordProfile() → lib/profile.js → components

   AUTH MODEL (owner-only, visitors never log in):
     1. Owner opens /setup/discord (unlinked route, documented).
     2. /api/auth/discord redirects to Discord (identify scope only,
        random state cookie = CSRF protection, nothing persisted).
     3. /api/auth/discord/callback validates state, exchanges the
        code, fetches the profile, and SHOWS the owner a refresh
        token to save as DISCORD_REFRESH_TOKEN (Vercel env).
     4. At runtime getDiscordProfile() uses the refresh-token grant
        to mint short-lived access tokens server-side. The access
        token lives only in memory and is never stored, logged, or
        sent to the browser.

   CACHING: access token cached in memory (~55 min TTL, in-flight
   dedup); normalized profile cached in memory (~1 h TTL) AND the
   homepage revalidates hourly (ISR) — Discord sees a handful of
   calls per day, never per visitor. No filesystem, no polling,
   Vercel-safe (worst case: a cold instance refreshes once).

   FAILURE: any error → console.error (server logs only, tokens
   redacted) → last-known-good profile → null. The site always
   renders; it never shows API errors to visitors.
   ═══════════════════════════════════════════════════════════════ */

import "server-only";

import { DISCORD_API, DISCORD_TOKEN_URL, normalizeUser } from "./discord-utils.mjs";

const TOKEN_TTL_MS = 55 * 60 * 1000;
const PROFILE_TTL_MS = 60 * 60 * 1000;

// Module-level caches. Ephemeral per serverless instance by design —
// a cold start simply re-authenticates once, then settles.
let tokenCache = { token: null, expiresAt: 0, inflight: null };
let profileCache = { profile: null, expiresAt: 0, lastGood: null };

function env() {
  return {
    clientId: process.env.DISCORD_CLIENT_ID || null,
    clientSecret: process.env.DISCORD_CLIENT_SECRET || null,
    redirectUri: process.env.DISCORD_REDIRECT_URI || null,
    refreshToken: process.env.DISCORD_REFRESH_TOKEN || null,
  };
}

export function isDiscordConfigured() {
  const { clientId, clientSecret, refreshToken } = env();
  return Boolean(clientId && clientSecret && refreshToken);
}

function redactError(err) {
  // Tokens/secrets must never reach logs: stringify defensively and
  // scrub anything shaped like a credential before logging.
  const text = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  return text
    .replace(/[A-Za-z0-9-_]{20,}\.[A-Za-z0-9-_]{20,}\.[A-Za-z0-9-_]{10,}/g, "[token]")
    .slice(0, 300);
}

/* Exchange an authorization code (callback) OR a refresh token
   (runtime) for tokens. Only `refresh_token` is ever persisted
   (as an env var, by the owner) — authorization codes are
   single-use and discarded immediately after exchange. */
export async function exchangeTokens({ code = null, refreshToken = null }) {
  const { clientId, clientSecret, redirectUri } = env();
  if (!clientId || !clientSecret) {
    throw new Error("Discord OAuth is not configured (client id/secret missing).");
  }
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: refreshToken ? "refresh_token" : "authorization_code",
    ...(refreshToken ? { refresh_token: refreshToken } : { code, redirect_uri: redirectUri }),
  });
  const res = await fetch(DISCORD_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Discord token exchange failed (HTTP ${res.status}).`);
  }
  return res.json();
}

/* Raw /users/@me fetch. Identify scope only — the returned object
   carries id/username/avatar/global_name/banner/accent_color/flags
   and nothing the site must not see is requested. */
export async function fetchMe(accessToken) {
  const res = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Discord profile fetch failed (HTTP ${res.status}).`);
  }
  return res.json();
}

/* Mint (or reuse) a short-lived access token via the stored owner
   refresh token. In-flight requests are deduplicated so concurrent
   renders share one grant. */
async function getAccessToken() {
  const { refreshToken } = env();
  if (!refreshToken) return null;
  const now = Date.now();
  if (tokenCache.token && tokenCache.expiresAt > now) return tokenCache.token;
  if (!tokenCache.inflight) {
    tokenCache.inflight = (async () => {
      const tokens = await exchangeTokens({ refreshToken });
      tokenCache = {
        token: tokens.access_token,
        // Discord doesn't guarantee expires_in; assume ~1 week worst
        // case but re-mint hourly anyway via the profile TTL below.
        expiresAt: Date.now() + TOKEN_TTL_MS,
        inflight: null,
      };
      // A rotated refresh token MUST be saved by the owner — surface
      // it loudly in server logs (never to visitors) when it changes.
      if (tokens.refresh_token && tokens.refresh_token !== refreshToken) {
        console.warn(
          "[discord] Discord rotated the refresh token. Update DISCORD_REFRESH_TOKEN or access will lapse."
        );
      }
      return tokenCache.token;
    })().catch((err) => {
      tokenCache = { token: null, expiresAt: 0, inflight: null };
      throw err;
    });
  }
  return tokenCache.inflight;
}

/* THE boundary: normalized owner profile or null. Never throws —
   callers (lib/profile.js) always get a renderable answer. */
export async function getDiscordProfile() {
  const now = Date.now();
  if (profileCache.profile && profileCache.expiresAt > now) {
    return profileCache.profile;
  }
  if (!isDiscordConfigured()) return profileCache.lastGood;
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) return profileCache.lastGood;
    const raw = await fetchMe(accessToken);
    const profile = normalizeUser(raw);
    if (!profile) throw new Error("Discord returned an unusable profile object.");
    profileCache = { profile, expiresAt: now + PROFILE_TTL_MS, lastGood: profile };
    return profile;
  } catch (err) {
    console.error(`[discord] ${redactError(err)}`);
    return profileCache.lastGood;
  }
}
