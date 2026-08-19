/** Mirrors packages/contracts/src/core/IntentRegistry.sol. */
export const intentRegistryAbi = [
  {
    type: "constructor",
    stateMutability: "nonpayable",
    inputs: [{ name: "_protocolRoles", type: "address" }],
  },
  {
    type: "function",
    name: "registerIntent",
    stateMutability: "nonpayable",
    inputs: [
      { name: "intentType", type: "bytes32" },
      { name: "name", type: "string" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "setIntentStatus",
    stateMutability: "nonpayable",
    inputs: [
      { name: "intentType", type: "bytes32" },
      { name: "active", type: "bool" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "isIntentActive",
    stateMutability: "view",
    inputs: [{ name: "intentType", type: "bytes32" }],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "getAllIntents",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "bytes32[]" }],
  },
  {
    type: "function",
    name: "intents",
    stateMutability: "view",
    inputs: [{ name: "", type: "bytes32" }],
    outputs: [
      { name: "intentType", type: "bytes32" },
      { name: "name", type: "string" },
      { name: "active", type: "bool" },
      { name: "createdAt", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "protocolRoles",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    type: "event",
    name: "IntentRegistered",
    inputs: [
      { name: "intentType", type: "bytes32", indexed: true },
      { name: "name", type: "string", indexed: false },
    ],
  },
  {
    type: "event",
    name: "IntentStatusUpdated",
    inputs: [
      { name: "intentType", type: "bytes32", indexed: true },
      { name: "active", type: "bool", indexed: false },
    ],
  },
] as const;
