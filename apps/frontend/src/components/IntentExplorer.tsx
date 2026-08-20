"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import type { Bytes32 } from "@execution-kernel-protocol/types";
import { useKernelClient } from "@/hooks/useKernelClient";
import { useIntents } from "@/hooks/useIntents";
import { useModules } from "@/hooks/useModules";
import { usePrediction } from "@/hooks/usePrediction";

export function IntentExplorer() {
  const kernel = useKernelClient();
  const { address } = useAccount();
  const [selected, setSelected] = useState<Bytes32>();

  const intentsQuery = useIntents(kernel);
  const modulesQuery = useModules(kernel, selected);
  const predictionQuery = usePrediction(kernel, selected, address);

  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<string>();
  const [executionError, setExecutionError] = useState<string>();

  async function handleExecute() {
    if (!kernel || !selected || !address) return;

    setExecuting(true);
    setExecutionError(undefined);
    setExecutionResult(undefined);

    try {
      const { hash } = await kernel.execution.executeIntent(
        { intentType: selected, intentData: "0x" },
        address,
      );
      setExecutionResult(hash);
      predictionQuery.refetch();
    } catch (err) {
      setExecutionError((err as Error).message);
    } finally {
      setExecuting(false);
    }
  }

  if (!kernel) {
    return <p className="text-sm text-gray-500">Connecting to chain...</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Registered intents</h2>
        {intentsQuery.isLoading && <p className="text-sm text-gray-500">Loading...</p>}
        {intentsQuery.data?.length === 0 && (
          <p className="text-sm text-gray-500">No intents registered yet.</p>
        )}
        <ul className="flex flex-col gap-2">
          {intentsQuery.data?.map((intent) => (
            <li key={intent.intentType}>
              <button
                onClick={() => setSelected(intent.intentType)}
                className={`w-full rounded border px-3 py-2 text-left ${
                  selected === intent.intentType ? "border-black" : "border-gray-300"
                }`}
              >
                <div className="font-medium">{intent.name}</div>
                <div className="font-mono text-xs text-gray-500">{intent.intentType}</div>
                <div className="text-xs">{intent.active ? "active" : "inactive"}</div>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {selected && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Registered modules</h2>
          {modulesQuery.isLoading && <p className="text-sm text-gray-500">Loading...</p>}
          <ul className="flex flex-col gap-2">
            {modulesQuery.data?.map((module) => (
              <li key={module.address} className="rounded border border-gray-200 px-3 py-2">
                <div className="font-medium">{module.name}</div>
                <div className="font-mono text-xs text-gray-500">{module.address}</div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {selected && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Prediction (off-chain, no gas)</h2>
          {!address && (
            <p className="text-sm text-gray-500">Connect a wallet to preview a prediction.</p>
          )}
          {predictionQuery.isLoading && <p className="text-sm text-gray-500">Predicting...</p>}
          {predictionQuery.isError && (
            <p className="text-sm text-red-700">{(predictionQuery.error as Error).message}</p>
          )}
          {predictionQuery.data && (
            <div className="rounded border border-gray-200 px-3 py-2">
              <div className="font-medium">Predicted winner: {predictionQuery.data.winner.quote?.tag}</div>
              <div className="font-mono text-xs text-gray-500">{predictionQuery.data.winner.module}</div>
              <div className="text-xs">score: {predictionQuery.data.winner.score?.toString()}</div>
            </div>
          )}
        </section>
      )}

      {selected && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Execute</h2>
          <button
            onClick={handleExecute}
            disabled={!address || executing}
            className="w-fit rounded bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {executing ? "Submitting..." : "Execute intent"}
          </button>
          {executionResult && (
            <p className="font-mono text-sm text-green-700">tx: {executionResult}</p>
          )}
          {executionError && <p className="text-sm text-red-700">{executionError}</p>}
        </section>
      )}
    </div>
  );
}
