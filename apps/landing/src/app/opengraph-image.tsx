import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          background: "#08090a",
          padding: "80px",
          fontFamily: "monospace",
        }}
      >
        <div style={{ display: "flex", fontSize: 44, fontWeight: 700, color: "#f3f4f5", letterSpacing: -1 }}>
          EXE<span style={{ color: "#4c8dff" }}>K</span>PRO
        </div>
        <div style={{ display: "flex", marginTop: 28, fontSize: 34, color: "#f3f4f5", maxWidth: 980, lineHeight: 1.3 }}>
          Execution infrastructure for intent-driven applications.
        </div>
        <div style={{ display: "flex", marginTop: 32, fontSize: 22, color: "#99a1a9" }}>
          Intent → Candidates → Simulate → Score → Execute
        </div>
      </div>
    ),
    { ...size },
  );
}
