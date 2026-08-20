/**
 * Status marker used everywhere the protocol's state needs to read at a
 * glance: intent active/inactive, execution phase, winner vs. candidate.
 * Semantic tones (success/warning/danger) are visually distinct from the
 * accent tone used for "this is selected/primary", so a highlighted row
 * never gets confused with a completed one.
 */
type Tone = "neutral" | "accent" | "success" | "warning" | "danger";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-surface-2 text-muted border-border",
  accent: "bg-accent-soft text-accent border-accent-soft-border",
  success: "bg-success-soft text-success border-success/20",
  warning: "bg-warning-soft text-warning border-warning/20",
  danger: "bg-danger-soft text-danger border-danger/20",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium leading-5 ${TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  );
}

/** A small solid dot, for state where a full pill would be too heavy (e.g. inline in a table row). */
export function Dot({ tone = "neutral" }: { tone?: Tone }) {
  const dotColor: Record<Tone, string> = {
    neutral: "bg-faint",
    accent: "bg-accent",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
  };
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${dotColor[tone]}`} />;
}
