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
    /// @dev Higher score = better execution option. Signed on purpose: a module
    ///      whose penalty terms outweigh its quality has a legitimately negative
    ///      score, and must not revert the caller's selection loop over it
    ///      (see ExecutionEngine._selectBestModule).
    function evaluate(ExecutionQuote memory q)
        external
        view
        returns (int256 score)
    {
        // Weighted scoring model
        // quality is positive
        // others are penalties

        score =
            (int256(q.executionQuality) * int256(weights.qualityWeight))
            - (int256(q.executionCost) * int256(weights.costWeight))
            - (int256(q.mevRisk) * int256(weights.mevWeight))
            - (int256(q.latencyScore) * int256(weights.latencyWeight));
    }
}