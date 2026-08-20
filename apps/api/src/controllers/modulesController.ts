import type { FastifyReply, FastifyRequest } from "fastify";
import type { Address, Hex } from "viem";
import { solve } from "@execution-kernel-protocol/execution-node";
import type { Bytes32 } from "@execution-kernel-protocol/types";
import { toJsonSafe } from "../utils/json.ts";

export async function listModules(
  request: FastifyRequest<{ Params: { intentType: string } }>,
  reply: FastifyReply,
) {
  const { kernel } = request.server;
  const intentType = request.params.intentType as Bytes32;

  const moduleAddresses = await kernel.moduleRegistry.getModules(intentType);
  const modules = await Promise.all(moduleAddresses.map((m) => kernel.module.getModuleInfo(m)));

  return reply.send(toJsonSafe({ modules }));
}

/**
 * Off-chain, gas-free prediction of which registered module
 * ExecutionEngine.executeIntent() would currently pick -- wraps
 * execution-node's solve(). Does not submit anything.
 */
export async function predictWinner(
  request: FastifyRequest<{
    Params: { intentType: string };
    Querystring: { user: string; intentData?: string };
  }>,
  reply: FastifyReply,
) {
  const { kernel } = request.server;
  const intentType = request.params.intentType as Bytes32;
  const user = request.query.user as Address;
  const intentData = (request.query.intentData ?? "0x") as Hex;

  try {
    const result = await solve(kernel, intentType, user, intentData);
    return reply.send(toJsonSafe(result));
  } catch (err) {
    return reply.status(404).send({ error: (err as Error).message });
  }
}
