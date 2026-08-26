import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StatTile } from "@/components/ui/StatTile";

const STATS = [
  { value: "43/43", label: "Contract tests passing" },
  { value: "7/7", label: "TypeScript packages typecheck clean" },
  { value: "1–100", label: "Candidate modules tested in competition" },
  { value: "3", label: "Real bugs found and fixed through adversarial testing" },
  { value: "Full E2E", label: "Real browser, real local blockchain deployment" },
];

export function Validation() {
  return (
    <section id="validation" className="border-b border-border py-20 sm:py-28">
      <Container className="flex flex-col gap-14">
        <SectionHeading
          eyebrow="Validation"
          title="Engineering evidence, not marketing claims."
          lede="This is a serious engineering prototype approaching testnet validation — exercised against real deployed bytecode and real transactions, not mocked interfaces. It is not a production deployment, and it has no mainnet presence."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {STATS.map((stat) => (
            <StatTile key={stat.label} value={stat.value} label={stat.label} />
          ))}
        </div>

        <p className="max-w-2xl text-sm leading-relaxed text-muted">
          &ldquo;1–100&rdquo; describes the range of candidate module counts exercised in testing —
          not a claim that 100 production modules are currently deployed or registered anywhere.
        </p>
      </Container>
    </section>
  );
}
