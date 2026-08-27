import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

const REASONS = [
  "Execution strategies evolve — a routing path or protection scheme that's optimal today rarely stays optimal indefinitely.",
  "Different environments produce different optimal paths — there is rarely one execution strategy that's best everywhere, always.",
  "Applications shouldn't need to rewrite their core execution logic every time a better strategy becomes available.",
  "Execution should be modular and observable, not a black box buried in application code.",
];

export function Problem() {
  return (
    <section className="border-b border-border py-20 sm:py-28">
      <Container className="flex flex-col gap-14">
        <SectionHeading
          eyebrow="The problem"
          title="Hard-coded execution strategies don't age well."
          lede="Most applications pick one execution path at build time and live with it. ExeKPro lets that decision happen at execution time instead, against real, comparable data."
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6">
            <span className="font-mono text-xs uppercase tracking-wide text-faint">Traditional application</span>
            <ol className="flex flex-col gap-3">
              {["Intent", "One predefined strategy", "Execution"].map((step, i, arr) => (
                <li key={step} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full border border-border-strong font-mono text-xs text-muted">
                    {i + 1}
                  </span>
                  <span className="text-sm text-muted">{step}</span>
                  {i < arr.length - 1 && <span className="sr-only">, leads to</span>}
                </li>
              ))}
            </ol>
          </div>

          <div className="flex flex-col gap-4 rounded-xl border border-accent-soft-border bg-accent-soft p-6">
            <span className="font-mono text-xs uppercase tracking-wide text-accent">ExeKPro</span>
            <ol className="flex flex-col gap-3">
              {["Intent", "Multiple compatible strategies", "Simulation", "Policy-based scoring", "Selected execution"].map(
                (step, i) => (
                  <li key={step} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full border border-accent-soft-border bg-surface font-mono text-xs text-accent">
                      {i + 1}
                    </span>
                    <span className="text-sm text-ink">{step}</span>
                  </li>
                ),
              )}
            </ol>
          </div>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2">
          {REASONS.map((reason) => (
            <li key={reason} className="flex gap-3 rounded-lg border border-border bg-surface p-4 text-sm leading-relaxed text-muted">
              <span aria-hidden="true" className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-accent" />
              {reason}
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
