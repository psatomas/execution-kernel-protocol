import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Pill } from "@/components/ui/Pill";

const MODULES = [
  {
    name: "RouterModule",
    desc: "A routing strategy — one compatible module competing for selection under the same scoring policy as any other.",
  },
  {
    name: "MevProtectionModule",
    desc: "Trades cost and latency for materially lower MEV exposure — registered for the same intent type, evaluated on the same terms.",
  },
];

export function ModularExecution() {
  return (
    <section id="modular-execution" className="border-b border-border py-20 sm:py-28">
      <Container className="flex flex-col gap-14">
        <SectionHeading
          eyebrow="Modular execution"
          title="Modules are independent execution strategies."
          lede="Each module implements the same interface and competes on the same terms. The kernel doesn't favor one implementation over another — ScorePolicy does, based on what each one actually quotes."
        />

        <div className="grid gap-6 sm:grid-cols-2">
          {MODULES.map((mod) => (
            <div key={mod.name} className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-6">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-base text-ink">{mod.name}</span>
                <Pill tone="ready">Live</Pill>
              </div>
              <p className="text-sm leading-relaxed text-muted">{mod.desc}</p>
            </div>
          ))}

          <div className="flex flex-col gap-3 rounded-xl border border-dashed border-border-strong p-6">
            <span className="font-mono text-base text-faint">Additional modules</span>
            <p className="text-sm leading-relaxed text-muted">
              The architecture allows further compatible modules to compete under the same
              execution framework. Module registration is currently owner-controlled per
              deployment — this is not yet an open, permissionless module ecosystem.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
