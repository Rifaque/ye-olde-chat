import { createHmac } from "node:crypto";
import { isPhraseId } from "./phrases.ts";

/*
 * Anonymous, aggregate copy statistics. Server-only.
 *
 * Redis holds exactly two durable things: a sorted set of phrase id → copy
 * count, and a single running total. Phrase text is never stored; rankings are
 * joined with the corpus when read, so renamed or removed ids simply drop out.
 *
 * Rate limiting uses one short-lived counter per hashed client per minute.
 * The client IP is HMAC-hashed with a server secret before it touches Redis,
 * and the key expires within two minutes, so no lasting record of any visitor
 * is ever kept.
 */

export const STATS_KEYS = {
  ranking: "phrase:copies:all",
  total: "phrase:copies:total",
  rateLimitPrefix: "ratelimit:copy:",
} as const;

export const RATE_LIMIT = { windowSeconds: 60, maxCopies: 30 } as const;

export const POPULAR_LIMIT = 24;

type Command = readonly (string | number)[];

/** The one capability stats need from a store: run Redis commands in order. */
export type StatsStore = { exec: (commands: readonly Command[]) => Promise<unknown[]> };

type StatsEnvironment = Partial<Record<string, string>>;

/** Upstash's REST pipeline endpoint, called with plain fetch so no SDK is needed. */
export function createRedisRestStore(url: string, token: string, fetchImpl: typeof fetch = fetch): StatsStore {
  const endpoint = `${url.replace(/\/+$/, "")}/pipeline`;
  return {
    async exec(commands) {
      const response = await fetchImpl(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(commands),
        cache: "no-store",
        signal: AbortSignal.timeout(2000),
      });
      if (!response.ok) throw new Error(`Redis REST request failed with ${response.status}`);
      const replies = (await response.json()) as { result?: unknown; error?: string }[];
      if (!Array.isArray(replies) || replies.length !== commands.length) throw new Error("Unexpected Redis REST reply");
      return replies.map((reply) => {
        if (reply.error) throw new Error(`Redis error: ${reply.error}`);
        return reply.result;
      });
    },
  };
}

/** A single-process stand-in implementing only the commands used here. For tests and local development. */
export function createMemoryStore(now: () => number = Date.now): StatsStore {
  const values = new Map<string, { value: number; expiresAt?: number }>();
  const sets = new Map<string, Map<string, number>>();
  const live = (key: string) => {
    const entry = values.get(key);
    if (entry?.expiresAt !== undefined && entry.expiresAt <= now()) values.delete(key);
    return values.get(key);
  };

  const run = ([name, ...args]: Command): unknown => {
    switch (String(name).toUpperCase()) {
      case "INCR": {
        const key = String(args[0]);
        const entry = live(key) ?? { value: 0 };
        entry.value += 1;
        values.set(key, entry);
        return entry.value;
      }
      case "EXPIRE": {
        const entry = live(String(args[0]));
        if (entry) entry.expiresAt = now() + Number(args[1]) * 1000;
        return entry ? 1 : 0;
      }
      case "GET": {
        const entry = live(String(args[0]));
        return entry ? String(entry.value) : null;
      }
      case "ZINCRBY": {
        const set = sets.get(String(args[0])) ?? new Map<string, number>();
        const score = (set.get(String(args[2])) ?? 0) + Number(args[1]);
        set.set(String(args[2]), score);
        sets.set(String(args[0]), set);
        return String(score);
      }
      case "ZREVRANGE": {
        const members = [...(sets.get(String(args[0]))?.entries() ?? [])].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? 1 : -1));
        const stop = Number(args[2]);
        return members.slice(Number(args[1]), stop < 0 ? undefined : stop + 1).flatMap(([member, score]) => [member, String(score)]);
      }
      default:
        throw new Error(`Unsupported command ${String(name)}`);
    }
  };
  return { exec: async (commands) => commands.map(run) };
}

const memoryStoreKey = Symbol.for("ye-olde-chat.memory-stats-store");

