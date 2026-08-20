"use client";

import { useMemo } from "react";
import { usePublicClient, useWalletClient } from "wagmi";
import type { ExecutionKernelClient } from "@execution-kernel-protocol/sdk";
import { buildKernelClient } from "@/services/kernelClient";

/**
 * Bridges wagmi's connected clients into the sdk's ExecutionKernelClient.
 * undefined until a publicClient is available (briefly, on first mount);
 * walletClient is undefined whenever no wallet is connected, giving a
 * read-only client automatically -- write calls simply aren't offered by
 * the UI until a wallet connects.
 */
export function useKernelClient(): ExecutionKernelClient | undefined {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  return useMemo(() => {
    if (!publicClient) return undefined;
    return buildKernelClient(publicClient, walletClient ?? undefined);
  }, [publicClient, walletClient]);
}
