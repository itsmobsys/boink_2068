/* ── DISCORD PRESENCE core (pure + testable) ────────────────────
   No secrets at import, no network at import, no Next.js imports:
   safe for routes, server components, and plain-node test scripts.
   All functions are deterministic except the injected clock/fetch. */

export const PRESENCE_STATUSES = ["online", "idle", "dnd", "offline", "unavailable"];

// Short text for tight UI slots, long text for accessible names.
// DND is abbreviated on screen ("DO NOT DISTURB" never fits the
// metadata row); screen readers always hear the full phrase.
export const PRESENCE_LABELS = {
  online: { short: "ONLINE", long: "Online" },
  idle: { short: "IDLE", long: "Idle" },
  dnd: { short: "DND", long: "Do not disturb" },
  offline: { short: "OFFLINE", long: "Offline" },
  unavailable: { short: "UNAVAILABLE", long: "Status unavailable" },
};

// Bridge failure is a first-class state, never conflated with
// Discord reporting offline. Shared frozen reference.
export const UNAVAILABLE_PRESENCE = Object.freeze({
  status: "unavailable",
  available: false,
  source: "bridge",
});

export function normalizePresenceStatus(value) {
  return PRESENCE_STATUSES.includes(value) ? value : "unavailable";
}

/* Strict shape check on the bridge payload. Anything unexpected —
   wrong types, unknown status, missing fields — is rejected so a
   compromised or buggy bridge can never inject UI states. */
export function validateBridgePayload(json) {
  if (!json || typeof json !== "object" || Array.isArray(json)) return null;
  const { status, available, source } = json;
  if (!PRESENCE_STATUSES.includes(status)) return null;
  if (typeof available !== "boolean") return null;
  if (typeof source !== "string" || source.length === 0) return null;
  if (status === "unavailable" && available !== false) return null;
  if (status !== "unavailable" && available !== true) return null;
  if (status !== "unavailable" && source !== "discord-gateway") return null;
  return { status, available, source };
}

const PRESENCE_TTL_MS = 60 * 1000;
const NEGATIVE_TTL_MS = 15 * 1000;
const FETCH_TIMEOUT_MS = 4000;

/* Short-TTL cached bridge reader with in-flight dedup. Failures
   (timeout, 401/500, bad JSON, bad shape, unconfigured) all resolve
   to UNAVAILABLE and are cached briefly so a dead bridge can't slow
   sequential renders. Never throws. No browser polling — this runs
   server-side only, at most ~1 bridge call per minute per instance. */
export function createPresenceClient({
  fetchImpl,
  getConfig,
  onWarn = () => {},
  onError = () => {},
  now = () => Date.now(),
  ttlMs = PRESENCE_TTL_MS,
  negativeTtlMs = NEGATIVE_TTL_MS,
} = {}) {
  const cache = { value: null, expiresAt: 0, inflight: null };
  let unconfiguredWarned = false;

  async function fetchPresence(url, secret) {
    const res = await fetchImpl(`${url}/presence`, {
      headers: { Authorization: `Bearer ${secret}` },
      // Plain default caching: under ISR the result lives until the
      // page revalidates, which is exactly the freshness contract.
      // (Deliberately NOT no-store — that would force dynamic render.)
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) {
      throw new Error(`Presence bridge responded with HTTP ${res.status}.`);
    }
    return validateBridgePayload(await res.json());
  }

  async function doFetch() {
    const { url, secret } = getConfig();
    if (!url || !secret) {
      if (!unconfiguredWarned) {
        unconfiguredWarned = true;
        onWarn("[presence] bridge not configured; showing UNAVAILABLE");
      }
      return UNAVAILABLE_PRESENCE;
    }
    try {
      const valid = await fetchPresence(url, secret);
      if (!valid) throw new Error("Presence bridge returned an unexpected shape.");
      cache.value = valid;
      cache.expiresAt = now() + ttlMs;
      return valid;
    } catch (err) {
      onError(`[presence] ${err instanceof Error ? err.message : "bridge unreachable"}`);
      cache.value = UNAVAILABLE_PRESENCE;
      cache.expiresAt = now() + negativeTtlMs;
      return UNAVAILABLE_PRESENCE;
    }
  }

  function getPresence() {
    if (cache.value && cache.expiresAt > now()) return Promise.resolve(cache.value);
    if (!cache.inflight) {
      cache.inflight = doFetch().then(
        (value) => {
          cache.inflight = null;
          return value;
        },
        (err) => {
          cache.inflight = null;
          throw err;
        }
      );
    }
    return cache.inflight;
  }

  return { getPresence };
}
