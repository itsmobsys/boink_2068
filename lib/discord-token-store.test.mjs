/* Token-store unit tests — plain node, zero dependencies.
   Run: npm test   (node --test discovers *.test.mjs under lib/)
   Every branch below runs against in-memory fakes: no network, no
   env, no secrets anywhere near the assertions. */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  TokenStoreError,
  createTokenStore,
} from "./discord-token-store.mjs";

function backend({ value = null, failRead = false, failWrite = false } = {}) {
  let current = value;
  const calls = { gets: 0, sets: 0 };
  return {
    calls,
    peek: () => current,
    kvGet: async () => {
      calls.gets += 1;
      if (failRead) throw new Error("kv down");
      return current;
    },
    kvSet: async (v) => {
      calls.sets += 1;
      if (failWrite) throw new Error("kv down");
      current = v;
    },
  };
}

describe("createTokenStore", () => {
  it("prefers the persistent backend over the env seed", async () => {
    const kv = backend({ value: "RT-from-kv-aaaaaaaaaaaaaaaa" });
    const store = createTokenStore({ ...kv, getEnvToken: () => "RT-from-env-bbbbbbbbbbbbbbbb" });
    assert.equal(await store.getRefreshToken(), "RT-from-kv-aaaaaaaaaaaaaaaa");
    assert.equal(await store.describeTokenSource(), "store");
    assert.equal(store.isConfigured(), true);
  });

  it("falls back to the env seed when the backend is empty", async () => {
    const kv = backend({ value: null });
    const store = createTokenStore({ ...kv, getEnvToken: () => "RT-from-env-bbbbbbbbbbbbbbbb" });
    assert.equal(await store.getRefreshToken(), "RT-from-env-bbbbbbbbbbbbbbbb");
    assert.equal(await store.describeTokenSource(), "env");
  });

  it("falls back to the env seed when the backend read fails", async () => {
    const kv = backend({ value: "RT-from-kv-aaaaaaaaaaaaaaaa", failRead: true });
    const store = createTokenStore({ ...kv, getEnvToken: () => "RT-from-env-bbbbbbbbbbbbbbbb" });
    assert.equal(await store.getRefreshToken(), "RT-from-env-bbbbbbbbbbbbbbbb");
  });

  it("returns null when neither backend nor env has a token", async () => {
    const kv = backend({ value: null });
    const store = createTokenStore({ ...kv, getEnvToken: () => null });
    assert.equal(await store.getRefreshToken(), null);
    assert.equal(await store.describeTokenSource(), null);
  });

  it("persists through the backend", async () => {
    const kv = backend({ value: null });
    const store = createTokenStore({ ...kv, getEnvToken: () => null });
    await store.setRefreshToken("RT-fresh-cccccccccccccccccccc");
    assert.equal(kv.peek(), "RT-fresh-cccccccccccccccccccc");
    assert.equal(await store.getRefreshToken(), "RT-fresh-cccccccccccccccccccc");
  });

  it("refuses an empty value without touching the backend", async () => {
    const kv = backend({ value: "RT-keep-dddddddddddddddddddd" });
    const store = createTokenStore({ ...kv, getEnvToken: () => null });
    await assert.rejects(store.setRefreshToken(""), (err) => err instanceof TokenStoreError && err.code === "INVALID_VALUE");
    await assert.rejects(store.setRefreshToken(null), (err) => err instanceof TokenStoreError);
    assert.equal(kv.calls.sets, 0);
    assert.equal(kv.peek(), "RT-keep-dddddddddddddddddddd");
  });

  it("throws STORE_UNAVAILABLE when no backend is configured", async () => {
    const store = createTokenStore({ kvGet: null, kvSet: null, getEnvToken: () => "RT-env" });
    assert.equal(store.isConfigured(), false);
    await assert.rejects(store.setRefreshToken("RT-x"), (err) => err instanceof TokenStoreError && err.code === "STORE_UNAVAILABLE");
    // reads still work from env in unconfigured mode
    assert.equal(await store.getRefreshToken(), "RT-env");
  });

  it("throws STORE_WRITE_FAILED when the backend rejects the write", async () => {
    const kv = backend({ value: "RT-old-eeeeeeeeeeeeeeeeeeee", failWrite: true });
    const store = createTokenStore({ ...kv, getEnvToken: () => null });
    await assert.rejects(store.setRefreshToken("RT-new-ffffffffffffffffffff"), (err) => {
      assert.equal(err.code, "STORE_WRITE_FAILED");
      // the error itself must never carry the secret
      assert.ok(!String(err.message).includes("RT-new-ffffffffffffffffffff"));
      return true;
    });
    assert.equal(kv.peek(), "RT-old-eeeeeeeeeeeeeeeeeeee");
  });

  it("never leaks token values through errors", async () => {
    const secret = "RT-topsecret-zzzzzzzzzzzzzzzzzz";
    const kv = backend({ failWrite: true });
    const store = createTokenStore({ ...kv, getEnvToken: () => null });
    try {
      await store.setRefreshToken(secret);
      assert.fail("should have thrown");
    } catch (err) {
      assert.ok(!String(err && err.message).includes(secret), "error message must be scrubbed");
    }
  });
});
