// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Standardized execution simulation output across all modules
/// @dev This is the canonical scoring object used by ExecutionEngine
struct ExecutionQuote {
    string tag;

    // Lower is better (cost efficiency)
    uint256 executionCost;

    // Higher is better (execution quality / success probability)
    uint256 executionQuality;

    // Lower is better (MEV exposure risk)
    uint256 mevRisk;

    // Lower is better (latency / time-to-finality)
    uint256 latencyScore;
}