/* ═══════════════════════════════════════════════════════════════
   DISCORD REFRESH — token lifecycle orchestration (pure logic).
   ───────────────────────────────────────────────────────────────
   Every branch of the refresh-token lifecycle lives here, driven
   ONLY by injected collaborators ({ fetchImpl, store, getConfig })
   so plain-node tests can prove each failure mode with fakes:

     resolve token (unsaved rotation → store → env seed)
       → exchange (refresh_token grant)
       → ALWAYS persist the effective token (rotation + first seed)
       → serve access token from memory (short TTL from expires_in)

   Rotation races: Discord invalidates the previous refresh token,
   so two serverless instances can collide — A rotates T0→T1 while B
   still holds T0 and gets HTTP 400. Exactly one retry is allowed,
   and only after re-reading the store: if the store now holds a
   different token, B retries once with it; otherwise the grant is
   genuinely revoked and the caller falls back to last-known-good.

   Persistence failure never kills a request: the replacement is
   stashed in memory (pendingSave) and retried next cycle, while the
   fresh access token is still served. Nothing here logs values —
   all log strings are static; tests assert tokens never appear.

   No secrets at import, no network at import, no Next.js imports:
   safe for routes, server components, and plain-node test scripts.
   ═══════════════════════════════════════════════════════════════ */

import { DISCORD_API, DISCORD_TOKEN_URL, normalizeUser } from "./discord-utils.mjs";

const FALLBACK_TOKEN_TTL_MS = 55 * 60 * 1000;
const MIN_TOKEN_TTL_MS = 60 * 1000;
const MAX_TOKEN_TTL_MS = 6 * 24 * 3600 * 1000;
const PROFILE_TTL_MS = 60 * 60 * 1000;

/* Scrub anything shaped like a credential before it can reach logs.
   Callers must still never interpolate tokens into messages. */
export function redactError(err) {
  const text = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  return text
    .replace(/[A-Za-z0-9-_]{20,}\.[A-Za-z0-9-_]{20,}\.[A-Za-z0-9-_]{10,}/g, "[token]")
    .slice(0, 300);
}

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

/* Honor Discord's expires_in (7 days per docs) with sanity bounds,
   so a healthy link rotates a few times a month instead of hourly —
   fewer rotations, fewer cross-instance races, less API traffic. */
export function resolveAccessTtl(expiresIn) {
  const seconds = Number(expiresIn);
  if (!Number.isFinite(seconds) || seconds <= 0) return FALLBACK_TOKEN_TTL_MS;
  return Math.min(Math.max(Math.floor(seconds * 1000 * 0.9), MIN_TOKEN_TTL_MS), MAX_TOKEN_TTL_MS);
}

/* One token exchange (code grant for linking, refresh grant at
   runtime). Throws with `.status` on HTTP failure so callers can
   distinguish revoked grants (400) from transient outages. */
export async function exchangeTokens({ fetchImpl, config, grant }) {
  const { clientId, clientSecret, redirectUri } = config;
  if (!clientId || !clientSecret) {
    throw new Error("Discord OAuth is not configured (client id/secret missing).");
  }
  const params =
    grant.type === "refresh_token"
      ? { grant_type: "refresh_token", refresh_token: grant.refreshToken }
      : { grant_type: "authorization_code", code: grant.code, redirect_uri: redirectUri };
  const body = new URLSearchParams({ client_id: clientId, client_secret: clientSecret, ...params });
  const res = await fetchImpl(DISCORD_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    cache: "no-store",
  });
  if (!res.ok) {
    throw httpError(res.status, `Discord token exchange failed (HTTP ${res.status}).`);
  }
  return res.json();
}

/* Raw /users/@me fetch. Identify scope only. */
export async function fetchMe({ fetchImpl, accessToken }) {
  const res = await fetchImpl(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw httpError(res.status, `Discord profile fetch failed (HTTP ${res.status}).`);
  }
  return res.json();
}

/* Full lifecycle client. All state is instance-scoped (no module
   singletons here) — tests spin up isolated clients per case, and
   production holds exactly one via lib/discord.js. */
