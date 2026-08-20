import type { Abi, Address, ContractEventName, GetContractEventsReturnType, PublicClient } from "viem";

export interface BackfillEventsParams<TAbi extends Abi | readonly unknown[], TEventName extends ContractEventName<TAbi>> {
  publicClient: PublicClient;
  address: Address;
  abi: TAbi;
  eventName: TEventName;
  fromBlock: bigint;
  toBlock?: bigint | "latest";
}

/**
 * Fetches every past occurrence of one event from one contract. Generic
 * over (address, abi, eventName) rather than one function per contract —
 * every contract's events decode the same way through viem, so there's no
 * per-contract logic to specialize here (same reasoning as
 * apps/execution-node's single solver, or sdk's generic moduleClient).
 */
export async function backfillEvents<
  const TAbi extends Abi | readonly unknown[],
  TEventName extends ContractEventName<TAbi>,
>(
  params: BackfillEventsParams<TAbi, TEventName>,
): Promise<GetContractEventsReturnType<TAbi, TEventName>> {
  const { publicClient, address, abi, eventName, fromBlock, toBlock = "latest" } = params;

  return publicClient.getContractEvents({
    address,
    abi,
    eventName,
    fromBlock,
    toBlock,
  });
}

export interface WatchEventsParams<TAbi extends Abi | readonly unknown[], TEventName extends ContractEventName<TAbi>> {
  publicClient: PublicClient;
  address: Address;
  abi: TAbi;
  eventName: TEventName;
  onLogs: (logs: GetContractEventsReturnType<TAbi, TEventName>) => void;
}

/** Live subscription counterpart to backfillEvents(). Returns an unwatch function. */
export function watchEvents<const TAbi extends Abi | readonly unknown[], TEventName extends ContractEventName<TAbi>>(
  params: WatchEventsParams<TAbi, TEventName>,
): () => void {
  const { publicClient, address, abi, eventName, onLogs } = params;

  return publicClient.watchContractEvent({
    address,
    abi,
    eventName,
    onLogs: (logs) => onLogs(logs as GetContractEventsReturnType<TAbi, TEventName>),
  });
}
