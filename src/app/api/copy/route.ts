import { NextResponse } from "next/server";
import { clientAddress, hashClient, parseCopyRequest, rateLimitSecret, recordCopy, resolveStatsStore } from "@/lib/stats";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

/** Counts one confirmed copy of a known phrase. See src/lib/stats.ts for what is and isn't stored. */
export async function POST(request: Request) {
  // Browsers mark cross-site requests; turning those away keeps other pages from inflating counts.
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return NextResponse.json({ recorded: false, reason: "forbidden" }, { status: 403, headers: noStore });
  }

  const phraseId = parseCopyRequest(await request.text());
  if (!phraseId) {
    return NextResponse.json({ recorded: false, reason: "invalid" }, { status: 400, headers: noStore });
  }

  const outcome = await recordCopy({
    store: resolveStatsStore(),
    phraseId,
    client: hashClient(clientAddress(request.headers), rateLimitSecret()),
  });

  const status = { recorded: 200, invalid: 400, "rate-limited": 429, unavailable: 503 }[outcome];
  return NextResponse.json({ recorded: outcome === "recorded", reason: outcome }, { status, headers: noStore });
}
