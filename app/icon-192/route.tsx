import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "192px",
          height: "192px",
          borderRadius: "40px",
          background: "#57D7BA",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          fontSize: "96px",
          fontWeight: "900",
          color: "#0f1119",
        }}
      >
        Q
      </div>
    ),
    { width: 192, height: 192 }
  );
}
