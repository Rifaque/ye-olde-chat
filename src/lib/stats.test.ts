import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  clientAddress,
  createMemoryStore,
  createRedisRestStore,
  hashClient,
  parseCopyRequest,
  parseRanking,
  RATE_LIMIT,
  readPopular,
  recordCopy,
  resolveStatsStore,
  STATS_KEYS,
  type StatsStore,
} from "./stats.ts";

function recordingStore(inner: StatsStore = createMemoryStore()) {
  const commands: (readonly (string | number)[])[] = [];
  const store: StatsStore = {
    exec: (batch) => {
      commands.push(...batch);
      return inner.exec(batch);
    },
  };
  return { store, commands };
}

const failingStore: StatsStore = { exec: async () => Promise.reject(new Error("redis down")) };

describe("copy requests", () => {
  it("accepts only a known phrase id", () => {
    assert.equal(parseCopyRequest(JSON.stringify({ phraseId: "mods-alert" })), "mods-alert");
    assert.equal(parseCopyRequest(JSON.stringify({ phraseId: "definitely-not-a-phrase" })), null);
    assert.equal(parseCopyRequest(JSON.stringify({ phraseId: "phrase:copies:all" })), null);
    assert.equal(parseCopyRequest(JSON.stringify({ phraseId: 7 })), null);
    assert.equal(parseCopyRequest(JSON.stringify(["mods-alert"])), null);
    assert.equal(parseCopyRequest("not json"), null);
    assert.equal(parseCopyRequest(JSON.stringify({ phraseId: "mods-alert", padding: "x".repeat(600) })), null);
  });

  it("increments the global ranking and total for a valid copy", async () => {
    const { store, commands } = recordingStore();
    assert.equal(await recordCopy({ store, phraseId: "skill-issue", client: "abc", now: 0 }), "recorded");
    assert.deepEqual(commands.slice(-2), [
      ["ZINCRBY", STATS_KEYS.ranking, 1, "skill-issue"],
      ["INCR", STATS_KEYS.total],
    ]);
    const popular = await readPopular(store);
    assert.deepEqual(popular, { available: true, total: 1, phrases: [{ id: "skill-issue", count: 1 }] });
  });

  it("rejects unknown ids without touching the store", async () => {
    const { store, commands } = recordingStore();
    assert.equal(await recordCopy({ store, phraseId: "nope", client: "abc" }), "invalid");
    assert.equal(await recordCopy({ store, phraseId: { $gt: "" }, client: "abc" }), "invalid");
    assert.deepEqual(commands, []);
  });

  it("rate limits a single client per minute, then lets it resume", async () => {
    let now = 1_000_000;
    const { store } = recordingStore(createMemoryStore(() => now));
    for (let i = 0; i < RATE_LIMIT.maxCopies; i++) {
      assert.equal(await recordCopy({ store, phraseId: "gg", client: "spammer", now }), "recorded");
    }
    assert.equal(await recordCopy({ store, phraseId: "gg", client: "spammer", now }), "rate-limited");
    assert.equal(await recordCopy({ store, phraseId: "gg", client: "someone-else", now }), "recorded");
    assert.equal((await readPopular(store)).total, RATE_LIMIT.maxCopies + 1);

    now += RATE_LIMIT.windowSeconds * 1000;
    assert.equal(await recordCopy({ store, phraseId: "gg", client: "spammer", now }), "recorded");
  });

  it("gives rate-limit keys a short lifetime", async () => {
    const { store, commands } = recordingStore();
    await recordCopy({ store, phraseId: "gg", client: "abc", now: 0 });
    const expire = commands.find(([name]) => name === "EXPIRE");
    assert.ok(expire && String(expire[1]).startsWith(STATS_KEYS.rateLimitPrefix));
    assert.ok(Number(expire[2]) <= RATE_LIMIT.windowSeconds * 2);
  });

  it("reports an unavailable store instead of throwing", async () => {
    assert.equal(await recordCopy({ store: null, phraseId: "gg", client: "abc" }), "unavailable");
    assert.equal(await recordCopy({ store: failingStore, phraseId: "gg", client: "abc" }), "unavailable");
  });
});

