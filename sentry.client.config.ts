import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://d75bfb3ca09d0673703454a88bee58ff@o4511185002102784.ingest.us.sentry.io/4511185229316096",
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
  environment: process.env.NODE_ENV,
});
