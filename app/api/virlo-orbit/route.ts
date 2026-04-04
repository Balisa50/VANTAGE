import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// Launch a Virlo Orbit search for tech trends across social video platforms
export async function POST(req: NextRequest) {
  const apiKey = process.env.VIRLO_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Virlo not configured" }, { status: 503 });
  }

  try {
    const { keywords, platforms } = await req.json();

    const res = await fetch("https://api.virlo.ai/v1/orbit", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: `Vantage Tech Intel: ${keywords?.join(", ") || "tech trends"}`,
        keywords: keywords || ["AI technology", "tech startup", "artificial intelligence"],
        time_period: "this_week",
        platforms: platforms || ["youtube", "tiktok", "instagram"],
        min_views: 10000,
        run_analysis: true,
        intent: "Discover viral tech content and emerging technology trends for intelligence analysis",
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `Virlo: ${res.status}`, detail: err }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Orbit search failed" },
      { status: 500 }
    );
  }
}

// Poll orbit results
export async function GET(req: NextRequest) {
  const apiKey = process.env.VIRLO_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Virlo not configured" }, { status: 503 });
  }

  const orbitId = req.nextUrl.searchParams.get("id");
  if (!orbitId) {
    return NextResponse.json({ error: "Missing orbit id" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://api.virlo.ai/v1/orbit/${orbitId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Virlo: ${res.status}` }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
