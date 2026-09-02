import * as Sentry from "@sentry/nextjs";

/**
 * Server and edge error reporting.
 *
 * A no-op when SENTRY_DSN is unset, which is the case locally and in any
 * deploy where the variable has not been added. That is deliberate:
 * monitoring must never be the reason a build or a boot fails. Without a DSN
 * you lose reporting, not the app.
 *
 * This exists because the feed was empty in production for weeks and nothing
 * said so. The failure was not the bug, it was that nobody was told.
 */
export function register(): void {
  const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
    // Errors are the point. Tracing is sampled low because the free tier is a
    // fixed monthly allowance and a busy trace stream would spend it on data
    // nobody reads, leaving none for the errors that matter.
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
  });
}

// Called for every server-side error, including those thrown inside React
// Server Components, which otherwise never reach an error reporter.
export const onRequestError = Sentry.captureRequestError;
