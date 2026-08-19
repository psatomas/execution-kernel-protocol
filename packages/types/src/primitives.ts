/**
 * Shared EVM primitive aliases used across the type package. Kept as plain
 * template-literal types (rather than importing viem/ethers) so this
 * package has zero runtime dependencies — sdk/execution-node can adopt
 * whichever chain library they want and these types line up either way.
 */

/** A checksummed or lowercase 20-byte EVM address, e.g. a module or module registry address. */
export type Address = `0x${string}`;

/** A 32-byte hash/identifier, e.g. an intentType or moduleId (both keccak256-derived on-chain). */
export type Bytes32 = `0x${string}`;

/** Arbitrary ABI-encoded calldata or return data, e.g. intentData or an execution result. */
export type Hex = `0x${string}`;
