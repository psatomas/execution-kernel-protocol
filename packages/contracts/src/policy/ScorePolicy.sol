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
        return _evaluate(q);
    }

    /// @notice Same as evaluate(), but decodes the quote from a module's raw
    /// simulate() return bytes itself. ExecutionEngine calls this (wrapped
    /// in try/catch) instead of decoding separately and calling evaluate() --
    /// abi.decode() can't be try/caught directly since it isn't an external
    /// call, so folding the decode into this external function is what lets
    /// a malformed quote be skipped instead of reverting the whole
    /// selection loop.
    function evaluateQuoteBytes(bytes calldata rawQuote)
        external
        view
        returns (int256 score)
    {
        ExecutionQuote memory q = abi.decode(rawQuote, (ExecutionQuote));
        return _evaluate(q);
    }

    function _evaluate(ExecutionQuote memory q)
        internal
        view
        returns (int256 score)
    {
        // Weighted scoring model
        // quality is positive
        // others are penalties

        score =
            (_toInt256(q.executionQuality) * _toInt256(weights.qualityWeight))
            - (_toInt256(q.executionCost) * _toInt256(weights.costWeight))
            - (_toInt256(q.mevRisk) * _toInt256(weights.mevWeight))
            - (_toInt256(q.latencyScore) * _toInt256(weights.latencyWeight));
    }

    /// @dev Solidity 0.8's overflow checks cover arithmetic (+, -, *), not
    ///      same-width int/uint casts -- int256(x) for x > type(int256).max
    ///      silently reinterprets the bit pattern as negative instead of
    ///      reverting. A module returning a uint256 this large (not
    ///      necessarily malicious -- just larger than anyone expected a
    ///      cost/quality/risk/latency figure to ever be) would otherwise
    ///      have its quote's sign silently flipped. Reject it explicitly
    ///      instead.
    function _toInt256(uint256 value) internal pure returns (int256) {
        require(value <= uint256(type(int256).max), "Value exceeds int256 range");
        return int256(value);
    }
}