/**
 * Central place for every external/cross-app link this site points to --
 * so a URL only ever needs updating in one place, and so it's obvious which
 * links are real today versus placeholders for something not deployed yet.
 */

/** The actual public repository -- confirmed from the monorepo's own git remote. */
export const GITHUB_URL = "https://github.com/psatomas/execution-kernel-protocol";

/**
 * The protocol console (apps/frontend) has no public hosted deployment yet
 * -- it currently only runs against a local anvil chain (see that app's own
 * README/CLAUDE.md). This intentionally points at the console's source
 * rather than fabricating a live URL; update it to a real deployed console
 * URL once one exists.
 */
export const CONSOLE_URL = `${GITHUB_URL}/tree/main/apps/frontend`;

/** Points at the root README, which documents the architecture in full. */
export const DOCS_URL = `${GITHUB_URL}#readme`;
