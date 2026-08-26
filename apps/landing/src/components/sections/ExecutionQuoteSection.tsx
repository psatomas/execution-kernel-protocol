import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

const FIELDS = [
  { name: "executionCost", desc: "Cost efficiency of this execution path — lower is better." },
  { name: "executionQuality", desc: "Expected quality / success probability of the execution — higher is better." },
  { name: "mevRisk", desc: "Exposure to MEV extraction along this path — lower is better." },
  { name: "latencyScore", desc: "Time-to-finality characteristics of this path — lower is better." },
];

export function ExecutionQuoteSection() {
  return (
    <section className="border-b border-border py-20 sm:py-28">
      <Container className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
        <SectionHeading
          eyebrow="Common interface"
          title="ExecutionQuote is what every module speaks."
          lede={
            <>
              The kernel never needs to understand a module&rsquo;s internal implementation — routing
              logic, MEV protection, or a strategy not yet built. Every module exposes the same
              comparable characteristics through <code className="rounded bg-code-bg px-1.5 py-0.5 font-mono text-[0.85em] text-ink">ExecutionQuote</code>,
              and that&rsquo;s all ScorePolicy needs to rank them. These four fields are what the
              current kernel scores on — not a ceiling on what a quote could eventually describe.
            </>
          }
        />

        <div className="rounded-xl border border-border bg-surface p-6">
          <span className="font-mono text-xs uppercase tracking-wide text-faint">struct</span>
          <div className="mt-2 font-mono text-lg text-ink">ExecutionQuote</div>
          <dl className="mt-5 flex flex-col divide-y divide-border">
            {FIELDS.map((field) => (
              <div key={field.name} className="flex flex-col gap-1 py-3.5 first:pt-0 last:pb-0">
                <dt className="font-mono text-sm text-accent">{field.name}</dt>
                <dd className="text-sm leading-relaxed text-muted">{field.desc}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Container>
    </section>
  );
}
