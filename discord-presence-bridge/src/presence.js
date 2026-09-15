// discord.js free zone: this module is pure logic (no Gateway, no
// network, no secrets) so the test suite can import it directly.

import { timingSafeEqual } from "node:crypto";

export const OWNER_STATUSES = ["online", "idle", "dnd", "offline"];

// Anything Discord reports outside the known set (or nothing at
// all) normalizes to unavailable — never guessed, never offline.
export function normalizeStatus(value) {
  return OWNER_STATUSES.includes(value) ? value : "unavailable";
}

export function isAvailable(status) {
  return status !== "unavailable";
}

// The ONLY two response shapes this service ever emits. Offline is
// a positive Discord fact (available: true); unavailable means the
// bridge itself cannot vouch for anything (available: false).
export function buildResponse(status, source = "discord-gateway") {
  const normalized = normalizeStatus(status);
  if (!isAvailable(normalized)) {
    return { status: "unavailable", available: false, source: "bridge" };
  }
  return { status: normalized, available: true, source };
}

export function unavailableResponse() {
  return { status: "unavailable", available: false, source: "bridge" };
}

// Constant-time Bearer check. Length is compared first because
// timingSafeEqual throws on mismatched buffers.
export function isAuthorized(header, secret) {
  if (typeof header !== "string" || typeof secret !== "string" || secret.length === 0) {
    return false;
  }
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return false;
  const a = Buffer.from(token, "utf8");
  const b = Buffer.from(secret, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

// Startup gate: refuse to boot on missing/weak config. Returns an
// array of human-readable problems (empty = good to go). Values are
// never echoed back.
export function validateEnv(env) {
  const problems = [];
  if (!env.DISCORD_BOT_TOKEN) problems.push("DISCORD_BOT_TOKEN is missing");
  if (!env.DISCORD_GUILD_ID) problems.push("DISCORD_GUILD_ID is missing");
  if (!env.PRESENCE_SHARED_SECRET) {
    problems.push("PRESENCE_SHARED_SECRET is missing");
  } else if (env.PRESENCE_SHARED_SECRET.length < 32) {
    problems.push("PRESENCE_SHARED_SECRET must be at least 32 characters");
  }
  return problems;
}

// Mutable presence cell. Starts unavailable; only explicit,
// owner-scoped Gateway data ever moves it. No timers, no polling.
export function createPresenceStore() {
  let status = "unavailable";
  return {
    get: () => status,
    setFromGateway: (rawStatus) => {
      status = normalizeStatus(rawStatus);
    },
    markUnavailable: () => {
      status = "unavailable";
    },
  };
}
