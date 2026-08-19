// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../types/ExecutionQuote.sol";
import "../access/ProtocolRoles.sol";

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
    ProtocolRoles public immutable protocolRoles;

    event WeightsUpdated(
        uint256 qualityWeight,
        uint256 costWeight,
        uint256 mevWeight,
        uint256 latencyWeight
    );

    modifier onlyOwner() {
        require(protocolRoles.isOwner(msg.sender), "Not owner");
        _;
    }

    constructor(
        address _protocolRoles,
        uint256 _qualityWeight,
        uint256 _costWeight,
        uint256 _mevWeight,
        uint256 _latencyWeight
    ) {
        protocolRoles = ProtocolRoles(_protocolRoles);
        weights = Weights({
            qualityWeight: _qualityWeight,
            costWeight: _costWeight,
            mevWeight: _mevWeight,
            latencyWeight: _latencyWeight
        });
    }

    /// @notice Updates the scoring weights. Takes effect immediately for the
    /// next executeIntent() call — no timelock/delay.
    function updateWeights(
        uint256 _qualityWeight,
        uint256 _costWeight,
        uint256 _mevWeight,
        uint256 _latencyWeight
    )
        external
        onlyOwner
    {
        weights = Weights({
            qualityWeight: _qualityWeight,
            costWeight: _costWeight,
            mevWeight: _mevWeight,
            latencyWeight: _latencyWeight
        });

        emit WeightsUpdated(_qualityWeight, _costWeight, _mevWeight, _latencyWeight);
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