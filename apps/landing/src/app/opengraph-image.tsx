import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The real wordmark asset (see public/wordmark.png), not hand-drawn text --
// satori (next/og's renderer) can't read the filesystem itself, so it's
// embedded as a data URI read at request time.
function wordmarkDataUri(): string {
  const bytes = readFileSync(join(process.cwd(), "public", "wordmark.png"));
  return `data:image/png;base64,${bytes.toString("base64")}`;
}

export default function Image() {
  const wordmark = wordmarkDataUri();

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
        {/* eslint-disable-next-line @next/next/no-img-element -- satori requires a plain <img>, not next/image */}
        <img src={wordmark} width={399} height={94} alt="" />
        <div style={{ display: "flex", marginTop: 32, fontSize: 34, color: "#f3f4f5", maxWidth: 980, lineHeight: 1.3 }}>
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
