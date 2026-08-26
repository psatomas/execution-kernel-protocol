import type { ReactNode } from "react";

const toneClasses = {
  accent: "border-accent-soft-border bg-accent-soft text-accent",
  ready: "border-ready-soft-border bg-ready-soft text-ready",
  neutral: "border-border-strong bg-surface-2 text-muted",
} as const;

export function Pill({ tone = "neutral", children }: { tone?: keyof typeof toneClasses; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[0.7rem] font-medium uppercase tracking-wide ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
