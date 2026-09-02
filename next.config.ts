import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "source.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
    unoptimized: true, // Unsplash already serves optimized images
  },
};

/**
 * Error reporting.
 *
 * `tunnelRoute` sends browser reports to this origin, which forwards them.
 * Ad-blockers routinely drop direct calls to analytics hosts, which would
 * silently lose exactly the reports from the users most likely to be hitting
 * bugs.
 *
 * Source maps upload only when an auth token exists. Without one the build
 * still succeeds and stack traces are merely minified, which is the right
 * trade: a missing token must never fail a deploy.
 */
export default withSentryConfig(nextConfig, {
  silent: !process.env.CI,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  tunnelRoute: "/monitoring",
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
  disableLogger: true,
});
