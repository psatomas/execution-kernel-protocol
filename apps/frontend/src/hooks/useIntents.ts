"use client";

import { useQuery } from "@tanstack/react-query";
import type { ExecutionKernelClient } from "@execution-kernel-protocol/sdk";

/** All registered intents, with their name/active/createdAt. */
export function useIntents(kernel: ExecutionKernelClient | undefined) {
  return useQuery({
    queryKey: ["intents", kernel?.intentRegistry.address],
    queryFn: async () => {
      const types = await kernel!.intentRegistry.getAllIntents();
      return Promise.all(types.map((t) => kernel!.intentRegistry.getIntent(t)));
    },
    enabled: !!kernel,
  });
}
