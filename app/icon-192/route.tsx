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
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#57D7BA",
            borderRadius: "40px",
          }}
        >
          <div
            style={{
              fontSize: 96,
              fontWeight: 900,
              color: "#0f1119",
            }}
          >
            Q
          </div>
        </div>
      ),
      { width: 192, height: 192 }
    );
  } catch (err) {
    console.error("[icon-192] failed:", err);
    return new Response("Icon generation failed", { status: 500 });
  }
}
