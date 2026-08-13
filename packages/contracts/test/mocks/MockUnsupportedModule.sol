// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../../src/modules/ExecutionModuleBase.sol";
import "../../src/types/ExecutionQuote.sol";

contract MockUnsupportedModule is ExecutionModuleBase {

    constructor()
        ExecutionModuleBase(
            keccak256("UNSUPPORTED_MODULE"),
            "Unsupported Module",
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
        return abi.encode("UNSUPPORTED_EXECUTED");
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
            tag: "UNSUPPORTED_SIMULATION",
            executionCost: 9999,
            executionQuality: 100,
            mevRisk: 9999,
            latencyScore: 9999
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
        bytes32
    )
        internal
        pure
        override
        returns (bool)
    {
        return false;
    }
}