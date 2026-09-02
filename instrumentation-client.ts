import * as Sentry from "@sentry/nextjs";

/**
 * Browser error reporting. No-op without a DSN, same as the server side.
 *
 * Reports go through the same-origin tunnel configured in next.config.ts
 * rather than straight to sentry.io, because ad-blockers routinely drop
 * direct calls to analytics hosts and would silently lose exactly the reports
 * from the users most likely to be hitting bugs.
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment:
      process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
    tracesSampleRate: 0.1,
    // Session replay records the DOM and would exhaust the free-tier quota
    // within days. Off until there is a reason and a budget for it.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    sendDefaultPii: false,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
