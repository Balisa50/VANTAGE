import { NextRequest, NextResponse } from "next/server";
import { isAuthorisedMaintenanceCall } from "../../lib/auth";

// Junk-removal is turned off so no article can be deleted while we are out
// of credits and cannot regenerate them. Re-enable by restoring the delete
// logic below the guard.
//
// The guard stays in place while the body is disabled, deliberately. This
// route returned 200 to anyone who asked, which was harmless only because it
// does nothing; restoring the delete logic under an open endpoint would have
// handed the whole article table to whoever found the URL.
export async function POST(req: NextRequest) {
  if (!isAuthorisedMaintenanceCall(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    deleted: 0,
    disabled: true,
    note: "cleanup is disabled - articles are preserved",
  });
}
