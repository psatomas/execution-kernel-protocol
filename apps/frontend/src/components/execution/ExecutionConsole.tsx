"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAccount, usePublicClient } from "wagmi";
import type { Bytes32, ExecutionModuleInfo } from "@execution-kernel-protocol/types";
import { useKernelClient } from "@/hooks/useKernelClient";
import { useIntents } from "@/hooks/useIntents";
import { useModules } from "@/hooks/useModules";
import { usePrediction } from "@/hooks/usePrediction";
import { useExecutionMetrics } from "@/hooks/useExecutionMetrics";
import { Panel, PanelRow } from "@/components/ui/Panel";
import { Badge } from "@/components/ui/Badge";
import { CandidateModuleRow } from "@/components/execution/CandidateModuleRow";
import { OverviewStats } from "@/components/protocol/OverviewStats";
import { RecentExecutions } from "@/components/metrics/RecentExecutions";

type ExecutePhase = "idle" | "submitting" | "confirming" | "confirmed" | "failed";

export function ExecutionConsole() {
  const kernel = useKernelClient();
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();
  const { address } = useAccount();
  const [selected, setSelected] = useState<Bytes32>();

  const intentsQuery = useIntents(kernel);
  const modulesQuery = useModules(kernel, selected);
  const predictionQuery = usePrediction(kernel, selected, address);
  const metricsQuery = useExecutionMetrics(selected);

  const moduleInfoByAddress = useMemo(() => {
    const map = new Map<string, ExecutionModuleInfo>();
    for (const m of modulesQuery.data ?? []) map.set(m.address.toLowerCase(), m);
    return map;
  }, [modulesQuery.data]);

  const [phase, setPhase] = useState<ExecutePhase>("idle");
  const [txHash, setTxHash] = useState<`0x${string}`>();
  const [blockNumber, setBlockNumber] = useState<bigint>();
  const [gasUsed, setGasUsed] = useState<bigint>();
  const [executionError, setExecutionError] = useState<string>();

  async function handleExecute() {
    if (!kernel || !selected || !address) return;

    setPhase("submitting");
    setExecutionError(undefined);
    setTxHash(undefined);
    setBlockNumber(undefined);
    setGasUsed(undefined);

    try {
      const { hash } = await kernel.execution.executeIntent({ intentType: selected, intentData: "0x" }, address);
      setTxHash(hash);
      setPhase("confirming");

      // "transaction confirmed" as a real checked step, not assumed from
      // anvil's auto-mine timing -- same reasoning as full-flow.spec.ts.
      const receipt = await publicClient?.waitForTransactionReceipt({ hash });
      if (!receipt || receipt.status !== "success") {
        setPhase("failed");
        setExecutionError("Transaction reverted");
        return;
      }

      setBlockNumber(receipt.blockNumber);
      setGasUsed(receipt.gasUsed);
      setPhase("confirmed");

      // chain event -> indexer -> api -> here.
      predictionQuery.refetch();
      metricsQuery.refetch();
      queryClient.invalidateQueries({ queryKey: ["recent-executions"] });
    } catch (err) {
      setPhase("failed");
      setExecutionError((err as Error).message);
    }
  }

  if (!kernel) {
    return <p className="p-6 text-sm text-muted">Connecting to chain...</p>;
  }

  const winnerAddress = predictionQuery.data?.winner.module.toLowerCase();

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex flex-col gap-6">
        <Panel title="Intent" eyebrow="Step 1 -- construct">
          {intentsQuery.isLoading && <p className="text-sm text-muted">Loading registered intents...</p>}
          {intentsQuery.data?.length === 0 && (
            <p className="text-sm text-muted">No intents registered yet.</p>
          )}
          <div className="flex flex-col gap-2">
            {intentsQuery.data?.map((intent) => (
              <button
                key={intent.intentType}
                onClick={() => setSelected(intent.intentType)}
                className={`flex w-full items-center justify-between gap-3 rounded-md border px-3 py-2.5 text-left transition-colors ${
                  selected === intent.intentType
                    ? "border-accent-soft-border bg-accent-soft"
                    : "border-border bg-surface hover:border-faint"
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-ink">{intent.name}</span>
                  <span className="font-mono text-xs text-faint">{intent.intentType}</span>
                </div>
                <Badge tone={intent.active ? "success" : "neutral"}>{intent.active ? "active" : "inactive"}</Badge>
              </button>
            ))}
          </div>
        </Panel>

        {selected && (
          <Panel title="Candidate modules" eyebrow="Step 2 -- simulate & score">
            {predictionQuery.isLoading && <p className="text-sm text-muted">Simulating candidates...</p>}
            {predictionQuery.isError && (
              <p className="text-sm text-danger">{(predictionQuery.error as Error).message}</p>
            )}
            {!address && !predictionQuery.data && (
              <p className="text-sm text-muted">Connect a wallet to simulate execution.</p>
            )}
            <div className="flex flex-col gap-2">
              {predictionQuery.data?.candidates.map((candidate) => (
                <CandidateModuleRow
                  key={candidate.module}
                  candidate={candidate}
                  moduleInfo={moduleInfoByAddress.get(candidate.module.toLowerCase())}
                  isWinner={candidate.module.toLowerCase() === winnerAddress}
                />
              ))}
            </div>
          </Panel>
        )}

        {selected && (
          <Panel title="Execute" eyebrow="Step 3 -- submit via wallet">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleExecute}
                  disabled={!address || phase === "submitting" || phase === "confirming"}
                  className="w-fit rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-ink transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {phase === "submitting"
                    ? "Awaiting wallet confirmation..."
                    : phase === "confirming"
                      ? "Confirming transaction..."
                      : "Execute intent"}
                </button>
                {phase === "confirmed" && <Badge tone="success">Confirmed</Badge>}
                {phase === "failed" && <Badge tone="danger">Failed</Badge>}
                {(phase === "submitting" || phase === "confirming") && <Badge tone="warning">Pending</Badge>}
              </div>

              {txHash && (
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 font-mono text-xs">
                  <dt className="text-faint">tx</dt>
                  <dd className="text-ink" data-testid="tx-hash">
                    tx: {txHash}
                  </dd>
                  {blockNumber !== undefined && (
                    <>
                      <dt className="text-faint">block</dt>
                      <dd className="text-ink tabular-nums">{blockNumber.toString()}</dd>
                    </>
                  )}
                  {gasUsed !== undefined && (
                    <>
                      <dt className="text-faint">gas used</dt>
                      <dd className="text-ink tabular-nums">{gasUsed.toString()}</dd>
                    </>
                  )}
                </dl>
              )}
              {executionError && <p className="text-sm text-danger">{executionError}</p>}
            </div>
          </Panel>
        )}

        {selected && (
          <Panel title="Protocol metrics" eyebrow="Step 4 -- indexer -> api -> here">
            <p className="mb-3 text-xs text-faint">
              Not read from the chain directly -- chain event -&gt; indexer -&gt; api -&gt; here.
            </p>
            {metricsQuery.isLoading && <p className="text-sm text-muted">Loading...</p>}
            {metricsQuery.isError && <p className="text-sm text-danger">{(metricsQuery.error as Error).message}</p>}
            {metricsQuery.data && (
              <>
                <PanelRow>
                  <span className="font-mono text-sm font-semibold tabular-nums text-ink">
                    Total executions: {metricsQuery.data.totalExecutions}
                  </span>
                </PanelRow>
                {Object.entries(metricsQuery.data.executionsByModule).map(([module, count]) => (
                  <PanelRow key={module} className="flex items-center justify-between">
                    <span className="font-mono text-xs text-faint">{module}</span>
                    <span className="font-mono text-sm tabular-nums text-ink">{count}</span>
                  </PanelRow>
                ))}
              </>
            )}
          </Panel>
        )}
      </div>

      <aside className="flex flex-col gap-6">
        <OverviewStats intents={intentsQuery.data} selectedModules={modulesQuery.data} metrics={metricsQuery.data} />
        <RecentExecutions intentType={selected} />
      </aside>
    </div>
  );
}
