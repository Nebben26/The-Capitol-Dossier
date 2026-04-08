import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          background: "#1a1e2e",
          padding: "80px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Logo mark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "#57D7BA",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
              fontWeight: "900",
              color: "#0f1119",
            }}
          >
            Q
          </div>
          <span
            style={{
              fontSize: "28px",
              fontWeight: "700",
              color: "#e2e8f0",
            }}
          >
            Quiver Markets
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: "64px",
            fontWeight: "800",
            color: "#e2e8f0",
            lineHeight: "1.1",
            marginBottom: "24px",
          }}
        >
          Prediction Market
          <br />
          <span style={{ color: "#57D7BA" }}>Intelligence</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: "24px",
            color: "#8892b0",
            marginBottom: "48px",
          }}
        >
          Real-time analytics, whale tracking &amp; arbitrage detection
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: "32px" }}>
          {[
            { val: "6,500+", label: "Markets" },
            { val: "200+", label: "Whales" },
            { val: "300+", label: "Arb opportunities" },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <span
                style={{
                  fontSize: "32px",
                  fontWeight: "800",
                  color: "#57D7BA",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {s.val}
              </span>
              <span style={{ fontSize: "16px", color: "#4a5168" }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
