/* Refresh-lifecycle unit tests — plain node, zero dependencies.
   Run: npm test
   A stub Discord (scripted token responses) plus an in-memory token
   store drive createDiscordClient through every rotation, failure,
   and concurrency branch. Fixture secrets are obviously fake; every
   test additionally asserts none of them ever reach the logs. */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createDiscordClient,
  redactError,
  resolveAccessTtl,
} from "./discord-refresh.mjs";

const ME = {
  id: "920627516694200360",
  username: "boink_2068",
  global_name: "boink",
  avatar: null,
  banner: null,
  accent_color: null,
  flags: 0,
};

const SECRETS = [
  "RT-env-seed-aaaaaaaaaaaaaaaa",
  "RT-live-bbbbbbbbbbbbbbbbbbbb",
  "RT-rotated-cccccccccccccccccc",
  "RT-fresh-dddddddddddddddddddd",
  "RT-sibling-eeeeeeeeeeeeeeeeee",
  "AT-access-111111111111111111",
  "AT-access-222222222222222222",
];

/* Scripted Discord: each token exchange consumes the next queued
   response ({status, json} | {throw}); /users/@me always succeeds. */
function stubDiscord(tokenScript) {
  const exchanges = [];
  const queue = [...tokenScript];
  const fetchImpl = async (url, init) => {
    if (String(url).includes("/oauth2/token")) {
      const body = new URLSearchParams(String(init?.body ?? ""));
      exchanges.push({
        grant: body.get("grant_type"),
        refreshToken: body.get("refresh_token"),
      });
      const next = queue.shift();
      if (!next) throw new Error("test bug: unexpected extra token exchange");
      if (next.throw) throw new Error(next.throw);
      return { ok: next.status >= 200 && next.status < 300, status: next.status, json: async () => next.json };
    }
    return { ok: true, status: 200, json: async () => ({ ...ME }) };
  };
  return { fetchImpl, exchanges };
}

function memoryStore(initial = null, { failSets = 0 } = {}) {
  let value = initial;
  const calls = { gets: 0, sets: 0 };
  return {
    calls,
    peek: () => value,
    poke: (v) => {
      value = v;
    },
    async getRefreshToken() {
      calls.gets += 1;
      return value;
    },
    async setRefreshToken(v) {
      calls.sets += 1;
      if (failSets > 0) {
        failSets -= 1;
        const err = new Error("kv exploded");
        err.code = "STORE_WRITE_FAILED";
        throw err;
      }
      value = v;
    },
  };
}

function logger() {
  const messages = [];
  return {
    messages,
    onWarn: (m) => messages.push(["warn", String(m)]),
    onError: (m) => messages.push(["error", String(m)]),
  };
}

const CONFIG = { clientId: "CID", clientSecret: "CSEC", redirectUri: "https://x/callback" };

function clientFor({ discord, store, log, now = () => Date.now() }) {
  return createDiscordClient({
    fetchImpl: discord.fetchImpl,
    store,
    getConfig: () => ({ ...CONFIG }),
    onWarn: log.onWarn,
    onError: log.onError,
    now,
  });
}

function assertScrubbed(log, label) {
  for (const [, message] of log.messages) {
    for (const secret of SECRETS) {
      assert.ok(!message.includes(secret), `${label}: log leaked a secret: ${message}`);
    }
  }
}

const okTokens = (access, refresh) => ({ status: 200, json: { access_token: access, refresh_token: refresh } });

