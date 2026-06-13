// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../../src/modules/ExecutionModuleBase.sol";

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
        address user,
        bytes calldata,
        bytes calldata
    )
        internal
        view
        override
        returns (bytes memory)
    {
        return abi.encode(
            "HIGH_SIMULATION",
            uint256(1000),
            uint256(100),
            user
        );
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