// Consumer-side tests: pure validation plus a live localhost
// stub bridge (real sockets, real fetch) — the Gateway is never
// involved, and no secrets leave this file.
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import {
  PRESENCE_LABELS,
  UNAVAILABLE_PRESENCE,
  createPresenceClient,
  normalizePresenceStatus,
  validateBridgePayload,
} from "./discord-presence.mjs";

describe("normalizePresenceStatus", () => {
  it("passes the four Discord states through", () => {
    for (const s of ["online", "idle", "dnd", "offline"]) {
      assert.equal(normalizePresenceStatus(s), s);
    }
  });

  it("collapses everything else to unavailable", () => {
    for (const s of [undefined, null, "", "invisible", "ONLINE", "busy", 0, {}]) {
      assert.equal(normalizePresenceStatus(s), "unavailable");
    }
  });
});

describe("validateBridgePayload", () => {
  it("accepts the exact bridge contract", () => {
    assert.deepEqual(validateBridgePayload({ status: "dnd", available: true, source: "discord-gateway" }), {
      status: "dnd",
      available: true,
      source: "discord-gateway",
    });
    assert.deepEqual(validateBridgePayload({ status: "unavailable", available: false, source: "bridge" }), {
      status: "unavailable",
      available: false,
      source: "bridge",
    });
  });

  it("rejects incoherent or foreign shapes", () => {
    assert.equal(validateBridgePayload(null), null);
    assert.equal(validateBridgePayload([]), null);
    assert.equal(validateBridgePayload("online"), null);
    assert.equal(validateBridgePayload({ status: "online", available: true }), null);
    assert.equal(validateBridgePayload({ status: "online", available: false, source: "discord-gateway" }), null);
    assert.equal(validateBridgePayload({ status: "unavailable", available: true, source: "bridge" }), null);
    assert.equal(validateBridgePayload({ status: "online", available: true, source: "evil" }), null);
  });

  it("strips extra fields, keeping only the normalized shape", () => {
    assert.deepEqual(
      validateBridgePayload({ status: "online", available: true, source: "discord-gateway", id: "123", guild: "x" }),
      { status: "online", available: true, source: "discord-gateway" }
    );
  });

  it("labels cover every status with short + long text", () => {
    for (const s of ["online", "idle", "dnd", "offline", "unavailable"]) {
      assert.ok(PRESENCE_LABELS[s].short.length > 0);
      assert.ok(PRESENCE_LABELS[s].long.length > 0);
    }
    assert.equal(PRESENCE_LABELS.dnd.short, "DND");
    assert.equal(PRESENCE_LABELS.dnd.long, "Do not disturb");
  });
});

describe("createPresenceClient", () => {
  const calls = [];
  const okFetch = async () => {
    calls.push(1);
    return { ok: true, json: async () => ({ status: "idle", available: true, source: "discord-gateway" }) };
  };
  const config = () => ({ url: "https://bridge.example", secret: "s".repeat(32) });
  const quiet = { onWarn: () => {}, onError: () => {} };

  it("caches within TTL and refetches after expiry", async () => {
    calls.length = 0;
    let t = 1_000_000;
    const client = createPresenceClient({ fetchImpl: okFetch, getConfig: config, now: () => t, ...quiet });
    assert.deepEqual(await client.getPresence(), { status: "idle", available: true, source: "discord-gateway" });
    assert.deepEqual(await client.getPresence(), { status: "idle", available: true, source: "discord-gateway" });
    assert.equal(calls.length, 1);
    t += 61 * 1000;
    await client.getPresence();
    assert.equal(calls.length, 2);
  });

  it("deduplicates concurrent callers into one fetch", async () => {
    calls.length = 0;
    let release;
    const gate = new Promise((resolve) => {
      release = resolve;
    });
    const slowFetch = async () => {
      calls.push(1);
      await gate;
      return { ok: true, json: async () => ({ status: "online", available: true, source: "discord-gateway" }) };
    };
    const client = createPresenceClient({ fetchImpl: slowFetch, getConfig: config, ...quiet });
    const [a, b, c] = await Promise.all([client.getPresence(), client.getPresence(), client.getPresence()].map((p) => {
      release();
      return p;
    }));
    assert.equal(calls.length, 1);
    assert.ok(a.available && b.available && c.available);
  });

  it("maps every failure to UNAVAILABLE and never throws", async () => {
    const failures = [
      async () => {
        throw new Error("boom");
      },
      async () => ({ ok: false, status: 500, json: async () => ({}) }),
      async () => ({ ok: false, status: 401, json: async () => ({ error: "unauthorized" }) }),
      async () => ({ ok: true, json: async () => ({ status: "online" }) }),
      async () => ({
        ok: true,
        json: async () => {
          throw new SyntaxError("bad json");
        },
      }),
    ];
    for (const fetchImpl of failures) {
      const client = createPresenceClient({ fetchImpl, getConfig: config, ...quiet });
      assert.deepEqual(await client.getPresence(), UNAVAILABLE_PRESENCE);
    }
  });

  it("caches failures briefly so a dead bridge can't slow renders", async () => {
    let n = 0;
    const client = createPresenceClient({
      fetchImpl: async () => {
        n += 1;
        throw new Error("down");
      },
      getConfig: config,
      ...quiet,
    });
    await client.getPresence();
    await client.getPresence();
    assert.equal(n, 1);
  });

  it("returns UNAVAILABLE without fetching when unconfigured", async () => {
    let fetched = false;
    const client = createPresenceClient({
      fetchImpl: async () => {
        fetched = true;
        throw new Error("must not fetch");
      },
      getConfig: () => ({ url: null, secret: null }),
      ...quiet,
    });
    assert.deepEqual(await client.getPresence(), UNAVAILABLE_PRESENCE);
    assert.equal(fetched, false);
  });
});

describe("live stub bridge end-to-end", () => {
  const SECRET = "t".repeat(32);
  let base = "";
  let server;

  before(async () => {
    server = http.createServer((req, res) => {
      const send = (code, body) => {
        const payload = JSON.stringify(body);
        res.writeHead(code, { "content-type": "application/json", "content-length": Buffer.byteLength(payload) });
        res.end(payload);
      };
      if (req.url === "/presence" && req.headers.authorization === `Bearer ${SECRET}`) {
        send(200, { status: "online", available: true, source: "discord-gateway" });
      } else if (req.url === "/presence") {
        send(401, { error: "unauthorized" });
      } else {
        send(404, { error: "not-found" });
      }
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    base = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it("resolves a live status through real fetch + auth headers", async () => {
    const client = createPresenceClient({
      fetchImpl: (url, init) => fetch(url, init),
      getConfig: () => ({ url: base, secret: SECRET }),
      onWarn: () => {},
      onError: () => {},
    });
    assert.deepEqual(await client.getPresence(), {
      status: "online",
      available: true,
      source: "discord-gateway",
    });
  });

  it("a wrong secret surfaces as UNAVAILABLE, never an exception", async () => {
    const client = createPresenceClient({
      fetchImpl: (url, init) => fetch(url, init),
      getConfig: () => ({ url: base, secret: "w".repeat(32) }),
      onWarn: () => {},
      onError: () => {},
    });
    assert.deepEqual(await client.getPresence(), UNAVAILABLE_PRESENCE);
  });
});
