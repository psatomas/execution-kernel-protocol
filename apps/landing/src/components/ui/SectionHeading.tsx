import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  lede,
  align = "left",
}: {
  eyebrow: string;
  title: ReactNode;
  lede?: ReactNode;
  align?: "left" | "center";
}) {
  return (
    <div className={`flex flex-col gap-3 ${align === "center" ? "items-center text-center" : "items-start"}`}>
      <span className="font-mono text-xs uppercase tracking-[0.14em] text-accent">{eyebrow}</span>
      <h2 className="text-balance text-2xl font-semibold leading-tight text-ink sm:text-3xl">{title}</h2>
      {lede && <p className={`text-balance text-base leading-relaxed text-muted ${align === "center" ? "max-w-2xl" : "max-w-xl"}`}>{lede}</p>}
    </div>
  );
}
