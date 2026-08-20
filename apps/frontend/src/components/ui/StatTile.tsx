export function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-xs text-muted">{label}</div>
      <div className="font-mono text-xl font-semibold tabular-nums text-ink">{value}</div>
      {hint && <div className="text-xs text-faint">{hint}</div>}
    </div>
  );
}
