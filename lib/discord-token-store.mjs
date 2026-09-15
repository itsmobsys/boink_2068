/* ═══════════════════════════════════════════════════════════════
   DISCORD TOKEN STORE — authoritative home of the rotating secret.
   ───────────────────────────────────────────────────────────────
   Why this file exists: Discord rotates OAuth refresh tokens, and
   the replacement arrives inside the refresh response. Vercel
   serverless instances share neither memory nor filesystem, so the
   latest token MUST live in durable storage — otherwise the next
   cold start (or a sibling instance) exchanges a dead token and
   gets HTTP 400, killing the live profile until someone re-links.

   SECURITY POSTURE — read carefully:
   - This module holds NO secrets at import time and performs NO I/O
     at import time. Secrets are read (env / Upstash) only inside the
     async functions below, which run server-side.
   - There is deliberately NO `import "server-only"` here: that guard
     throws in plain Node and would make this module (and its tests)
     unimportable outside Next. The build-time boundary is enforced
     one layer up, in lib/discord.js, which is the ONLY production
     importer of this module. NEVER import this file from a client
     component — grep `from "@/lib/discord` must only ever match
     server files (routes, server components, lib/discord.js).
   - Values are never logged here. Errors carry codes, never tokens.

   BACKEND: Upstash Redis over HTTPS (serverless-native, survives
   cold starts / instances / deployments). The client is created
   lazily and only when UPSTASH_REDIS_REST_URL + _TOKEN are set, so
   local dev without KV keeps working on the env seed.
   ═══════════════════════════════════════════════════════════════ */

export const TOKEN_STORE_KEY = "discord:refresh_token";

/* Thrown for every store problem. `.code` is machine-readable;
   `.message` is a static scrubbed string — a token value can never
   reach logs through this class. */
export class TokenStoreError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "TokenStoreError";
    this.code = code;
  }
}

/* Client components must never touch the store, even by accident.
   (Build-time enforcement lives in lib/discord.js via server-only;
   this is runtime defense-in-depth and costs nothing server-side.) */
function assertServer() {
  if (typeof window !== "undefined") {
    throw new TokenStoreError("CLIENT_CONTEXT", "token store is server-only");
  }
}

/* Lazily build Upstash get/set closures, or { null, null } when the
   backend isn't configured. Lazy so importing this module (and the
   test suite) never touches the network or throws for missing env. */
export function createUpstashBackend() {
  const url = process.env.UPSTASH_REDIS_REST_URL || null;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || null;
  if (!url || !token) return { kvGet: null, kvSet: null };
  async function client() {
    const { Redis } = await import("@upstash/redis");
    return new Redis({ url, token });
  }
  return {
    kvGet: async () => {
      const value = await client().then((c) => c.get(TOKEN_STORE_KEY));
      return typeof value === "string" && value.length > 0 ? value : null;
    },
    kvSet: async (value) => {
      await client().then((c) => c.set(TOKEN_STORE_KEY, value));
    },
  };
}

/* The store. Resolution order is the migration path:
     1. persistent backend (authoritative once seeded),
     2. DISCORD_REFRESH_TOKEN env (initial seed, pre-existing deploys).
   All collaborators are injected so plain-node tests can drive every
   branch with in-memory fakes — no network, no env, no secrets. */
export function createTokenStore({ kvGet = null, kvSet = null, getEnvToken = () => null } = {}) {
  return {
    isConfigured() {
      return Boolean(kvGet && kvSet);
    },

    /* Latest known refresh token, or null. KV read failures fall
       through to the env seed (a stale-but-valid seed beats nothing);
       the failure itself is surfaced by describeTokenSource/callers,
       never with values attached. */
    async getRefreshToken() {
      assertServer();
      if (kvGet) {
        try {
          const stored = await kvGet();
          if (typeof stored === "string" && stored.length > 0) return stored;
        } catch {
          // fall through to env seed below
        }
      }
      const seed = getEnvToken();
      return typeof seed === "string" && seed.length > 0 ? seed : null;
    },

    /* Persist the authoritative token. Throws TokenStoreError —
       STORE_UNAVAILABLE when no backend is configured (caller falls
       back to the manual-copy flow), STORE_WRITE_FAILED when the
       backend rejected the write (caller must NOT discard the token
       silently; see lib/discord-refresh.mjs pending-save retry). */
    async setRefreshToken(token) {
      assertServer();
      if (typeof token !== "string" || token.length === 0) {
        throw new TokenStoreError("INVALID_VALUE", "refusing to persist an empty refresh token");
      }
      if (!kvSet) {
        throw new TokenStoreError("STORE_UNAVAILABLE", "persistent token store is not configured");
      }
      try {
        await kvSet(token);
      } catch {
        throw new TokenStoreError("STORE_WRITE_FAILED", "persistent token store write failed");
      }
    },

    /* Where would getRefreshToken() resolve from right now?
       Labels only — values never leave this module. Powers the
       owner-only /setup/discord status rows. */
    async describeTokenSource() {
      assertServer();
      if (kvGet) {
        try {
          const stored = await kvGet();
          if (typeof stored === "string" && stored.length > 0) return "store";
        } catch {
          // unreadable backend: report what remains usable
        }
      }
      return getEnvToken() ? "env" : null;
    },
  };
}

/* Production singleton. Created at import (no I/O: only closures
   over env reads + lazy client construction). */
export const tokenStore = createTokenStore({
  ...createUpstashBackend(),
  getEnvToken: () => process.env.DISCORD_REFRESH_TOKEN || null,
});

export function isTokenStoreConfigured() {
  return tokenStore.isConfigured();
}
