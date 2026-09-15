// ── DISCORD PRESENCE (consumer side, server only) ───────────────
// Reads the tiny Railway presence bridge (live Gateway state) with
// a short TTL + in-flight dedup. Pure + injectable core lives in
// ./discord-presence.mjs so it stays unit-testable; this module is
// just the production wiring (env, fetch, logging) behind the
// server-only boundary. Nothing here ever reaches the browser —
// only the normalized { status, available, source } object does.

import "server-only";

import { createPresenceClient } from "./discord-presence.mjs";

function liveConfig() {
  const url = (process.env.DISCORD_PRESENCE_BRIDGE_URL || "").trim().replace(/\/+$/, "");
  const secret = process.env.DISCORD_PRESENCE_BRIDGE_SECRET || null;
  return { url: url || null, secret };
}

const client = createPresenceClient({
  fetchImpl: (url, init) => fetch(url, init),
  getConfig: liveConfig,
  onWarn: (message) => console.warn(message),
  onError: (message) => console.error(message),
});

/* THE boundary: normalized presence or UNAVAILABLE. Never throws —
   callers (lib/profile.js) always get a renderable answer. */
export async function getPresence() {
  return client.getPresence();
}

/* THE boundary: normalized presence or UNAVAILABLE. Never throws —
   callers (lib/profile.js) always get a renderable answer. */
export async function getDiscordPresence() {
  return client.getPresence();
}
