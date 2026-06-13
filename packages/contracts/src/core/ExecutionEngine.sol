// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IExecutionModule.sol";
import "../types/ExecutionQuote.sol";

interface IModuleRegistry {
    function getModules(bytes32 intentType) external view returns (address[] memory);
}

contract ExecutionEngine {

    IModuleRegistry public immutable moduleRegistry;

    event IntentExecuted(
        address indexed user,
        bytes32 indexed intentType,
        address selectedModule,
        bytes result
    );

    constructor(address _moduleRegistry) {
        moduleRegistry = IModuleRegistry(_moduleRegistry);
    }

    /// @notice Main entrypoint of the execution kernel
    function executeIntent(
        bytes32 intentType,
        bytes calldata intentData
    )
        external
        returns (bytes memory result)
    {
        address user = msg.sender;

        // 1. Fetch candidate modules
        address[] memory modules =
            moduleRegistry.getModules(intentType);

        require(modules.length > 0, "No modules available");

        // 2. Evaluate best module via simulation scoring
        address bestModule = _selectBestModule(
            user,
            intentType,
            intentData,
            modules
        );

        // 3. Execute selected module
        result = IExecutionModule(bestModule).execute(
            user,
            intentData,
            abi.encode(intentType)
        );

        emit IntentExecuted(
            user,
            intentType,
            bestModule,
            result
        );
    }

    // -----------------------------
    // INTERNAL SELECTION LOGIC
    // -----------------------------

    function _selectBestModule(
        address user,
        bytes32 intentType,
        bytes calldata intentData,
        address[] memory modules
    )
        internal
        view
        returns (address bestModule)
    {
        uint256 bestScore = 0;
        bool foundCompatibleModule = false;

        for (uint256 i = 0; i < modules.length; i++) {
            IExecutionModule module = IExecutionModule(modules[i]);

            if (!module.supportsIntent(intentType)) {
                continue;
            }

            foundCompatibleModule = true;

            bytes memory sim = module.simulate(
                user,
                intentData,
                abi.encode(intentType)
            );

            ExecutionQuote memory quote =
                abi.decode(sim, (ExecutionQuote));

            uint256 score =
                quote.executionQuality
                - quote.executionCost
                - quote.mevRisk
                - quote.latencyScore;

            if (!foundCompatibleModule || score > bestScore) {
                bestScore = score;
                bestModule = modules[i];
            }
        }

        require(foundCompatibleModule, "No compatible modules");
    }
}