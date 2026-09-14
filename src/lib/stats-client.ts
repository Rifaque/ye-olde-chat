import type { PopularStats } from "./stats.ts";

/**
 * Tells the server a copy succeeded. Deliberately fire-and-forget: counting is
 * secondary, so a failure here is swallowed and never touches the copy state.
 */
export function reportCopy(phraseId: string, fetchImpl: typeof fetch = fetch): Promise<void> {
  try {
    return fetchImpl("/api/copy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phraseId }),
      keepalive: true,
    }).then(
      () => undefined,
      () => undefined,
    );
  } catch {
    return Promise.resolve();
  }
}

const unavailable: PopularStats = { available: false, total: null, phrases: [] };

export async function fetchPopular(signal?: AbortSignal): Promise<PopularStats> {
  try {
    const response = await fetch("/api/popular", { signal });
    if (!response.ok) return unavailable;
    const data = (await response.json()) as PopularStats;
    return data && data.available === true && Array.isArray(data.phrases) ? data : unavailable;
  } catch {
    return unavailable;
  }
}
