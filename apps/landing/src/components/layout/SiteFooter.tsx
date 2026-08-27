import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { GITHUB_URL, CONSOLE_URL, DOCS_URL } from "@/lib/links";
import { BASE_PATH } from "@/lib/basePath";

export function SiteFooter() {
  return (
    <footer className="border-t border-border py-12">
      <Container className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col items-start gap-2">
          {/* next/image `src` is NOT auto-prefixed by basePath (unlike
              next/link) -- see src/lib/basePath.ts. */}
          <Image src={`${BASE_PATH}/wordmark.png`} alt="ExeKPro" width={399} height={94} className="h-[22px] w-auto" />
          <span className="font-mono text-xs uppercase tracking-[0.1em] text-faint">Execution Kernel Protocol</span>
          <p className="max-w-sm pt-1 text-sm text-muted">Execution infrastructure for intent-driven applications.</p>
        </div>

        <nav aria-label="Footer" className="flex gap-8">
          <a href={GITHUB_URL} target="_blank" rel="noreferrer noopener" className="text-sm text-muted transition-colors hover:text-ink">
            GitHub
          </a>
          <a href={DOCS_URL} target="_blank" rel="noreferrer noopener" className="text-sm text-muted transition-colors hover:text-ink">
            Documentation
          </a>
          <a href={CONSOLE_URL} target="_blank" rel="noreferrer noopener" className="text-sm text-muted transition-colors hover:text-ink">
            Protocol Console
          </a>
        </nav>
      </Container>
    </footer>
  );
}
