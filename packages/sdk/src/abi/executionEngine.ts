/**
 * Mirrors packages/contracts/src/core/ExecutionEngine.sol. Hand-authored
 * (not codegen'd from forge build output) — keep in sync manually when the
 * contract's external surface changes.
 */
export const executionEngineAbi = [
  {
    type: "constructor",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_intentRegistry", type: "address" },
      { name: "_moduleRegistry", type: "address" },
      { name: "_scorePolicy", type: "address" },
    ],
  },
  {
    type: "function",
    name: "executeIntent",
    stateMutability: "nonpayable",
    inputs: [
      { name: "intentType", type: "bytes32" },
      { name: "intentData", type: "bytes" },
    ],
    outputs: [{ name: "result", type: "bytes" }],
  },
  {
    type: "function",
    name: "moduleRegistry",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    type: "function",
    name: "intentRegistry",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    type: "function",
    name: "scorePolicy",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    type: "event",
    name: "IntentExecuted",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "intentType", type: "bytes32", indexed: true },
      { name: "selectedModule", type: "address", indexed: false },
      { name: "result", type: "bytes", indexed: false },
    ],
  },
] as const;
