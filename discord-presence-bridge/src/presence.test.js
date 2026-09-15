// Pure-logic tests: no Gateway, no network, no secrets.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildResponse,
  createPresenceStore,
  isAuthorized,
  isAvailable,
  normalizeStatus,
  unavailableResponse,
  validateEnv,
} from "./presence.js";

describe("normalizeStatus", () => {
  it("passes through the four Discord states", () => {
    for (const s of ["online", "idle", "dnd", "offline"]) {
      assert.equal(normalizeStatus(s), s);
    }
  });

  it("maps everything else to unavailable — never guesses", () => {
    for (const s of [undefined, null, "", "invisible", "ONLINE", "unknown", 42, {}]) {
      assert.equal(normalizeStatus(s), "unavailable");
    }
  });
});

describe("responses", () => {
  it("marks real Discord states available from discord-gateway", () => {
    assert.deepEqual(buildResponse("online"), {
      status: "online",
      available: true,
      source: "discord-gateway",
    });
    assert.deepEqual(buildResponse("offline"), {
      status: "offline",
      available: true,
      source: "discord-gateway",
    });
  });

  it("never converts failure into offline", () => {
    assert.deepEqual(buildResponse("unavailable"), {
      status: "unavailable",
      available: false,
      source: "bridge",
    });
    assert.deepEqual(buildResponse("bogus"), unavailableResponse());
    assert.equal(isAvailable("online"), true);
    assert.equal(isAvailable("offline"), true);
    assert.equal(isAvailable("unavailable"), false);
  });

  it("exposes only the tiny normalized shape", () => {
    assert.deepEqual(Object.keys(buildResponse("idle")).sort(), ["available", "source", "status"]);
  });
});

describe("isAuthorized", () => {
  const secret = "x".repeat(32);

  it("accepts the exact Bearer secret", () => {
    assert.equal(isAuthorized(`Bearer ${secret}`, secret), true);
  });

  it("rejects missing, malformed, and wrong secrets", () => {
    assert.equal(isAuthorized(undefined, secret), false);
    assert.equal(isAuthorized("", secret), false);
    assert.equal(isAuthorized("Bearer", secret), false);
    assert.equal(isAuthorized("Basic abc", secret), false);
    assert.equal(isAuthorized("Bearer wrong", secret), false);
    assert.equal(isAuthorized(`Bearer ${secret}x`, secret), false);
    assert.equal(isAuthorized("Bearer ", secret), false);
  });

  it("rejects empty configured secrets outright", () => {
    assert.equal(isAuthorized("Bearer anything", ""), false);
  });
});

describe("validateEnv", () => {
  const good = {
    DISCORD_BOT_TOKEN: "tok",
    DISCORD_GUILD_ID: "123",
    PRESENCE_SHARED_SECRET: "y".repeat(32),
  };

  it("passes a complete config", () => {
    assert.deepEqual(validateEnv(good), []);
  });

  it("lists every missing value without echoing secrets", () => {
    const problems = validateEnv({}).join("|");
    assert.match(problems, /DISCORD_BOT_TOKEN/);
    assert.match(problems, /DISCORD_GUILD_ID/);
    assert.match(problems, /PRESENCE_SHARED_SECRET/);
  });

  it("rejects short shared secrets", () => {
    const problems = validateEnv({ ...good, PRESENCE_SHARED_SECRET: "short" });
    assert.equal(problems.length, 1);
    assert.match(problems[0], /32/);
    assert.ok(!problems[0].includes("short"), "secret value must not be echoed");
  });
});

describe("createPresenceStore", () => {
  it("starts unavailable and only moves on owner-scoped data", () => {
    const store = createPresenceStore();
    assert.equal(store.get(), "unavailable");
    store.setFromGateway("online");
    assert.equal(store.get(), "online");
    store.setFromGateway("weird");
    assert.equal(store.get(), "unavailable");
    store.setFromGateway("dnd");
    store.markUnavailable();
    assert.equal(store.get(), "unavailable");
  });
});
