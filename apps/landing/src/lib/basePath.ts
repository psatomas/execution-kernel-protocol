// This app is mounted at https://exekpro.com/about (see CLAUDE.md's URL
// architecture: apps/frontend owns "/", apps/landing owns "/about").
// `basePath` in next.config.ts auto-prefixes next/link, next/router, and
// Next's own file-convention routes (icons, opengraph-image) -- but it
// does NOT auto-prefix next/image `src` values or other hand-written
// absolute paths (hardcoded hrefs, CSS url(), etc). Those must import
// this constant explicitly. Kept as one shared value so next.config.ts
// and application code can't drift out of sync.
export const BASE_PATH = "/about";
