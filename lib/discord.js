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
        random state cookie = CSRF protection).
     3. /api/auth/discord/callback validates state, exchanges the
        code, persists the refresh token via lib/discord-token-store
        (no manual copying when a persistent backend is configured).
     4. At runtime the refresh-token grant mints short-lived access
        tokens server-side. Discord ROTATES refresh tokens: every
        replacement is persisted back to the store before the refresh
        is treated as complete, so cold starts and sibling instances
        never exchange a dead token (the old HTTP 400 failure mode).

   CACHING: access token cached in memory (TTL from Discord's
   expires_in, bounded) with in-flight dedup; normalized profile
   cached in memory (~1 h TTL) AND the homepage revalidates hourly
   (ISR) — Discord sees a trickle of calls, never per visitor. No
   filesystem, no polling. Failures fall back to last-known-good.

   FAILURE: any error → scrubbed server log → last-known-good
   profile → null. The site always renders; it never shows API
   errors to visitors.
   ═══════════════════════════════════════════════════════════════ */

import "server-only";

import {
  createDiscordClient,
  exchangeTokens as exchangeTokensPure,
  fetchMe as fetchMePure,
  redactError,
} from "./discord-refresh.mjs";
import { isTokenStoreConfigured, tokenStore } from "./discord-token-store.mjs";

function liveConfig() {
  return {
    clientId: process.env.DISCORD_CLIENT_ID || null,
    clientSecret: process.env.DISCORD_CLIENT_SECRET || null,
    redirectUri: process.env.DISCORD_REDIRECT_URI || null,
  };
}

/* Production singleton: live fetch, persistent store, env config,
   console logging. All refresh/token/profile state lives inside. */
const client = createDiscordClient({
  fetchImpl: (url, init) => fetch(url, init),
  store: tokenStore,
  getConfig: liveConfig,
  onWarn: (message) => console.warn(message),
  onError: (message) => console.error(message),
});

export function isDiscordConfigured() {
  const { clientId, clientSecret } = liveConfig();
  return Boolean(clientId && clientSecret && process.env.DISCORD_REFRESH_TOKEN);
}

/* Owner-only diagnostics for /setup/discord. Labels and booleans
   ONLY — token values never leave the store module. */
export async function getDiscordStatus() {
  const { clientId, clientSecret, redirectUri } = liveConfig();
  let tokenSource = null;
  try {
    tokenSource = await tokenStore.describeTokenSource();
  } catch {
    tokenSource = null;
  }
  return {
    hasClientId: Boolean(clientId),
    hasClientSecret: Boolean(clientSecret),
    hasRedirectUri: Boolean(redirectUri),
    storeAvailable: isTokenStoreConfigured(),
    tokenSource, // "store" | "env" | null
    linked: Boolean(clientId && clientSecret && tokenSource),
  };
}

/* Exchange an authorization code (callback) OR a refresh token.
   Kept for the callback route; runtime refresh goes through the
   client above so rotation is persisted, not just logged. */
export async function exchangeTokens({ code = null, refreshToken = null }) {
  return exchangeTokensPure({
    fetchImpl: (url, init) => fetch(url, init),
    config: liveConfig(),
    grant: refreshToken
      ? { type: "refresh_token", refreshToken }
      : { type: "authorization_code", code },
  });
}

/* Raw /users/@me fetch. Identify scope only. */
export async function fetchMe(accessToken) {
  return fetchMePure({ fetchImpl: (url, init) => fetch(url, init), accessToken });
}

/* THE boundary: normalized owner profile or null. Never throws —
   callers (lib/profile.js) always get a renderable answer. */
export async function getDiscordProfile() {
  return client.getDiscordProfile();
}

export { redactError };
