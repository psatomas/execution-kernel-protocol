// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../types/ExecutionQuote.sol";

/// @notice Pluggable scoring policy for execution selection
/// @dev This allows MEV-aware, chain-specific, or governance-driven scoring upgrades
contract ScorePolicy {

    struct Weights {
        uint256 qualityWeight;
        uint256 costWeight;
        uint256 mevWeight;
        uint256 latencyWeight;
    }

    Weights public weights;

    constructor(
        uint256 _qualityWeight,
        uint256 _costWeight,
        uint256 _mevWeight,
        uint256 _latencyWeight
    ) {
        weights = Weights({
            qualityWeight: _qualityWeight,
            costWeight: _costWeight,
            mevWeight: _mevWeight,
            latencyWeight: _latencyWeight
        });
    }

    /// @notice Converts ExecutionQuote into a comparable score
    /// @dev Higher score = better execution option
    function evaluate(ExecutionQuote memory q)
        external
        view
        returns (uint256 score)
    {
        // Weighted scoring model
        // quality is positive
        // others are penalties

        score =
            (q.executionQuality * weights.qualityWeight)
            - (q.executionCost * weights.costWeight)
            - (q.mevRisk * weights.mevWeight)
            - (q.latencyScore * weights.latencyWeight);
    }
}