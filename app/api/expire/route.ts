import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// DISABLED - article deletion is intentionally turned off so existing
// articles persist while we are out of Anthropic credits and cannot
// regenerate them. Re-enable by restoring the original logic and adding
// the cron back in vercel.json.
export async function POST(_req: NextRequest) {
  return NextResponse.json({
    expired: 0,
    disabled: true,
    note: "expire is disabled - articles are preserved",
  });
}
