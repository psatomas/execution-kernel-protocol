"use client";

import { useMemo } from "react";
import { usePublicClient, useWalletClient, useChainId } from "wagmi";
import type { ExecutionKernelClient } from "@execution-kernel-protocol/sdk";
import { deploymentsByChainId } from "@execution-kernel-protocol/config";
import { buildKernelClient } from "@/services/kernelClient";

/**
 * Bridges wagmi's connected clients into the sdk's ExecutionKernelClient.
 * undefined until a publicClient is available (briefly, on first mount);
 * walletClient is undefined whenever no wallet is connected, giving a
 * read-only client automatically -- write calls simply aren't offered by
 * the UI until a wallet connects.
 *
 * Resolves which kernel deployment's addresses to use from the wallet's
 * connected chain id, via packages/config's deploymentsByChainId -- not
 * always localAnvilAddresses regardless of chain, which would silently
 * read/write the wrong deployment's addresses on any other connected chain.
 * Returns undefined (rather than falling back to a default) when the
 * connected chain has no known kernel deployment -- an honest "unsupported
 * network" rather than a misleading read against addresses that don't
 * exist there.
 */
export function useKernelClient(): ExecutionKernelClient | undefined {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();

  return useMemo(() => {
    if (!publicClient) return undefined;

    const deployment = deploymentsByChainId[chainId];
    if (!deployment) return undefined;

    return buildKernelClient(publicClient, walletClient ?? undefined, deployment.addresses);
  }, [publicClient, walletClient, chainId]);
}
