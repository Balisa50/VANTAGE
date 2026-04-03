import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

// Delete articles older than 24 hours — keeps content fresh
export async function POST(req: NextRequest) {
  const isVercelCron = req.headers.get("x-vercel-cron") === "1";
  const isManual =
    req.headers.get("x-api-secret") === process.env.CRON_SECRET;

  if (!isVercelCron && !isManual) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: expired } = await getSupabaseAdmin()
      .from("articles")
      .select("id")
      .lt("published_at", cutoff);

    const count = expired?.length ?? 0;

    if (count > 0) {
      const { error } = await getSupabaseAdmin()
        .from("articles")
        .delete()
        .lt("published_at", cutoff);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ expired: count, cutoff });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Expire failed" },
      { status: 500 }
    );
  }
}
