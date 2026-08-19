import type { Account, Address, Hash, PublicClient, WalletClient } from "viem";
import { protocolRolesAbi } from "../abi/index.ts";

export interface ProtocolRolesClientConfig {
  address: Address;
  publicClient: PublicClient;
  walletClient?: WalletClient;
}

/** Wraps packages/contracts/src/access/ProtocolRoles.sol. */
export function createProtocolRolesClient(config: ProtocolRolesClientConfig) {
  const { address, publicClient, walletClient } = config;

  return {
    address,

    async getOwner(): Promise<Address> {
      return publicClient.readContract({ address, abi: protocolRolesAbi, functionName: "owner" });
    },

    async isOwner(account: Address): Promise<boolean> {
      return publicClient.readContract({
        address,
        abi: protocolRolesAbi,
        functionName: "isOwner",
        args: [account],
      });
    },

    /**
     * onlyOwner on-chain. Moves control of every contract that defers to
     * ProtocolRoles.isOwner() to newOwner, immediately.
     */
    async transferOwnership(newOwner: Address, account?: Account | Address): Promise<Hash> {
      if (!walletClient) {
        throw new Error("transferOwnership requires a walletClient (and is onlyOwner on-chain)");
      }
      const sender = account ?? walletClient.account;
      if (!sender) throw new Error("transferOwnership requires an account");

      const { request } = await publicClient.simulateContract({
        address,
        abi: protocolRolesAbi,
        functionName: "transferOwnership",
        args: [newOwner],
        account: sender,
      });

      return walletClient.writeContract(request);
    },
  };
}

export type ProtocolRolesClient = ReturnType<typeof createProtocolRolesClient>;
