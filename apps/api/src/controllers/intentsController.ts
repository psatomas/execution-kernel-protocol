import type { FastifyReply, FastifyRequest } from "fastify";
import type { Bytes32 } from "@execution-kernel-protocol/types";
import { toJsonSafe } from "../utils/json.ts";

export async function listIntents(request: FastifyRequest, reply: FastifyReply) {
  const { kernel } = request.server;

  const intentTypes = await kernel.intentRegistry.getAllIntents();
  const intents = await Promise.all(intentTypes.map((t) => kernel.intentRegistry.getIntent(t)));

  return reply.send(toJsonSafe({ intents }));
}

export async function getIntent(
  request: FastifyRequest<{ Params: { intentType: string } }>,
  reply: FastifyReply,
) {
  const { kernel } = request.server;
  const intentType = request.params.intentType as Bytes32;

  const intent = await kernel.intentRegistry.getIntent(intentType);

  // IntentRegistry.intents() returns a zero-valued struct for a type
  // that was never registered -- createdAt === 0 is the only on-chain
  // signal for that, since it can't distinguish "never registered" from
  // a genuinely-zero timestamp any other way.
  if (intent.createdAt === 0n) {
    return reply.status(404).send({ error: `intentType ${intentType} is not registered` });
  }

  return reply.send(toJsonSafe(intent));
}
