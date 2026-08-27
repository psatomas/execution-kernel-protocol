import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  // Mounted at the root of exekpro.com (see repo root CLAUDE.md's URL
  // architecture) -- no basePath needed here, unlike apps/landing.
  /* config options here */
};

export default nextConfig;

// Lets `next dev` resolve Cloudflare bindings the same way the deployed
// Worker would (none are actually used by this app today -- see
// wrangler.jsonc -- but this is the documented, harmless-if-unused setup
// step for any app using @opennextjs/cloudflare).
initOpenNextCloudflareForDev();
