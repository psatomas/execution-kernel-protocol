/**
 * Mirrors packages/contracts/src/policy/ScorePolicy.sol. The `quote` param
 * shape on evaluate() mirrors ExecutionQuote in
 * packages/contracts/src/types/ExecutionQuote.sol.
 */
export const scorePolicyAbi = [
  {
    type: "constructor",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_protocolRoles", type: "address" },
      { name: "_qualityWeight", type: "uint256" },
      { name: "_costWeight", type: "uint256" },
      { name: "_mevWeight", type: "uint256" },
      { name: "_latencyWeight", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "updateWeights",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_qualityWeight", type: "uint256" },
      { name: "_costWeight", type: "uint256" },
      { name: "_mevWeight", type: "uint256" },
      { name: "_latencyWeight", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "evaluate",
    stateMutability: "view",
    inputs: [
      {
        name: "q",
        type: "tuple",
        components: [
          { name: "tag", type: "string" },
          { name: "executionCost", type: "uint256" },
          { name: "executionQuality", type: "uint256" },
          { name: "mevRisk", type: "uint256" },
          { name: "latencyScore", type: "uint256" },
        ],
      },
    ],
    outputs: [{ name: "score", type: "int256" }],
  },
  {
    type: "function",
    name: "weights",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "qualityWeight", type: "uint256" },
      { name: "costWeight", type: "uint256" },
      { name: "mevWeight", type: "uint256" },
      { name: "latencyWeight", type: "uint256" },
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
    name: "WeightsUpdated",
    inputs: [
      { name: "qualityWeight", type: "uint256", indexed: false },
      { name: "costWeight", type: "uint256", indexed: false },
      { name: "mevWeight", type: "uint256", indexed: false },
      { name: "latencyWeight", type: "uint256", indexed: false },
    ],
  },
] as const;
