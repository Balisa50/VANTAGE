import { NextRequest, NextResponse } from "next/server";
import { supabase, type Article } from "../../lib/supabase";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ articles: [] });
  }

  // Use Supabase text search with headline and full_body
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .or(`headline.ilike.%${q}%,subheadline.ilike.%${q}%,full_body.ilike.%${q}%`)
    .order("published_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ articles: (data as Article[]) ?? [] });
}
