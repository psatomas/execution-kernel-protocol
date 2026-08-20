"use client";

import { useQuery } from "@tanstack/react-query";
import type { ExecutionKernelClient } from "@execution-kernel-protocol/sdk";
import type { Bytes32 } from "@execution-kernel-protocol/types";

/** Every module registered for one intent type, with its on-chain identity. */
export function useModules(kernel: ExecutionKernelClient | undefined, intentType: Bytes32 | undefined) {
  return useQuery({
    queryKey: ["modules", intentType],
    queryFn: async () => {
      const addresses = await kernel!.moduleRegistry.getModules(intentType!);
      return Promise.all(addresses.map((a) => kernel!.module.getModuleInfo(a)));
    },
    enabled: !!kernel && !!intentType,
  });
}
