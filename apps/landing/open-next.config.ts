import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Deliberately minimal: no incrementalCache override (that's for ISR/
// revalidating pages, backed by an R2 bucket or KV namespace -- neither
// exists for this deployment because nothing on this site revalidates).
// Add one only if a route here ever actually needs ISR.
export default defineCloudflareConfig();
