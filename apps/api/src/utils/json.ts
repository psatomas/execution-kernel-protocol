/**
 * Recursively converts a value into something Fastify's default JSON
 * serializer can actually handle. Needed because most of what this API
 * returns comes straight from viem/sdk reads -- bigint fields (createdAt,
 * module version, quote/weight numbers) and, from indexer's
 * executionsByModule(), a Map -- and plain JSON.stringify throws on bigint
 * and silently serializes a Map as `{}`.
 */
export function toJsonSafe(value: unknown): unknown {
  if (typeof value === "bigint") {
    return value.toString();
  }

  if (value instanceof Map) {
    return Object.fromEntries([...value.entries()].map(([k, v]) => [k, toJsonSafe(v)]));
  }

  if (Array.isArray(value)) {
    return value.map(toJsonSafe);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, toJsonSafe(v)]));
  }

  return value;
}