describe("refresh lifecycle", () => {
  it("Case 1 — env seed is used and the store gets seeded", async () => {
    const log = logger();
    // store backend empty, env seed present: emulate via getRefreshToken
    // returning the seed once, then delegating to memory afterwards.
    let kvValue = null;
    const store = {
      calls: { sets: 0 },
      async getRefreshToken() {
        return kvValue ?? "RT-env-seed-aaaaaaaaaaaaaaaa";
      },
      async setRefreshToken(v) {
        this.calls.sets += 1;
        kvValue = v;
      },
    };
    const discord = stubDiscord([okTokens("AT-access-111111111111111111", undefined)]);
    // no refresh_token in response exercises the `?? used` seeding path
    const client = clientFor({ discord, store, log });
    const token = await client.getAccessToken();
    assert.equal(token, "AT-access-111111111111111111");
    assert.equal(discord.exchanges.length, 1);
    assert.equal(discord.exchanges[0].refreshToken, "RT-env-seed-aaaaaaaaaaaaaaaa");
    assert.equal(kvValue, "RT-env-seed-aaaaaaaaaaaaaaaa");
    assertScrubbed(log, "case 1");
  });

  it("Case 2 — normal refresh returns access, retains token, caches", async () => {
    const log = logger();
    const store = memoryStore("RT-live-bbbbbbbbbbbbbbbbbbbb");
    const discord = stubDiscord([okTokens("AT-access-111111111111111111", "RT-live-bbbbbbbbbbbbbbbbbbbb")]);
    const client = clientFor({ discord, store, log });
    assert.equal(await client.getAccessToken(), "AT-access-111111111111111111");
    assert.equal(await client.getAccessToken(), "AT-access-111111111111111111");
    assert.equal(discord.exchanges.length, 1, "second call must hit memory cache");
    assert.equal(store.peek(), "RT-live-bbbbbbbbbbbbbbbbbbbb");
    assertScrubbed(log, "case 2");
  });

  it("Case 3 — rotated token is persisted and used next cycle", async () => {
    const log = logger();
    let t = 1_000_000;
    const store = memoryStore("RT-live-bbbbbbbbbbbbbbbbbbbb");
    const discord = stubDiscord([
      okTokens("AT-access-111111111111111111", "RT-rotated-cccccccccccccccccc"),
      okTokens("AT-access-222222222222222222", "RT-rotated-cccccccccccccccccc"),
    ]);
    const client = clientFor({ discord, store, log, now: () => t });
    assert.equal(await client.getAccessToken(), "AT-access-111111111111111111");
    assert.equal(store.peek(), "RT-rotated-cccccccccccccccccc", "replacement persisted");
    t += 61 * 60 * 1000; // past the default TTL
    assert.equal(await client.getAccessToken(), "AT-access-222222222222222222");
    assert.equal(discord.exchanges[1].refreshToken, "RT-rotated-cccccccccccccccccc", "future call uses replacement");
    assertScrubbed(log, "case 3");
  });

  it("Case 3b — 400 with a fresher stored token retries once and converges", async () => {
    const log = logger();
    const store = memoryStore("RT-live-bbbbbbbbbbbbbbbbbbbb");
    let calls = 0;
    const discord = {
      exchanges: [],
      fetchImpl: async (url, init) => {
        if (String(url).includes("/oauth2/token")) {
          const body = new URLSearchParams(String(init?.body ?? ""));
          discord.exchanges.push({ refreshToken: body.get("refresh_token") });
          calls += 1;
          if (calls === 1) {
            // sibling instance rotated between our read and our exchange
            store.poke("RT-sibling-eeeeeeeeeeeeeeeeee");
            return { ok: false, status: 400, json: async () => ({ error: "invalid_grant" }) };
          }
          return {
            ok: true,
            status: 200,
            json: async () => ({ access_token: "AT-access-222222222222222222", refresh_token: "RT-fresh-dddddddddddddddddddd" }),
          };
        }
        return { ok: true, status: 200, json: async () => ({ ...ME }) };
      },
    };
    const client = clientFor({ discord, store, log });
    assert.equal(await client.getAccessToken(), "AT-access-222222222222222222");
    assert.equal(discord.exchanges.length, 2, "exactly one retry");
    assert.equal(discord.exchanges[1].refreshToken, "RT-sibling-eeeeeeeeeeeeeeeeee");
    assert.equal(store.peek(), "RT-fresh-dddddddddddddddddddd", "retry rotation persisted");
    assertScrubbed(log, "case 3b");
  });

  it("Case 4 — concurrent refreshes share one exchange and one persist", async () => {
    const log = logger();
    const store = memoryStore("RT-live-bbbbbbbbbbbbbbbbbbbb");
    const discord = stubDiscord([okTokens("AT-access-111111111111111111", "RT-live-bbbbbbbbbbbbbbbbbbbb")]);
    const client = clientFor({ discord, store, log });
    const [a, b, c] = await Promise.all([
      client.getAccessToken(),
      client.getAccessToken(),
      client.getAccessToken(),
    ]);
    assert.equal(a, "AT-access-111111111111111111");
    assert.equal(b, "AT-access-111111111111111111");
    assert.equal(c, "AT-access-111111111111111111");
    assert.equal(discord.exchanges.length, 1, "one token exchange");
    assert.equal(store.calls.sets, 1, "one persistence operation");
    assertScrubbed(log, "case 4");
  });

  it("Case 5 — persistence failure still serves, retries, never logs secrets", async () => {
    const log = logger();
    let t = 1_000_000;
    const store = memoryStore("RT-live-bbbbbbbbbbbbbbbbbbbb", { failSets: 1 });
    const discord = stubDiscord([
      okTokens("AT-access-111111111111111111", "RT-rotated-cccccccccccccccccc"),
      okTokens("AT-access-222222222222222222", "RT-rotated-cccccccccccccccccc"),
    ]);
    const client = clientFor({ discord, store, log, now: () => t });
    // first cycle: exchange ok, persist fails → access still served
    assert.equal(await client.getAccessToken(), "AT-access-111111111111111111");
    assert.equal(store.peek(), "RT-live-bbbbbbbbbbbbbbbbbbbb", "durable state untouched");
    assert.ok(log.messages.some(([l]) => l === "error"), "scrubbed error surfaced");
    // second cycle: pending rotation retried, then used for exchange
    t += 61 * 60 * 1000;
    assert.equal(await client.getAccessToken(), "AT-access-222222222222222222");
    assert.equal(store.peek(), "RT-rotated-cccccccccccccccccc", "replacement eventually persisted");
    assert.equal(discord.exchanges[1].refreshToken, "RT-rotated-cccccccccccccccccc");
    assertScrubbed(log, "case 5");
  });

  it("Case 6 — revoked token falls back to last-known-good with a re-link hint", async () => {
    const log = logger();
    const store = memoryStore("RT-live-bbbbbbbbbbbbbbbbbbbb");
    let t = 1_000_000;
    let mode = "ok";
    const discord = {
      exchanges: [],
      fetchImpl: async (url, init) => {
        if (String(url).includes("/oauth2/token")) {
          const body = new URLSearchParams(String(init?.body ?? ""));
          discord.exchanges.push({ refreshToken: body.get("refresh_token") });
          if (mode === "ok") {
            return { ok: true, status: 200, json: async () => ({ access_token: "AT-access-111111111111111111", refresh_token: "RT-live-bbbbbbbbbbbbbbbbbbbb" }) };
          }
          return { ok: false, status: 400, json: async () => ({ error: "invalid_grant" }) };
        }
        return { ok: true, status: 200, json: async () => ({ ...ME }) };
      },
    };
    const client = clientFor({ discord, store, log, now: () => t });
    const first = await client.getDiscordProfile();
    assert.equal(first?.username, "boink_2068", "primed last-known-good");
    // Discord revokes the grant; move past access + profile TTLs.
    mode = "revoked";
    t += 61 * 60 * 1000;
    const exchangesBefore = discord.exchanges.length;
    const fallback = await client.getDiscordProfile();
    assert.equal(fallback, first, "same last-known-good object, homepage stays alive");
    assert.equal(
      discord.exchanges.length - exchangesBefore,
      1,
      "no retry when the store holds nothing fresher"
    );
    assert.ok(
      log.messages.some(([, m]) => m.includes("re-link")),
      "re-link diagnostic logged"
    );
    assertScrubbed(log, "case 6");
  });

  it("Case 7 — cold start reads the latest token from the store, not memory", async () => {
    const log = logger();
    const store = memoryStore("RT-rotated-cccccccccccccccccc");
    const discord = stubDiscord([okTokens("AT-access-111111111111111111", "RT-rotated-cccccccccccccccccc")]);
    const freshInstance = clientFor({ discord, store, log }); // empty memory, same durable store
    assert.equal(await freshInstance.getAccessToken(), "AT-access-111111111111111111");
    assert.equal(discord.exchanges[0].refreshToken, "RT-rotated-cccccccccccccccccc");
    assertScrubbed(log, "case 7");
  });

  it("honors expires_in with sane bounds", () => {
    assert.equal(resolveAccessTtl(604800), 6 * 24 * 3600 * 1000, "7d clamped to 6d cap");
    assert.equal(resolveAccessTtl(3600), 3600 * 1000 * 0.9, "1h honored with margin");
    assert.equal(resolveAccessTtl(undefined), 55 * 60 * 1000);
    assert.equal(resolveAccessTtl("garbage"), 55 * 60 * 1000);
    assert.equal(resolveAccessTtl(10), 60 * 1000, "floored");
    assert.equal(resolveAccessTtl(999999999), 6 * 24 * 3600 * 1000, "capped");
  });

  it("redactError scrubs credential-shaped strings and caps length", () => {
    const jwtLike = `${"a".repeat(24)}.${"b".repeat(24)}.${"c".repeat(24)}`;
    const out = redactError(new Error(`boom ${jwtLike} tail`));
    assert.ok(!out.includes(jwtLike), "token shape removed");
    assert.ok(out.includes("[token]"), "placeholder present");
    assert.ok(out.includes("boom"), "context preserved");
    assert.ok(redactError(new Error("x".repeat(900))).length <= 300, "capped");
  });
});
