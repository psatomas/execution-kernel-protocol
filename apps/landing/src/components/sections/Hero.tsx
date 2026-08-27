import { Container } from "@/components/ui/Container";
import { CTALink } from "@/components/ui/CTALink";
import { FlowDiagram } from "@/components/ui/FlowDiagram";
import { GITHUB_URL, CONSOLE_URL } from "@/lib/links";

export function Hero() {
  return (
    <section id="top" className="border-b border-border pb-16 pt-20 sm:pt-28">
      <Container className="flex flex-col gap-10">
        <div className="flex flex-col gap-6">
          <span className="font-mono text-xs uppercase tracking-[0.14em] text-accent">ExeKPro — Execution Kernel Protocol</span>
          <h1 className="text-balance text-4xl font-semibold leading-[1.08] text-ink sm:text-5xl lg:text-6xl">
            Execution infrastructure for intent-driven applications.
          </h1>
          <p className="text-balance max-w-2xl text-lg leading-relaxed text-muted">
            ExeKPro is a modular execution kernel: applications express an intent, compatible
            execution modules are simulated and scored against an explicit policy, and the
            best-compatible module executes — through the end user&rsquo;s own wallet, not ours.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <CTALink href={CONSOLE_URL} variant="primary" external>
              Launch Console
            </CTALink>
            <CTALink href={GITHUB_URL} variant="secondary" external>
              View on GitHub
            </CTALink>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5 sm:p-6">
          <FlowDiagram
            steps={[
              { label: "Intent", sublabel: "what to accomplish" },
              { label: "Candidates", sublabel: "compatible modules" },
              { label: "Simulate", sublabel: "execution quote" },
              { label: "Score", sublabel: "policy-evaluated" },
              { label: "Execute", sublabel: "user-signed" },
            ]}
          />
        </div>
      </Container>
    </section>
  );
}
