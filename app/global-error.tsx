"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0d1117",
            color: "#f0f6fc",
            fontFamily: "sans-serif",
            padding: "24px",
          }}
        >
          <div style={{ maxWidth: "400px", textAlign: "center" }}>
            <h1 style={{ fontSize: "24px", marginBottom: "12px" }}>
              Something went very wrong
            </h1>
            <p
              style={{
                fontSize: "14px",
                color: "#8d96a0",
                marginBottom: "24px",
              }}
            >
              We&apos;ve been notified and are looking into it. Try reloading the
              page.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: "#57D7BA",
                color: "#0d1117",
                border: "none",
                padding: "12px 24px",
                borderRadius: "8px",
                fontWeight: 700,
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Reload
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
