import type { Account, Address, Hash, PublicClient, WalletClient } from "viem";
import type { Bytes32, IntentDefinition } from "@execution-kernel-protocol/types";
import { intentRegistryAbi } from "../abi/index.ts";

export interface IntentRegistryClientConfig {
  address: Address;
  publicClient: PublicClient;
  walletClient?: WalletClient;
}

/** Wraps packages/contracts/src/core/IntentRegistry.sol. */
export function createIntentRegistryClient(config: IntentRegistryClientConfig) {
  const { address, publicClient, walletClient } = config;

  function requireWrite(): WalletClient {
    if (!walletClient) {
      throw new Error("this call requires a walletClient (and is onlyOwner on-chain)");
    }
    return walletClient;
  }

  return {
    address,

    async isIntentActive(intentType: Bytes32): Promise<boolean> {
      return publicClient.readContract({
        address,
        abi: intentRegistryAbi,
        functionName: "isIntentActive",
        args: [intentType],
      });
    },

    async getAllIntents(): Promise<readonly Bytes32[]> {
      return publicClient.readContract({
        address,
        abi: intentRegistryAbi,
        functionName: "getAllIntents",
      });
    },

    async getIntent(intentType: Bytes32): Promise<IntentDefinition> {
      const [type_, name, active, createdAt] = await publicClient.readContract({
        address,
        abi: intentRegistryAbi,
        functionName: "intents",
        args: [intentType],
      });

      return { intentType: type_, name, active, createdAt };
    },

    /** onlyOwner on-chain — reverts unless the walletClient's account is the ProtocolRoles owner. */
    async registerIntent(intentType: Bytes32, name: string, account?: Account | Address): Promise<Hash> {
      const wallet = requireWrite();
      const sender = account ?? wallet.account;
      if (!sender) throw new Error("registerIntent requires an account");

      const { request } = await publicClient.simulateContract({
        address,
        abi: intentRegistryAbi,
        functionName: "registerIntent",
        args: [intentType, name],
        account: sender,
      });

      return wallet.writeContract(request);
    },

    /** onlyOwner on-chain. */
    async setIntentStatus(intentType: Bytes32, active: boolean, account?: Account | Address): Promise<Hash> {
      const wallet = requireWrite();
      const sender = account ?? wallet.account;
      if (!sender) throw new Error("setIntentStatus requires an account");

      const { request } = await publicClient.simulateContract({
        address,
        abi: intentRegistryAbi,
        functionName: "setIntentStatus",
        args: [intentType, active],
        account: sender,
      });

      return wallet.writeContract(request);
    },
  };
}

export type IntentRegistryClient = ReturnType<typeof createIntentRegistryClient>;
