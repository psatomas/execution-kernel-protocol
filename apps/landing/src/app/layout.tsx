import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://exekpro.com";
const TITLE = "ExekPro — Execution infrastructure for intent-driven applications";
const DESCRIPTION =
  "ExekPro (Execution Kernel Protocol) is a modular execution kernel: applications express an intent, compatible modules are simulated and scored against an explicit policy, and the best-compatible one executes through the user's own wallet.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "%s — ExekPro" },
  description: DESCRIPTION,
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "ExekPro",
    title: TITLE,
    description: DESCRIPTION,
    // Image itself comes from app/opengraph-image.tsx (Next's file
    // convention) -- it's auto-detected and injected, no `images` entry
    // needed here.
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
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
