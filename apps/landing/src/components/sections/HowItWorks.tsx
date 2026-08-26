import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

const STEPS = [
  {
    n: "01",
    title: "Intent",
    body: "An application expresses what it wants to accomplish — an intent type and its parameters, not a specific execution path.",
  },
  {
    n: "02",
    title: "Discover",
    body: "The kernel retrieves every execution module currently registered as compatible with that intent type.",
  },
  {
    n: "03",
    title: "Simulate",
    body: "Each compatible module runs a simulation and produces an ExecutionQuote — a standardized, comparable description of what it would do.",
  },
  {
    n: "04",
    title: "Score",
    body: "ScorePolicy evaluates every quote against configured execution criteria and produces a ranked, signed score for each candidate.",
  },
  {
    n: "05",
    title: "Execute",
    body: "The highest-scoring compatible module executes the intent — signed by the end user's own wallet, not the kernel or its operator.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-b border-border py-20 sm:py-28">
      <Container className="flex flex-col gap-14">
        <SectionHeading
          eyebrow="How it works"
          title="One execution round, evaluated explicitly."
          lede="Every intent goes through the same five steps — no hidden routing, no implicit preference for one module over another."
        />

        <ol className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((step) => (
            <li key={step.n} className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
              <span className="font-mono text-sm text-accent">{step.n}</span>
              <h3 className="text-base font-semibold text-ink">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