describe("popular rankings", () => {
  it("maps a WITHSCORES reply to ranked, known phrases", () => {
    assert.deepEqual(parseRanking(["mods-alert", "1842", "retired-phrase", "900", "skill-issue", "1561", "caught-in-4k", "0"]), [
      { id: "mods-alert", count: 1842 },
      { id: "skill-issue", count: 1561 },
    ]);
    assert.deepEqual(parseRanking(["gg", "3", "w", "9"], 1), [{ id: "w", count: 9 }]);
    assert.deepEqual(parseRanking(null), []);
    assert.deepEqual(parseRanking(["gg", "not-a-number"]), []);
  });

  it("sorts by count across real increments", async () => {
    const store = createMemoryStore();
    for (const [id, times] of [["gg", 2], ["mods-alert", 5], ["skill-issue", 3]] as const) {
      for (let i = 0; i < times; i++) await recordCopy({ store, phraseId: id, client: `client-${id}`, now: 0 });
    }
    const popular = await readPopular(store);
    assert.deepEqual(popular.phrases.map(({ id }) => id), ["mods-alert", "skill-issue", "gg"]);
    assert.equal(popular.total, 10);
  });

  it("is unavailable, not broken, without a working store", async () => {
    assert.deepEqual(await readPopular(null), { available: false, total: null, phrases: [] });
    assert.deepEqual(await readPopular(failingStore), { available: false, total: null, phrases: [] });
  });
});

describe("stats configuration and privacy", () => {
  it("uses Redis only when credentials exist, and never a memory store in production", () => {
    assert.equal(resolveStatsStore({}), null);
    assert.ok(resolveStatsStore({ UPSTASH_REDIS_REST_URL: "https://redis.example", UPSTASH_REDIS_REST_TOKEN: "t" }));
    assert.ok(resolveStatsStore({ KV_REST_API_URL: "https://redis.example", KV_REST_API_TOKEN: "t" }));
    assert.ok(resolveStatsStore({ UPSTASH_REDIS_REST_URL: "", UPSTASH_REDIS_REST_TOKEN: "", KV_REST_API_URL: "https://redis.example", KV_REST_API_TOKEN: "t" }));
    assert.equal(resolveStatsStore({ UPSTASH_REDIS_REST_URL: "", UPSTASH_REDIS_REST_TOKEN: "" }), null);
    assert.ok(resolveStatsStore({ STATS_STORE: "memory", NODE_ENV: "development" }));
    assert.equal(resolveStatsStore({ STATS_STORE: "memory", NODE_ENV: "production" }), null);
  });

  it("hashes client addresses so no IP reaches the store", () => {
    const hashed = hashClient("203.0.113.7", "secret");
    assert.match(hashed, /^[0-9a-f]{16}$/);
    assert.equal(hashed, hashClient("203.0.113.7", "secret"));
    assert.notEqual(hashed, hashClient("203.0.113.7", "other-secret"));
    assert.ok(!hashed.includes("203"));
  });

  it("reads the client address from proxy headers", () => {
    assert.equal(clientAddress(new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" })), "203.0.113.7");
    assert.equal(clientAddress(new Headers({ "x-real-ip": "198.51.100.2" })), "198.51.100.2");
    assert.equal(clientAddress(new Headers()), "unknown");
  });

  it("talks to the Upstash REST pipeline with the token kept server-side", async () => {
    let request: { url: string; init: RequestInit } | undefined;
    const fakeFetch = (async (url: string, init: RequestInit) => {
      request = { url, init };
      return new Response(JSON.stringify([{ result: 1 }, { result: "OK" }]));
    }) as unknown as typeof fetch;
    const store = createRedisRestStore("https://redis.example/", "secret-token", fakeFetch);
    assert.deepEqual(await store.exec([["INCR", "a"], ["GET", "a"]]), [1, "OK"]);
    assert.equal(request?.url, "https://redis.example/pipeline");
    assert.equal((request?.init.headers as Record<string, string>).Authorization, "Bearer secret-token");
    assert.equal(request?.init.body, JSON.stringify([["INCR", "a"], ["GET", "a"]]));

    const erroring = createRedisRestStore("https://redis.example", "t", (async () => new Response(JSON.stringify([{ error: "WRONGTYPE" }]))) as unknown as typeof fetch);
    await assert.rejects(erroring.exec([["INCR", "a"]]), /WRONGTYPE/);
    const down = createRedisRestStore("https://redis.example", "t", (async () => new Response("nope", { status: 500 })) as unknown as typeof fetch);
    await assert.rejects(down.exec([["INCR", "a"]]), /500/);
  });
});
