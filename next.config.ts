import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: { unoptimized: true },
};

export default withSentryConfig(nextConfig, {
  org: "the-conspiracy-trader-llc",
  project: "javascript-nextjs",
  silent: true,
  widenClientFileUpload: true,
});
