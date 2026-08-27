import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { GITHUB_URL, CONSOLE_URL, DOCS_URL } from "@/lib/links";

export function SiteFooter() {
  return (
    <footer className="border-t border-border py-12">
      <Container className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <Image src="/icon.png" alt="" aria-hidden="true" width={26} height={26} />
            <span className="font-mono text-base font-semibold tracking-[0.06em] text-accent">EXEKPRO</span>
          </div>
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
