/**
 * Mirrors packages/contracts/src/interfaces/IExecutionModule.sol. Callable
 * against ANY module address (RouterModule, MevProtectionModule, or any
 * future module) — moduleClient uses this, not a per-module ABI.
 */
export const executionModuleAbi = [
  {
    type: "function",
    name: "moduleId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "bytes32" }],
  },
  {
    type: "function",
    name: "name",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
  {
    type: "function",
    name: "version",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "execute",
    stateMutability: "nonpayable",
    inputs: [
      { name: "user", type: "address" },
      { name: "intentData", type: "bytes" },
      { name: "context", type: "bytes" },
    ],
    outputs: [{ name: "executionResult", type: "bytes" }],
  },
  {
    type: "function",
    name: "simulate",
    stateMutability: "view",
    inputs: [
      { name: "user", type: "address" },
      { name: "intentData", type: "bytes" },
      { name: "context", type: "bytes" },
    ],
    outputs: [{ name: "simulationResult", type: "bytes" }],
  },
  {
    type: "function",
    name: "estimateCost",
    stateMutability: "view",
    inputs: [{ name: "intentData", type: "bytes" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "supportsIntent",
    stateMutability: "view",
    inputs: [{ name: "intentType", type: "bytes32" }],
    outputs: [{ type: "bool" }],
  },
] as const;
