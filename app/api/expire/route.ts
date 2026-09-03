import { NextRequest, NextResponse } from "next/server";
import { isAuthorisedMaintenanceCall } from "../../lib/auth";

export const runtime = "edge";

// Article expiry is turned off so existing articles persist while we are out
// of credits and cannot regenerate them. Re-enable by restoring the expiry
// logic below the guard and adding the cron back in vercel.json.
//
// Same reasoning as cleanup: the guard goes in now, while the body is inert,
// so that re-enabling the deletion is a one-line change that cannot
// accidentally ship an open endpoint.
export async function POST(req: NextRequest) {
  if (!isAuthorisedMaintenanceCall(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    expired: 0,
    disabled: true,
    note: "expire is disabled - articles are preserved",
  });
}
