// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IExecutionModule.sol";
import "../policy/ScorePolicy.sol";

interface IModuleRegistry {
    function getModules(bytes32 intentType) external view returns (address[] memory);
}

interface IIntentRegistry {
    function isIntentActive(bytes32 intentType) external view returns (bool);
}

contract ExecutionEngine {

    IModuleRegistry public immutable moduleRegistry;
    IIntentRegistry public immutable intentRegistry;
    ScorePolicy public immutable scorePolicy;

    event IntentExecuted(
        address indexed user,
        bytes32 indexed intentType,
        address selectedModule,
        bytes result
    );

    constructor(
        address _intentRegistry,
        address _moduleRegistry,
        address _scorePolicy
    ) {
        intentRegistry = IIntentRegistry(_intentRegistry);
        moduleRegistry = IModuleRegistry(_moduleRegistry);
        scorePolicy = ScorePolicy(_scorePolicy);
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

        // 1. Reject intent types that were never registered, or were
        //    deactivated by governance (IntentRegistry.setIntentStatus).
        require(intentRegistry.isIntentActive(intentType), "Intent not active");

        // 2. Fetch candidate modules
        address[] memory modules =
            moduleRegistry.getModules(intentType);

        require(modules.length > 0, "No modules available");

        // 3. Evaluate best module via simulation scoring
        address bestModule = _selectBestModule(
            user,
            intentType,
            intentData,
            modules
        );

        // 4. Execute selected module
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
        int256 bestScore;
        bool initialized;

        for (uint256 i = 0; i < modules.length; i++) {
            IExecutionModule module = IExecutionModule(modules[i]);

            if (!module.supportsIntent(intentType)) {
                continue;
            }

            bytes memory sim = module.simulate(
                user,
                intentData,
                abi.encode(intentType)
            );

            ExecutionQuote memory quote =
                abi.decode(sim, (ExecutionQuote));

            int256 score = scorePolicy.evaluate(quote);

            if (!initialized || score > bestScore) {
                bestScore = score;
                bestModule = modules[i];
                initialized = true;
            }
        }

        require(initialized, "No compatible modules");
    }
}