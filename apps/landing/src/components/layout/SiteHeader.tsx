import Link from "next/link";
import Image from "next/image";
import { CTALink } from "@/components/ui/CTALink";
import { GITHUB_URL, CONSOLE_URL } from "@/lib/links";
import { BASE_PATH } from "@/lib/basePath";

const NAV_LINKS = [
  { href: "#how-it-works", label: "Protocol" },
  { href: "#modular-execution", label: "Architecture" },
  { href: "#developer-experience", label: "Developers" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4 sm:px-8">
        <Link href="#top" className="flex shrink-0 items-center">
          {/* The wordmark's own "O" is the brand mark -- one combined image,
              not mark + separate text (that would show the mark twice).
              next/image `src` is NOT auto-prefixed by basePath (unlike
              next/link) -- see src/lib/basePath.ts. */}
          <Image src={`${BASE_PATH}/wordmark.png`} alt="ExeKPro" width={399} height={94} priority className="h-[26px] w-auto" />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-muted transition-colors hover:text-ink">
              {link.label}
            </Link>
          ))}
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="text-sm text-muted transition-colors hover:text-ink"
          >
            GitHub
          </a>
        </nav>

        {/* The primary product CTA -- leads to the real protocol console
            (apps/frontend), never a fabricated demo. Deliberately the one
            filled/prominent button in the header; everything else here is
            plain text. See lib/links.ts for what CONSOLE_URL points at
            today (source, since no public console deployment exists yet)
            versus once a real deployment exists. */}
        <CTALink href={CONSOLE_URL} variant="primary" external>
          Launch Console
        </CTALink>
      </div>
    </header>
  );
}
