import { Container } from "@/components/ui/Container";
import { GITHUB_URL, CONSOLE_URL, DOCS_URL } from "@/lib/links";
import { Wordmark } from "./Wordmark";

export function SiteFooter() {
  return (
    <footer className="border-t border-border py-12">
      <Container className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <Wordmark className="text-base text-ink" />
          <p className="max-w-sm text-sm text-muted">Execution infrastructure for intent-driven applications.</p>
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
