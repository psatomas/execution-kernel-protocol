import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Pill } from "@/components/ui/Pill";

const CURRENT = [
  "Local deployment fully validated",
  "Sepolia configuration ready",
  "Deployment scripts ready",
  "B2B provisioning implemented",
];

const NEXT = ["Sepolia deployment", "Developer testing", "Integration feedback", "Market validation"];

export function RoadmapStatus() {
  return (
    <section className="border-b border-border py-20 sm:py-28">
      <Container className="flex flex-col gap-14">
        <SectionHeading
          eyebrow="Status"
          title="What's implemented, and what's next."
          lede="No fixed dates — this distinguishes what's been built and verified from what's planned, nothing more."
        />

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-4 rounded-xl border border-ready-soft-border bg-ready-soft p-6">
            <Pill tone="ready">Current</Pill>
            <ul className="flex flex-col gap-3">
              {CURRENT.map((item) => (
                <li key={item} className="flex gap-3 text-sm text-ink">
                  <span aria-hidden="true" className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-ready" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6">
            <Pill tone="neutral">Next</Pill>
            <ul className="flex flex-col gap-3">
              {NEXT.map((item) => (
                <li key={item} className="flex gap-3 text-sm text-muted">
                  <span aria-hidden="true" className="mt-1 h-1.5 w-1.5 flex-none rounded-full border border-border-strong" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
