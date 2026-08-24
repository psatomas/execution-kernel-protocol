// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../../src/modules/ExecutionModuleBase.sol";
import "../../src/types/ExecutionQuote.sol";

/// @notice A single mock module type whose quote, supportsIntent() answer,
/// and failure mode are all set at construction time -- built for the
/// scalability/adversarial benchmark in ModuleScalability.t.sol, which needs
/// to cheaply deploy dozens to hundreds of distinctly-behaved candidates
/// without a new Solidity contract per behavior (the way
/// ExecutionEngine.t.sol/AdversarialModules.t.sol's one-mock-per-behavior
/// mocks work fine at N=2-3, but would mean 100 near-duplicate files at
/// N=100).
contract MockConfigurableModule is ExecutionModuleBase {

    uint256 private immutable executionCost;
    uint256 private immutable executionQuality;
    uint256 private immutable mevRisk;
    uint256 private immutable latencyScore;

    bool private immutable supported;
    bool private immutable revertsOnSimulate;
    bool private immutable revertsOnSupportsIntent;
    bool private immutable malformedQuote;

    constructor(
        string memory _tag,
        uint256 _executionCost,
        uint256 _executionQuality,
        uint256 _mevRisk,
        uint256 _latencyScore,
        bool _supported,
        bool _revertsOnSimulate,
        bool _revertsOnSupportsIntent,
        bool _malformedQuote
    )
        ExecutionModuleBase(keccak256(abi.encodePacked(_tag, _executionQuality)), _tag, 1)
    {
        executionCost = _executionCost;
        executionQuality = _executionQuality;
        mevRisk = _mevRisk;
        latencyScore = _latencyScore;
        supported = _supported;
        revertsOnSimulate = _revertsOnSimulate;
        revertsOnSupportsIntent = _revertsOnSupportsIntent;
        malformedQuote = _malformedQuote;
    }

    function _execute(
        address,
        bytes calldata,
        bytes calldata
    )
        internal
        view
        override
        returns (bytes memory)
    {
        return abi.encode(name);
    }

    function _simulate(
        address,
        bytes calldata,
        bytes calldata
    )
        internal
        view
        override
        returns (bytes memory)
    {
        if (revertsOnSimulate) {
            revert("simulate() broken");
        }

        if (malformedQuote) {
            // Nowhere near ExecutionQuote's (string, uint256, uint256,
            // uint256, uint256) shape -- same malformed-quote case
            // MockMalformedQuoteModule covers, but reusable at scale.
            return abi.encode(uint256(1), uint256(2));
        }

        ExecutionQuote memory quote = ExecutionQuote({
            tag: name,
            executionCost: executionCost,
            executionQuality: executionQuality,
            mevRisk: mevRisk,
            latencyScore: latencyScore
        });

        return abi.encode(quote);
    }

    function _supportsIntent(
        bytes32
    )
        internal
        view
        override
        returns (bool)
    {
        if (revertsOnSupportsIntent) {
            revert("supportsIntent() broken");
        }

        return supported;
    }
}
