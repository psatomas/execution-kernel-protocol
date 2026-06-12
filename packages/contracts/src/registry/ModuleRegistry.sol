// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IExecutionModule.sol";

contract ModuleRegistry {

    /// @notice intentType => list of module addresses
    mapping(bytes32 => address[]) private modulesByIntent;

    /// @notice module => active status
    mapping(address => bool) public isModuleActive;

    address public owner;

    event ModuleRegistered(bytes32 indexed intentType, address module);
    event ModuleRemoved(bytes32 indexed intentType, address module);
    event ModuleStatusUpdated(address module, bool active);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // -----------------------------
    // MODULE MANAGEMENT
    // -----------------------------

    function registerModule(
        bytes32 intentType,
        address module
    )
        external
        onlyOwner
    {
        require(module != address(0), "Invalid module");
        require(!isModuleActive[module], "Already active");

        modulesByIntent[intentType].push(module);
        isModuleActive[module] = true;

        emit ModuleRegistered(intentType, module);
        emit ModuleStatusUpdated(module, true);
    }

    function removeModule(
        bytes32 intentType,
        address module
    )
        external
        onlyOwner
    {
        address[] storage list = modulesByIntent[intentType];

        for (uint256 i = 0; i < list.length; i++) {
            if (list[i] == module) {
                list[i] = list[list.length - 1];
                list.pop();
                break;
            }
        }

        isModuleActive[module] = false;

        emit ModuleRemoved(intentType, module);
        emit ModuleStatusUpdated(module, false);
    }

    // -----------------------------
    // VIEW FUNCTIONS (ENGINE USE)
    // -----------------------------

    function getModules(
        bytes32 intentType
    )
        external
        view
        returns (address[] memory)
    {
        address[] memory all = modulesByIntent[intentType];

        uint256 count = 0;

        // count active modules
        for (uint256 i = 0; i < all.length; i++) {
            if (isModuleActive[all[i]]) {
                count++;
            }
        }

        address[] memory active = new address[](count);

        uint256 index = 0;

        for (uint256 i = 0; i < all.length; i++) {
            if (isModuleActive[all[i]]) {
                active[index] = all[i];
                index++;
            }
        }

        return active;
    }
}