import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: { unoptimized: true },
};

const sentryWebpackPluginOptions = {
  org: process.env.SENTRY_ORG || "the-conspiracy-trader-llc",
  project: process.env.SENTRY_PROJECT || "javascript-nextjs",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring-tunnel",
  hideSourceMaps: true,
  disableLogger: true,
};

// Only wrap with Sentry if an auth token is configured
const isSentryConfigured =
  !!process.env.SENTRY_AUTH_TOKEN &&
  !process.env.SENTRY_AUTH_TOKEN.includes("PLACEHOLDER");

export default isSentryConfigured
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig;
