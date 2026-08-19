import type { Account, Address, Hash, PublicClient, WalletClient } from "viem";
import { executionEngineAbi } from "../abi/index.ts";
import type { Intent } from "../intent/types.ts";

export interface ExecutionClientConfig {
  address: Address;
  publicClient: PublicClient;
  walletClient?: WalletClient;
}

export interface ExecuteIntentResult {
  /** The transaction hash, once submitted. */
  hash: Hash;
  /** The decoded `bytes result` executeIntent() will return, from simulating first. */
  result: `0x${string}`;
}

/** Wraps packages/contracts/src/core/ExecutionEngine.sol. */
export function createExecutionClient(config: ExecutionClientConfig) {
  const { address, publicClient, walletClient } = config;

  return {
    address,

    async getModuleRegistryAddress(): Promise<Address> {
      return publicClient.readContract({
        address,
        abi: executionEngineAbi,
        functionName: "moduleRegistry",
      });
    },

    async getIntentRegistryAddress(): Promise<Address> {
      return publicClient.readContract({
        address,
        abi: executionEngineAbi,
        functionName: "intentRegistry",
      });
    },

    async getScorePolicyAddress(): Promise<Address> {
      return publicClient.readContract({
        address,
        abi: executionEngineAbi,
        functionName: "scorePolicy",
      });
    },

    /**
     * Simulates executeIntent() (to surface reverts and preview the
     * decoded result before spending gas), then submits it.
     */
    async executeIntent(intent: Intent, account?: Account | Address): Promise<ExecuteIntentResult> {
      if (!walletClient) {
        throw new Error("executeIntent requires a walletClient");
      }

      const sender = account ?? walletClient.account;
      if (!sender) {
        throw new Error("executeIntent requires an account (pass one, or configure the walletClient with one)");
      }

      const { request, result } = await publicClient.simulateContract({
        address,
        abi: executionEngineAbi,
        functionName: "executeIntent",
        args: [intent.intentType, intent.intentData],
        account: sender,
      });

      const hash = await walletClient.writeContract(request);

      return { hash, result };
    },
  };
}

export type ExecutionClient = ReturnType<typeof createExecutionClient>;
