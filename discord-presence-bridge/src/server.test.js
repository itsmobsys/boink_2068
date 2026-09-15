// HTTP-layer tests: real sockets on an ephemeral port, stubbed
// presence state — the Gateway is never involved.
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "./server.js";

const SECRET = "s".repeat(32);
let base = "";
let server;
let currentStatus = "online";

before(async () => {
  server = createServer({
    getPresence: () => currentStatus,
    secret: SECRET,
    logger: () => {},
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

async function get(path, secret = null) {
  const headers = secret ? { authorization: `Bearer ${secret}` } : {};
  const res = await fetch(`${base}${path}`, { headers });
  return { status: res.status, json: await res.json() };
}

describe("bridge HTTP", () => {
  it("GET /health → 200 {ok:true} without auth", async () => {
    const { status, json } = await get("/health");
    assert.equal(status, 200);
    assert.deepEqual(json, { ok: true });
  });

  it("GET /presence without secret → 401", async () => {
    const { status, json } = await get("/presence");
    assert.equal(status, 401);
    assert.deepEqual(json, { error: "unauthorized" });
  });

  it("GET /presence with wrong secret → 401", async () => {
    const { status } = await get("/presence", "w".repeat(32));
    assert.equal(status, 401);
  });

  it("GET /presence with secret → normalized live state, nothing else", async () => {
    currentStatus = "idle";
    const { status, json } = await get("/presence", SECRET);
    assert.equal(status, 200);
    assert.deepEqual(json, { status: "idle", available: true, source: "discord-gateway" });
    currentStatus = "online";
  });

  it("gateway loss surfaces as unavailable, never offline", async () => {
    currentStatus = "unavailable";
    const { status, json } = await get("/presence", SECRET);
    assert.equal(status, 200);
    assert.deepEqual(json, { status: "unavailable", available: false, source: "bridge" });
    currentStatus = "online";
  });

  it("unknown routes and methods → 404", async () => {
    assert.equal((await get("/nope")).status, 404);
    assert.equal((await get("/presence?x=1", "short")).status, 401);
    const res = await fetch(`${base}/health`, { method: "POST" });
    assert.equal(res.status, 404);
  });
});