/** The configured store, or null when stats are not set up (the site then works without them). */
export function resolveStatsStore(environment: StatsEnvironment = process.env): StatsStore | null {
  const url = environment.UPSTASH_REDIS_REST_URL || environment.KV_REST_API_URL;
  const token = environment.UPSTASH_REDIS_REST_TOKEN || environment.KV_REST_API_TOKEN;
  if (url && token) return createRedisRestStore(url, token);

  if (environment.STATS_STORE === "memory" && environment.NODE_ENV !== "production") {
    const holder = globalThis as typeof globalThis & { [memoryStoreKey]?: StatsStore };
    holder[memoryStoreKey] ??= createMemoryStore();
    return holder[memoryStoreKey];
  }
  return null;
}

export function rateLimitSecret(environment: StatsEnvironment = process.env): string {
  return (
    environment.STATS_RATE_LIMIT_SECRET ||
    environment.UPSTASH_REDIS_REST_TOKEN ||
    environment.KV_REST_API_TOKEN ||
    "ye-olde-chat-local-development"
  );
}

/** Returns the visitor's IP only long enough to hash it; nothing else about the request is used. */
export function clientAddress(headers: Pick<Headers, "get">): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "unknown";
}

export function hashClient(address: string, secret: string): string {
  return createHmac("sha256", secret).update(address).digest("hex").slice(0, 16);
}

/** Accepts only `{ "phraseId": "<known id>" }`. Anything else yields null. */
export function parseCopyRequest(body: string): string | null {
  if (body.length > 512) return null;
  let value: unknown;
  try {
    value = JSON.parse(body);
  } catch {
    return null;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const { phraseId } = value as { phraseId?: unknown };
  return isPhraseId(phraseId) ? phraseId : null;
}

export type CopyOutcome = "recorded" | "invalid" | "rate-limited" | "unavailable";

export async function recordCopy({
  store,
  phraseId,
  client,
  now = Date.now(),
}: {
  store: StatsStore | null;
  phraseId: unknown;
  /** Hashed client key from `hashClient`. */
  client: string;
  now?: number;
}): Promise<CopyOutcome> {
  // Validate before touching the store: user input never becomes a Redis key or member unchecked.
  if (!isPhraseId(phraseId)) return "invalid";
  if (!store) return "unavailable";
  try {
    const window = Math.floor(now / 1000 / RATE_LIMIT.windowSeconds);
    const limitKey = `${STATS_KEYS.rateLimitPrefix}${client}:${window}`;
    const [count] = await store.exec([
      ["INCR", limitKey],
      ["EXPIRE", limitKey, RATE_LIMIT.windowSeconds * 2],
    ]);
    if (Number(count) > RATE_LIMIT.maxCopies) return "rate-limited";
    await store.exec([
      ["ZINCRBY", STATS_KEYS.ranking, 1, phraseId],
      ["INCR", STATS_KEYS.total],
    ]);
    return "recorded";
  } catch {
    return "unavailable";
  }
}

export type PopularEntry = { id: string; count: number };

export type PopularStats =
  | { available: true; total: number; phrases: PopularEntry[] }
  | { available: false; total: null; phrases: [] };

/** Turns a flat `ZREVRANGE … WITHSCORES` reply into ranked entries for phrases that still exist. */
export function parseRanking(reply: unknown, limit = POPULAR_LIMIT): PopularEntry[] {
  if (!Array.isArray(reply)) return [];
  const entries: PopularEntry[] = [];
  for (let index = 0; index + 1 < reply.length; index += 2) {
    const id = reply[index];
    const count = Math.floor(Number(reply[index + 1]));
    if (isPhraseId(id) && Number.isFinite(count) && count > 0) entries.push({ id, count });
  }
  return entries.sort((a, b) => b.count - a.count).slice(0, limit);
}

export async function readPopular(store: StatsStore | null, limit = POPULAR_LIMIT): Promise<PopularStats> {
  const unavailable = { available: false, total: null, phrases: [] } as const;
  if (!store) return { ...unavailable, phrases: [] };
  try {
    // Over-fetch a little so ids retired from the corpus don't leave the list short.
    const [ranking, total] = await store.exec([
      ["ZREVRANGE", STATS_KEYS.ranking, 0, limit + 15, "WITHSCORES"],
      ["GET", STATS_KEYS.total],
    ]);
    return { available: true, total: Math.max(Number(total) || 0, 0), phrases: parseRanking(ranking, limit) };
  } catch {
    return { ...unavailable, phrases: [] };
  }
}
