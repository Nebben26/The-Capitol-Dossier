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
            borderRadius: "108px",
          }}
        >
          <div
            style={{
              fontSize: 256,
              fontWeight: 900,
              color: "#0f1119",
            }}
          >
            Q
          </div>
        </div>
      ),
      { width: 512, height: 512 }
    );
  } catch (err) {
    console.error("[icon-512] failed:", err);
    return new Response("Icon generation failed", { status: 500 });
  }
}
