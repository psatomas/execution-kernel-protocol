import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

const CHAIN = ["Customer application", "Customer-owned kernel", "Execution modules", "Blockchain"];

export function B2BDeployments() {
  return (
    <section id="deployments" className="border-b border-border py-20 sm:py-28">
      <Container className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-center">
        <div className="flex flex-col gap-6">
          <SectionHeading
            eyebrow="B2B deployments"
            title="One kernel. One customer. One isolated deployment."
            lede="Each customer receives a dedicated kernel deployment, not a seat in a shared, multi-tenant one. This isn't a SaaS custody model — nothing is pooled or shared between customers."
          />
          <ul className="flex flex-col gap-3 text-sm leading-relaxed text-muted">
            <li className="flex gap-3">
              <span aria-hidden="true" className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-accent" />
              The customer owns the deployment, through ProtocolRoles — not ExeKPro.
            </li>
            <li className="flex gap-3">
              <span aria-hidden="true" className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-accent" />
              The customer&rsquo;s applications and tooling point at that specific deployment,
              and only that one.
            </li>
            <li className="flex gap-3">
              <span aria-hidden="true" className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-accent" />
              No shared tenant state: one deployment&rsquo;s registered intents and modules never
              interact with another&rsquo;s.
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-0 rounded-xl border border-border bg-surface p-6">
          {CHAIN.map((step, i) => (
            <div key={step} className="flex flex-col items-center">
              <div className="w-full rounded-lg border border-border-strong bg-surface-2 px-4 py-3 text-center font-mono text-sm text-ink">
                {step}
              </div>
              {i < CHAIN.length - 1 && (
                <span aria-hidden="true" className="py-2 text-faint">
                  ↓
                </span>
              )}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
