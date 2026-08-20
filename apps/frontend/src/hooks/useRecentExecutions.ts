"use client";

import { useQuery } from "@tanstack/react-query";
import type { Address, Hex } from "viem";
import type { Bytes32 } from "@execution-kernel-protocol/types";
import { LOCAL_API_URL } from "@execution-kernel-protocol/config";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? LOCAL_API_URL;

export interface ExecutionRecord {
  blockNumber: string;
  transactionHash: Hex;
  user: Address;
  intentType: Bytes32;
  selectedModule: Address;
  result: Hex;
}

/** Real per-transaction history, via apps/api -> apps/indexer -- not fabricated, and not derived client-side from raw logs. */
export function useRecentExecutions(intentType: Bytes32 | undefined, limit = 10) {
  return useQuery({
    queryKey: ["recent-executions", intentType, limit],
    queryFn: async (): Promise<ExecutionRecord[]> => {
      const res = await fetch(`${API_URL}/executions?intentType=${intentType}&limit=${limit}`);
      if (!res.ok) {
        throw new Error(`executions request failed: HTTP ${res.status}`);
      }
      const json = await res.json();
      return json.executions;
    },
    enabled: !!intentType,
  });
}