export function createDiscordClient({
  fetchImpl,
  store,
  getConfig,
  onWarn = () => {},
  onError = () => {},
  now = () => Date.now(),
  profileTtlMs = PROFILE_TTL_MS,
} = {}) {
  const access = { token: null, expiresAt: 0, inflight: null };
  const profileCache = { profile: null, expiresAt: 0, lastGood: null };
  let pendingSave = null; // rotation Discord issued but we failed to persist
  let unavailableWarned = false;

  /* Write the effective token back, ALWAYS after a success: stores
     rotations and seeds the persistent store from env on first run.
     Failure keeps the token in pendingSave (retried next cycle) and
     is logged scrubbed — the request itself still succeeds. */
  /* Write the effective token back, ALWAYS after a success: stores
     rotations and seeds the persistent store from env on first run.
     Write failure stashes the token in pendingSave (retried next
     cycle) and is logged scrubbed — the request itself still
     succeeds. Exception: with no persistent backend there is nothing
     to retry toward, so the env seed stays authoritative and
     pendingSave is cleared (otherwise it would shadow a future env
     rotation forever). */
  async function persistEffective(token) {
    if (typeof token !== "string" || token.length === 0) return;
    try {
      await store.setRefreshToken(token);
      pendingSave = null;
    } catch (err) {
      if (err && err.code === "STORE_UNAVAILABLE") {
        pendingSave = null;
        if (!unavailableWarned) {
          unavailableWarned = true;
          onWarn("[discord] persistent token store not configured; rotation will not survive restarts");
        }
      } else {
        pendingSave = token;
        onError("[discord] refresh token persistence failed; will retry");
      }
    }
  }

  async function exchangeAs(refreshToken) {
    const tokens = await exchangeTokens({
      fetchImpl,
      config: getConfig(),
      grant: { type: "refresh_token", refreshToken },
    });
    if (!tokens || typeof tokens.access_token !== "string") {
      throw httpError(502, "Discord omitted access token from the grant.");
    }
    return tokens;
  }

  async function doRefresh() {
    // A rotation we previously failed to persist outranks everything:
    // retry the write first so a transient outage self-heals.
    if (pendingSave) {
      try {
        await store.setRefreshToken(pendingSave);
        pendingSave = null;
      } catch {
        // stays pending; persistEffective below logs the outcome
      }
    }

    let stored = null;
    try {
      stored = await store.getRefreshToken();
    } catch {
      stored = null;
    }
    const used = pendingSave ?? stored;
    if (!used) return null;

    try {
      const tokens = await exchangeAs(used);
      await persistEffective(tokens.refresh_token ?? used);
      access.token = tokens.access_token;
      access.expiresAt = now() + resolveAccessTtl(tokens.expires_in);
      return access.token;
    } catch (err) {
      if (err && err.status === 400) {
        // Either genuinely revoked, or a sibling instance rotated
        // first and our token is stale. Re-read the store ONCE: a
        // different token is evidence of rotation → single retry.
        let fresh = null;
        try {
          fresh = await store.getRefreshToken();
        } catch {
          fresh = null;
        }
        if (typeof fresh === "string" && fresh.length > 0 && fresh !== used) {
          onWarn("[discord] refresh rejected; retrying with latest stored token");
          try {
            const tokens = await exchangeAs(fresh);
            await persistEffective(tokens.refresh_token ?? fresh);
            access.token = tokens.access_token;
            access.expiresAt = now() + resolveAccessTtl(tokens.expires_in);
            return access.token;
          } catch {
            // retry also failed: fall through to revoked handling
          }
        }
        onError("[discord] refresh token rejected by Discord; owner re-link required via /setup/discord");
      }
      throw err;
    }
  }

  /* In-flight deduplication (per instance): concurrent renders share
     one exchange AND one persistence — no stampede, no double rotate. */
  function getAccessToken() {
    if (access.token && access.expiresAt > now()) return Promise.resolve(access.token);
    if (!access.inflight) {
      access.inflight = doRefresh().then(
        (token) => {
          access.inflight = null;
          return token;
        },
        (err) => {
          access.inflight = null;
          throw err;
        }
      );
    }
    return access.inflight;
  }

  /* THE boundary: normalized owner profile or null. Never throws. */
  async function getDiscordProfile() {
    const t = now();
    if (profileCache.profile && profileCache.expiresAt > t) return profileCache.profile;
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) return profileCache.lastGood;
      const profile = normalizeUser(await fetchMe({ fetchImpl, accessToken }));
      if (!profile) throw new Error("Discord returned an unusable profile object.");
      profileCache.profile = profile;
      profileCache.expiresAt = t + profileTtlMs;
      profileCache.lastGood = profile;
      return profile;
    } catch (err) {
      onError(`[discord] ${redactError(err)}`);
      return profileCache.lastGood;
    }
  }

  return { getAccessToken, getDiscordProfile };
}
