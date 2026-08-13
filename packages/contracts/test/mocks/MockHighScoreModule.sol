// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../../src/modules/ExecutionModuleBase.sol";
import "../../src/types/ExecutionQuote.sol";

contract MockHighScoreModule is ExecutionModuleBase {

    constructor()
        ExecutionModuleBase(
            keccak256("HIGH_SCORE_MODULE"),
            "High Score Module",
            1
        )
    {}

    function _execute(
        address,
        bytes calldata,
        bytes calldata
    )
        internal
        override
        returns (bytes memory)
    {
        return abi.encode("HIGH_EXECUTED");
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
        ExecutionQuote memory quote = ExecutionQuote({
            tag: "HIGH_SIMULATION",
            executionCost: 50,
            executionQuality: 1000,
            mevRisk: 5,
            latencyScore: 5
        });

        return abi.encode(quote);
    }

    function _estimateCost(
        bytes calldata
    )
        internal
        pure
        override
        returns (uint256)
    {
        return 100;
    }

    function _supportsIntent(
        bytes32 intentType
    )
        internal
        pure
        override
        returns (bool)
    {
        return intentType == keccak256("ROUTE");
    }
}