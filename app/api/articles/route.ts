import { NextRequest, NextResponse } from "next/server";
import { supabase, type Article } from "../../lib/supabase";

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category");
  const region = req.nextUrl.searchParams.get("region");

  let query = supabase
    .from("articles")
    .select("*")
    .order("published_at", { ascending: false })
    .limit(20);

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
