import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// Fetch trending hashtags and topics from Virlo
export async function GET(req: NextRequest) {
  const apiKey = process.env.VIRLO_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Virlo not configured" }, { status: 503 });
  }

  const platform = req.nextUrl.searchParams.get("platform") || "tiktok";
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "15");

  try {
    // Fetch trending hashtags
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(
      `https://api.virlo.ai/v1/hashtags?limit=${limit}&order_by=views&sort=desc&platform=${platform}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: controller.signal,
        cache: "no-store",
      }
    );
    clearTimeout(timeout);

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `Virlo API: ${res.status}`, detail: err }, { status: res.status });
    }

    const data = await res.json();

    return NextResponse.json({
      platform,
      trends: data.data || data.hashtags || data,
      fetched_at: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch trends" },
      { status: 500 }
    );
  }
}
