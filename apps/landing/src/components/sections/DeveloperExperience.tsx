import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CTALink } from "@/components/ui/CTALink";
import { DOCS_URL } from "@/lib/links";

const LAYERS = [
  { name: "Solidity", desc: "The on-chain execution kernel — engine, registries, scoring policy, modules." },
  { name: "TypeScript", desc: "Shared, zero-runtime-dependency types mirroring every on-chain shape." },
  { name: "viem", desc: "The typed Ethereum client every off-chain layer is built on." },
  { name: "SDK", desc: "A typed client bundling every contract — the primary integration surface." },
  { name: "API", desc: "Read-only registry state, gas-free predictions, and execution metrics." },
  { name: "Indexer", desc: "Observes kernel events and derives execution/selection metrics." },
  { name: "Frontend", desc: "The reference protocol console — an interactive view into a live kernel." },
];

export function DeveloperExperience() {
  return (
    <section id="developer-experience" className="border-b border-border py-20 sm:py-28">
      <Container className="flex flex-col gap-14">
        <SectionHeading
          eyebrow="Developer experience"
          title="Integrate through the SDK. The kernel stays on-chain."
          lede="Every off-chain layer is a typed, composable piece — nothing about integration requires reimplementing kernel logic in application code."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LAYERS.map((layer) => (
            <div key={layer.name} className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4">
              <span className="font-mono text-sm text-accent">{layer.name}</span>
              <p className="text-sm leading-relaxed text-muted">{layer.desc}</p>
            </div>
          ))}
        </div>

        <div>
          <CTALink href={DOCS_URL} variant="secondary" external>
            Explore the architecture
          </CTALink>
        </div>
      </Container>
    </section>
  );
}
