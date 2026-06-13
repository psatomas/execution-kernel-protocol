// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IExecutionQuote {

    struct Quote {
        uint256 executionCost;     // gas / fees
        uint256 executionQuality;  // success probability / routing quality
        uint256 mevRisk;           // 0 = safe, higher = more exposed
        uint256 latencyScore;      // off-chain proxy (lower is better)
        uint256 finalScore;        // computed aggregate
    }
}