"use client";

import { useQuery } from "@tanstack/react-query";
import type { Bytes32 } from "@execution-kernel-protocol/types";
import { LOCAL_API_URL } from "@execution-kernel-protocol/config";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? LOCAL_API_URL;

export interface ExecutionMetrics {
  totalExecutions: number;
  executionsByModule: Record<string, number>;
}

/**
 * The one hook in this app that does NOT talk to the chain directly --
 * it calls apps/api's /metrics/executions, which itself wraps
 * apps/indexer. Completes the architecture's full loop: chain event ->
 * indexer backfill -> api -> frontend, rather than the frontend
 * re-deriving metrics itself from raw logs.
 */
export function useExecutionMetrics(intentType: Bytes32 | undefined) {
  return useQuery({
    queryKey: ["execution-metrics", intentType],
    queryFn: async (): Promise<ExecutionMetrics> => {
      const res = await fetch(`${API_URL}/metrics/executions?intentType=${intentType}`);
      if (!res.ok) {
        throw new Error(`metrics request failed: HTTP ${res.status}`);
      }
      return res.json();
    },
    enabled: !!intentType,
  });
}
