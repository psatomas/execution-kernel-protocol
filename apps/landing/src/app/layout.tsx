import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { BASE_PATH } from "@/lib/basePath";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// The origin, used only to resolve Next's own file-convention metadata
// routes (icon.png, opengraph-image.tsx) -- basePath is applied to those
// automatically since they're real routes. It is NOT applied to the
// hand-written `canonical`/`openGraph.url` strings below, so those spell
// out "/about" (this app's mount point, see src/lib/basePath.ts) explicitly.
const ORIGIN = "https://exekpro.com";
const PAGE_URL = `${ORIGIN}${BASE_PATH}`;
const TITLE = "ExeKPro — Execution infrastructure for intent-driven applications";
const DESCRIPTION =
  "ExeKPro (Execution Kernel Protocol) is a modular execution kernel: applications express an intent, compatible modules are simulated and scored against an explicit policy, and the best-compatible one executes through the user's own wallet.";

export const metadata: Metadata = {
  metadataBase: new URL(ORIGIN),
  title: { default: TITLE, template: "%s — ExeKPro" },
  description: DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: "website",
    url: PAGE_URL,
    siteName: "ExeKPro",
    title: TITLE,
    description: DESCRIPTION,
    // Served by app/opengraph-image-asset/route.tsx -- a plain route, not
    // Next's `opengraph-image` file-convention (which auto-injects this
    // meta tag but, confirmed by building this app with basePath set,
    // does NOT apply basePath to the URL it generates). Spelled out
    // explicitly here instead so it actually resolves under "/about".
    images: [{ url: `${PAGE_URL}/opengraph-image-asset`, width: 1200, height: 630, type: "image/png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [`${PAGE_URL}/opengraph-image-asset`],
  },
};

export const viewport: Viewport = {
  themeColor: "#08090a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-bg text-ink">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
