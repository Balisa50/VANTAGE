import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 10;

// External cron services (cron-job.org etc) hit this endpoint
// It triggers the full pipeline by firing and forgetting
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://vantage-three-chi.vercel.app";

  // Fire and forget — don't await, just kick off the pipeline
  fetch(`${siteUrl}/api/generate-articles?region=global`, {
    method: "POST",
    headers: { "x-chain-secret": process.env.CRON_SECRET ?? "" },
  }).catch(() => {});

  // Also trigger expiry cleanup
  fetch(`${siteUrl}/api/expire`, {
    method: "POST",
    headers: { "x-api-secret": process.env.CRON_SECRET ?? "" },
  }).catch(() => {});

  return NextResponse.json({
    triggered: true,
    timestamp: new Date().toISOString(),
    message: "Pipeline started for all regions",
  });
}
