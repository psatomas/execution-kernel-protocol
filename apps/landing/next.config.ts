import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import { BASE_PATH } from "./src/lib/basePath";

const nextConfig: NextConfig = {
  // This app is the "/about" surface of exekpro.com -- apps/frontend owns
  // "/". See src/lib/basePath.ts for what still needs manual prefixing
  // that this option doesn't cover automatically (next/image src, etc).
  basePath: BASE_PATH,
};

export default nextConfig;

// Lets `next dev` resolve Cloudflare bindings the same way the deployed
// Worker would (none are actually used by this app today -- see
// wrangler.jsonc -- but this is the documented, harmless-if-unused setup
// step for any app using @opennextjs/cloudflare).
initOpenNextCloudflareForDev();
