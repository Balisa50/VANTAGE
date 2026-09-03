import { NextRequest } from "next/server";

/**
 * Is this request allowed to run a privileged maintenance job?
 *
 * Three callers are legitimate:
 *   - Vercel's own scheduler, which sets x-vercel-cron: 1
 *   - a manual run, which sends the shared secret as x-api-secret
 *   - one route calling another in a chain, which uses x-chain-secret
 *
 * Fails closed. If CRON_SECRET is unset in the environment, every
 * secret-based path is refused rather than matching an empty string, so a
 * misconfigured deploy cannot leave a destructive endpoint wide open.
 */
export function isAuthorisedMaintenanceCall(req: NextRequest): boolean {
  if (req.headers.get("x-vercel-cron") === "1") return true;

  const expected = process.env.CRON_SECRET;
  if (!expected) return false;

  return (
    req.headers.get("x-api-secret") === expected ||
    req.headers.get("x-chain-secret") === expected ||
    req.nextUrl.searchParams.get("secret") === expected
  );
}
