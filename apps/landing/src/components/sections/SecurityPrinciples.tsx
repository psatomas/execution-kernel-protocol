import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

const PRINCIPLES = [
  {
    name: "Non-custodial",
    desc: "The end user's own wallet signs every execution. ExeKPro provides the execution infrastructure an application uses to evaluate and execute intents — it never holds a private key on anyone's behalf.",
  },
  {
    name: "Deterministic selection",
    desc: "Module selection follows an explicit, inspectable scoring policy — never a hidden or arbitrary preference for one execution path over another.",
  },
  {
    name: "Module isolation",
    desc: "A broken or reverting candidate module is skipped, not fatal — it cannot block execution for every other module registered on the same intent type.",
  },
  {
    name: "Customer isolation",
    desc: "Each customer's kernel is its own deployment, with its own owner and its own registries — no shared tenant state to leak across.",
  },
  {
    name: "Test-driven security",
    desc: "Adversarial and fuzz testing is how real issues have actually been found in this codebase — three, so far, all fixed before they mattered.",
  },
];

export function SecurityPrinciples() {
  return (
    <section className="border-b border-border py-20 sm:py-28">
      <Container className="flex flex-col gap-14">
        <SectionHeading
          eyebrow="Security principles"
          title="Custody and control stay with the customer and the user."
          lede="These aren't aspirational — each one maps to a specific, verifiable property of the current architecture."
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PRINCIPLES.map((p) => (
            <div key={p.name} className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-5">
              <h3 className="font-mono text-sm text-ink">{p.name}</h3>
              <p className="text-sm leading-relaxed text-muted">{p.desc}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
