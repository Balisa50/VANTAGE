import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Throttling for on-demand article generation.
 *
 * There are two separate jobs here and they want different mechanisms.
 *
 * The GLOBAL cap protects the NVIDIA quota, and it has to hold across every
 * running instance or it does not hold at all. The previous version kept the
 * daily counter in a module-level variable on an edge function, so each
 * isolate counted its own thirty. Vercel runs many isolates across regions,
 * which made a "30 per day" limit closer to thirty times however many
 * instances happened to be warm.
 *
 * It is now counted out of the articles table, which is already the ledger:
 * every on-demand generation inserts exactly one row tagged "On-Demand". No
 * new table, no migration, no second service to keep in sync, and no drift
 * between the counter and the thing it counts.
 *
 * The PER-IP cap is friction rather than accounting, and it stays in memory.
 * Enforcing it in Postgres would mean a write on every request to a free-tier
 * database in order to slow down one impatient visitor, which is a worse
 * trade than a limit that resets when an isolate recycles. The global cap is
 * what actually protects the money.
 */

export const PER_IP_PER_HOUR = 3;
export const GLOBAL_PER_DAY = 30;

const HOUR = 3_600_000;
const MAX_TRACKED_IPS = 5_000;

type Entry = { count: number; resetAt: number };
const perIp = new Map<string, Entry>();

/** Drop expired entries. Without this the map only ever grows. */
function evictExpired(now: number): void {
  for (const [ip, entry] of perIp) {
    if (now > entry.resetAt) perIp.delete(ip);
  }
  // Hard ceiling in case a flood of unique IPs arrives inside one window.
  if (perIp.size > MAX_TRACKED_IPS) {
    const overflow = perIp.size - MAX_TRACKED_IPS;
    let dropped = 0;
    for (const ip of perIp.keys()) {
      perIp.delete(ip);
      if (++dropped >= overflow) break;
    }
  }
}

export function ipIsOverLimit(ip: string): boolean {
  const now = Date.now();
  evictExpired(now);

  const entry = perIp.get(ip);
  if (!entry || now > entry.resetAt) {
    perIp.set(ip, { count: 1, resetAt: now + HOUR });
    return false;
  }
  entry.count += 1;
  return entry.count > PER_IP_PER_HOUR;
}

/**
 * How many on-demand articles have been generated in the last 24 hours,
 * across every instance.
 *
 * Returns null when the count cannot be read, so the caller can decide what
 * to do rather than having a decision made for it by a failed query.
 *
 * This counts generations that were successfully stored. A run that calls the
 * model and then fails before the insert still costs a request and is not
 * counted here, so the cap is a close bound rather than an exact one.
 */
export async function onDemandCountLast24h(
  db: SupabaseClient
): Promise<number | null> {
  const since = new Date(Date.now() - 24 * HOUR).toISOString();
  const { count, error } = await db
    .from("articles")
    .select("id", { count: "exact", head: true })
    .contains("signal_sources", ["On-Demand"])
    .gte("created_at", since);

  if (error || count === null) return null;
  return count;
}

/**
 * Per-instance fallback for when the shared count cannot be read.
 *
 * If the query fails we are choosing between letting everything through,
 * which is how a quota gets drained during a database wobble, and refusing
 * everything, which turns one broken query into a dead feature. Neither is
 * good, so the old per-instance counter stays as a floor. It is weaker than
 * the shared count, and it is strictly better than nothing.
 */
const DAY = 24 * HOUR;
let localDayCount = 0;
let localDayResetAt = Date.now() + DAY;

export function localGlobalIsOverLimit(): boolean {
  const now = Date.now();
  if (now > localDayResetAt) {
    localDayCount = 0;
    localDayResetAt = now + DAY;
  }
  if (localDayCount >= GLOBAL_PER_DAY) return true;
  localDayCount += 1;
  return false;
}
