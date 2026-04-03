import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 15;

// External cron services (cron-job.org etc) hit this endpoint
// It triggers the full pipeline by calling generate-articles
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://vantage-three-chi.vercel.app";

  // Fire off the pipeline (starts with global, chains through all regions)
  try {
    const res = await fetch(`${siteUrl}/api/generate-articles?region=global`, {
      method: "POST",
      headers: { "x-chain-secret": process.env.CRON_SECRET ?? "" },
    });

    const data = await res.json();

    // Also trigger expiry cleanup
    fetch(`${siteUrl}/api/expire`, {
      method: "POST",
      headers: { "x-api-secret": process.env.CRON_SECRET ?? "" },
    }).catch(() => {});

    return NextResponse.json({
      triggered: true,
      pipeline: data,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Trigger failed" },
      { status: 500 }
    );
  }
}
