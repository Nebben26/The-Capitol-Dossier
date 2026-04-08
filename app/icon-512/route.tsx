import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "512px",
          height: "512px",
          borderRadius: "108px",
          background: "#57D7BA",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          fontSize: "256px",
          fontWeight: "900",
          color: "#0f1119",
        }}
      >
        Q
      </div>
    ),
    { width: 512, height: 512 }
  );
}
