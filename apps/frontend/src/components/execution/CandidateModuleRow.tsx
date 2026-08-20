import type { ExecutionModuleInfo } from "@execution-kernel-protocol/types";
import { Badge } from "@/components/ui/Badge";

interface Candidate {
  module: `0x${string}`;
  supportsIntent: boolean;
  quote?: { tag: string; executionCost: bigint; executionQuality: bigint; mevRisk: bigint; latencyScore: bigint };
  score?: bigint;
}

/**
 * One candidate module's real standing in the current scoring round --
 * this is the row that makes module competition visible at all: previously
 * only the winner was ever rendered, so a viewer had no way to see that a
 * competition happened, just its outcome.
 */
export function CandidateModuleRow({
  candidate,
  moduleInfo,
  isWinner,
}: {
  candidate: Candidate;
  moduleInfo?: ExecutionModuleInfo;
  isWinner: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-md border px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between ${
        isWinner ? "border-accent-soft-border bg-accent-soft" : "border-border bg-surface"
      }`}
    >
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-ink">{moduleInfo?.name ?? "Unknown module"}</span>
          {isWinner && <Badge tone="accent">Selected</Badge>}
          {!candidate.supportsIntent && <Badge tone="neutral">Not eligible</Badge>}
        </div>
        <span className="font-mono text-xs text-faint">{candidate.module}</span>
      </div>

      {candidate.quote && candidate.score !== undefined && (
        <div className="flex items-center justify-between gap-4 sm:justify-end sm:text-right">
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-xs text-muted sm:grid-cols-4">
            <span title="execution quality">Q {candidate.quote.executionQuality.toString()}</span>
            <span title="execution cost">C {candidate.quote.executionCost.toString()}</span>
            <span title="MEV risk">M {candidate.quote.mevRisk.toString()}</span>
            <span title="latency score">L {candidate.quote.latencyScore.toString()}</span>
          </div>
          <div
            className={`font-mono text-base font-semibold tabular-nums ${isWinner ? "text-accent" : "text-ink"}`}
          >
            {candidate.score.toString()}
          </div>
        </div>
      )}
    </div>
  );
}
