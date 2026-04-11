import * as Sentry from "@sentry/nextjs";

// Accept DSN from env var (preferred) or fall back to hardcoded value for backwards compatibility
const dsn =
  process.env.NEXT_PUBLIC_SENTRY_DSN ||
  "https://d75bfb3ca09d0673703454a88bee58ff@o4511185002102784.ingest.us.sentry.io/4511185229316096";

const isConfigured = dsn && !dsn.includes("PLACEHOLDER");

if (isConfigured) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    environment: process.env.NODE_ENV || "development",
    beforeSend(event) {
      // Filter out noise
      if (event.request?.url?.includes("localhost")) return null;
      if (event.exception?.values?.[0]?.value?.includes("extension://")) return null;
      return event;
    },
  });
}
