"use client";

import type { Bytes32 } from "@execution-kernel-protocol/types";
import { useRecentExecutions } from "@/hooks/useRecentExecutions";
import { Panel, PanelRow } from "@/components/ui/Panel";

function truncate(hex: string) {
  return `${hex.slice(0, 8)}...${hex.slice(-6)}`;
}

/**
 * Real transaction history via apps/api -> apps/indexer. Deliberately
 * doesn't show per-row candidate scores: the indexer never persisted the
 * losing candidates' quotes at execution time, only the winner -- showing
 * fabricated historical scores would violate this app's data-integrity
 * rule. The full scoring detail is only ever shown for the execution
 * currently in progress (see ExecutionConsole), which this app computed
 * itself moments ago.
 */
export function RecentExecutions({ intentType }: { intentType: Bytes32 | undefined }) {
  const query = useRecentExecutions(intentType);

  return (
    <Panel title="Recent executions" eyebrow="Indexer history">
      {!intentType && <p className="text-sm text-muted">Select an intent to view its history.</p>}
      {query.isLoading && <p className="text-sm text-muted">Loading...</p>}
      {query.isError && <p className="text-sm text-danger">{(query.error as Error).message}</p>}
      {query.data?.length === 0 && <p className="text-sm text-muted">No executions recorded yet.</p>}
      <div className="flex flex-col">
        {query.data?.map((record) => (
          <PanelRow key={record.transactionHash} className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-ink">{truncate(record.transactionHash)}</span>
              <span className="font-mono text-xs tabular-nums text-faint">block {record.blockNumber}</span>
            </div>
            <span className="font-mono text-xs text-muted">selected {truncate(record.selectedModule)}</span>
          </PanelRow>
        ))}
      </div>
    </Panel>
  );
}
