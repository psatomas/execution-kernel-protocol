import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

// Lets `next dev` resolve Cloudflare bindings the same way the deployed
// Worker would (none are actually used by this app today -- see
// wrangler.jsonc -- but this is the documented, harmless-if-unused setup
// step for any app using @opennextjs/cloudflare).
initOpenNextCloudflareForDev();
