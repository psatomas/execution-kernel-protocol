/** Mirrors packages/contracts/src/registry/ModuleRegistry.sol. */
export const moduleRegistryAbi = [
  {
    type: "constructor",
    stateMutability: "nonpayable",
    inputs: [{ name: "_protocolRoles", type: "address" }],
  },
  {
    type: "function",
    name: "registerModule",
    stateMutability: "nonpayable",
    inputs: [
      { name: "intentType", type: "bytes32" },
      { name: "module", type: "address" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "removeModule",
    stateMutability: "nonpayable",
    inputs: [
      { name: "intentType", type: "bytes32" },
      { name: "module", type: "address" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "getModules",
    stateMutability: "view",
    inputs: [{ name: "intentType", type: "bytes32" }],
    outputs: [{ type: "address[]" }],
  },
  {
    type: "function",
    name: "isModuleActive",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ type: "bool" }],
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
    name: "ModuleRegistered",
    inputs: [
      { name: "intentType", type: "bytes32", indexed: true },
      { name: "module", type: "address", indexed: false },
    ],
  },
  {
    type: "event",
    name: "ModuleRemoved",
    inputs: [
      { name: "intentType", type: "bytes32", indexed: true },
      { name: "module", type: "address", indexed: false },
    ],
  },
  {
    type: "event",
    name: "ModuleStatusUpdated",
    inputs: [
      { name: "module", type: "address", indexed: false },
      { name: "active", type: "bool", indexed: false },
    ],
  },
] as const;
