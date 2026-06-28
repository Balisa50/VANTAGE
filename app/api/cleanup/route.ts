import { NextRequest, NextResponse } from "next/server";

// DISABLED - junk-removal is also turned off so no article can be deleted
// while we are out of credits. Re-enable by restoring the original logic.
export async function POST(_req: NextRequest) {
  return NextResponse.json({
    deleted: 0,
    disabled: true,
    note: "cleanup is disabled - articles are preserved",
  });
}
