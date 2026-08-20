import type { FastifyReply, FastifyRequest } from "fastify";
import type { Address } from "viem";
import { createIndexer } from "@execution-kernel-protocol/indexer";
import { localAnvilAddresses } from "@execution-kernel-protocol/config";
import type { Bytes32 } from "@execution-kernel-protocol/types";
import { toJsonSafe } from "../utils/json.ts";

/**
 * Backfills a fresh indexer from block 0 on every request rather than
 * keeping one running in the background -- correct, but re-scans the whole
 * chain's history each call. Fine on a handful of local-anvil blocks;
 * revisit (persistent store + incremental backfill, or a live
 * watchEvents() subscription) before this API ever points at a chain with
 * real history.
 */
async function getIndexer(request: FastifyRequest) {
  return createIndexer({
    publicClient: request.server.publicClient,
    addresses: localAnvilAddresses,
    fromBlock: 0n,
  });
}

export async function getExecutionMetrics(
  request: FastifyRequest<{ Querystring: { intentType?: string } }>,
  reply: FastifyReply,
) {
  const indexer = await getIndexer(request);
  const intentType = request.query.intentType as Bytes32 | undefined;

  return reply.send(
    toJsonSafe({
      totalExecutions: indexer.totalExecutions(intentType),
      executionsByModule: indexer.executionsByModule(intentType),
    }),
  );
}

export async function getModuleWinRate(
  request: FastifyRequest<{ Params: { intentType: string; module: string } }>,
  reply: FastifyReply,
) {
  const indexer = await getIndexer(request);
  const intentType = request.params.intentType as Bytes32;
  const module = request.params.module as Address;

  return reply.send(toJsonSafe({ winRate: indexer.moduleWinRate(module, intentType) }));
}
