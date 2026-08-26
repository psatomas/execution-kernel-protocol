export function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-surface px-5 py-5">
      <span className="font-mono text-2xl font-semibold tabular-nums text-ink sm:text-3xl">{value}</span>
      <span className="text-sm text-muted">{label}</span>
    </div>
  );
}
