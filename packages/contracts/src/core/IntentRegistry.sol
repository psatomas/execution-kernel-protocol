// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract IntentRegistry {

    struct IntentDefinition {
        bytes32 intentType;
        string name;
        bool active;
        uint256 createdAt;
    }

    /// @notice intentType => definition
    mapping(bytes32 => IntentDefinition) public intents;

    /// @notice list of all intent types
    bytes32[] public intentList;

    address public owner;

    event IntentRegistered(bytes32 indexed intentType, string name);
    event IntentStatusUpdated(bytes32 indexed intentType, bool active);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // -----------------------------
    // INTENT MANAGEMENT
    // -----------------------------

    function registerIntent(
        bytes32 intentType,
        string calldata name
    )
        external
        onlyOwner
    {
        require(intentType != bytes32(0), "Invalid intent");
        require(intents[intentType].createdAt == 0, "Already exists");

        intents[intentType] = IntentDefinition({
            intentType: intentType,
            name: name,
            active: true,
            createdAt: block.timestamp
        });

        intentList.push(intentType);

        emit IntentRegistered(intentType, name);
    }

    function setIntentStatus(
        bytes32 intentType,
        bool active
    )
        external
        onlyOwner
    {
        require(intents[intentType].createdAt != 0, "Not found");

        intents[intentType].active = active;

        emit IntentStatusUpdated(intentType, active);
    }

    // -----------------------------
    // VIEW FUNCTIONS
    // -----------------------------

    function isIntentActive(
        bytes32 intentType
    )
        external
        view
        returns (bool)
    {
        return intents[intentType].active;
    }

    function getAllIntents()
        external
        view
        returns (bytes32[] memory)
    {
        return intentList;
    }
}