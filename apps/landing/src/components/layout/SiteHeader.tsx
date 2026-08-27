import Link from "next/link";
import Image from "next/image";
import { GITHUB_URL } from "@/lib/links";

const NAV_LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#modular-execution", label: "Modules" },
  { href: "#deployments", label: "Deployments" },
  { href: "#validation", label: "Validation" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4 sm:px-8">
        <Link href="#top" className="flex shrink-0 items-center gap-2.5">
          {/* The mark alone here, not the full wordmark image: its fine
              rune-style linework only reads clearly at real size (see it
              full-size in the hero below) -- shrunk to navbar height it
              blurs into a smudge. The bold mark holds up fine this small,
              paired with real, legible text for "EXEKPRO". */}
          <Image src="/icon.png" alt="" aria-hidden="true" width={30} height={30} priority />
          <span className="font-mono text-lg font-semibold tracking-[0.06em] text-accent">EXEKPRO</span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-muted transition-colors hover:text-ink">
              {link.label}
            </Link>
          ))}
        </nav>

        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-2 rounded-md border border-border-strong px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent"
        >
          GitHub
        </a>
      </div>
    </header>
  );
}
