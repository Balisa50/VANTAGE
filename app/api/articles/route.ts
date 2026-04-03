import { NextRequest, NextResponse } from "next/server";
import { supabase, type Article } from "../../lib/supabase";

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category");
  const region = req.nextUrl.searchParams.get("region");
  const since = req.nextUrl.searchParams.get("since");
  const sort = req.nextUrl.searchParams.get("sort");

  // Default: only last 24 hours
  const defaultCutoff = new Date(
    Date.now() - 48 * 60 * 60 * 1000
  ).toISOString();

  let query = supabase
    .from("articles")
    .select("*")
    .gte("published_at", since || defaultCutoff)
    .limit(30);

  if (sort === "signal") {
    query = query.order("signal_score", { ascending: false });
  } else {
    query = query.order("published_at", { ascending: false });
  }

  if (category && category !== "All") {
    query = query.eq("category", category);
  }

  if (region && region !== "all") {
    query = query.eq("region", region);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { articles: (data as Article[]) ?? [] },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    }
  );
}
