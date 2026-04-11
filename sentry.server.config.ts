import * as Sentry from "@sentry/nextjs";

const dsn =
  process.env.NEXT_PUBLIC_SENTRY_DSN ||
  "https://d75bfb3ca09d0673703454a88bee58ff@o4511185002102784.ingest.us.sentry.io/4511185229316096";

const isConfigured = dsn && !dsn.includes("PLACEHOLDER");

if (isConfigured) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV || "development",
  });
}
