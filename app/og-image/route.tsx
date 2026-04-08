import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  try {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0f1119",
            padding: "60px",
          }}
        >
          <div
            style={{
              fontSize: 96,
              fontWeight: 900,
              color: "#57D7BA",
              letterSpacing: "-2px",
              marginBottom: "24px",
            }}
          >
            Quiver Markets
          </div>
          <div
            style={{
              fontSize: 36,
              color: "#e2e8f0",
              marginBottom: "48px",
              textAlign: "center",
            }}
          >
            The intelligence layer for prediction markets
          </div>
          <div
            style={{
              fontSize: 24,
              color: "#8892b0",
              display: "flex",
            }}
          >
            Polymarket × Kalshi · 6,500+ markets · 200+ whales tracked
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (err) {
    console.error("[og-image] failed:", err);
    return new Response("OG image generation failed", { status: 500 });
  }
}
