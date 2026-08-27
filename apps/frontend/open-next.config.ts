import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Deliberately minimal, mirroring apps/landing's config: no incrementalCache
// override (that's for ISR/revalidating pages, backed by an R2 bucket or KV
// namespace) -- the console's pages are all client-rendered against live
// chain/API state, nothing here revalidates. Add one only if a route here
// ever actually needs ISR.
export default defineCloudflareConfig();
