import { Container } from "@/components/ui/Container";
import { CTALink } from "@/components/ui/CTALink";
import { GITHUB_URL, CONSOLE_URL } from "@/lib/links";

export function FinalCTA() {
  return (
    <section className="py-20 sm:py-28">
      <Container className="flex flex-col items-center gap-6 text-center">
        <h2 className="text-balance max-w-2xl text-3xl font-semibold leading-tight text-ink sm:text-4xl">
          Build on an execution kernel.
        </h2>
        <p className="max-w-xl text-balance text-base leading-relaxed text-muted">
          Explore the protocol, inspect the architecture, or deploy your own kernel.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <CTALink href={CONSOLE_URL} variant="primary" external>
            Launch Console
          </CTALink>
          <CTALink href={GITHUB_URL} variant="secondary" external>
            Explore GitHub
          </CTALink>
        </div>
      </Container>
    </section>
  );
}
