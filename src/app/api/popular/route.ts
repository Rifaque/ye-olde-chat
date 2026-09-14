import { NextResponse } from "next/server";
import { readPopular, resolveStatsStore } from "@/lib/stats";

export const dynamic = "force-dynamic";

/** Global ranking of phrase ids by copy count, plus the running total. */
export async function GET() {
  const stats = await readPopular(resolveStatsStore());
  return NextResponse.json(stats, {
    headers: {
      // Rankings move slowly: the CDN caches briefly to keep Redis reads to a trickle, browsers always revalidate.
      "Cache-Control": stats.available ? "public, max-age=0, s-maxage=30, stale-while-revalidate=300" : "public, max-age=0, s-maxage=10",
    },
  });
}
