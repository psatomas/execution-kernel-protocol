import { ImageResponse } from "next/og";
import { WORDMARK_PNG_BASE64 } from "./wordmark-base64";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The real wordmark asset (see public/wordmark.png), embedded as a
// build-time base64 literal (wordmark-base64.ts) rather than read via
// fs.readFileSync at request time -- that works on Node/Vercel, but not
// on Cloudflare Workers (confirmed with a real `wrangler dev` run: the
// OpenNext bundle doesn't carry public/ into the deployed worker's
// filesystem the way a Node server does, so the read fails with ENOENT
// at runtime there). A plain string constant works identically on every
// host.
const wordmark = `data:image/png;base64,${WORDMARK_PNG_BASE64}`;

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
