/**
 * A major page zone (execution console, overview, recent executions) --
 * there are a handful of these on the whole page, not one per data point.
 * Rows/fields *within* a panel are separated by hairline dividers, not by
 * nesting another Panel per row ("card spam").
 */
export function Panel({
  title,
  eyebrow,
  action,
  children,
}: {
  title: string;
  eyebrow?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-surface">
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          {eyebrow && (
            <div className="font-mono text-[0.68rem] uppercase tracking-wider text-faint">{eyebrow}</div>
          )}
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
        </div>
        {action}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

/** One row inside a Panel -- the hairline-divider alternative to nesting another card. */
export function PanelRow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`border-b border-border py-3 last:border-b-0 first:pt-0 last:pb-0 ${className}`}>{children}</div>;
}
