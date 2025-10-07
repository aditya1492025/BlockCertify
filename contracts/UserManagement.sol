// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title UserManagement
 * @dev Smart contract for managing user roles and permissions
 */
contract UserManagement is AccessControl, Pausable {
    
    // Role definitions
    bytes32 public constant INSTITUTION_ROLE = keccak256("INSTITUTION_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant STUDENT_ROLE = keccak256("STUDENT_ROLE");

    // Events
    event UserRegistered(address indexed user, bytes32 indexed role, string userType);
    event UserRoleUpdated(address indexed user, bytes32 indexed oldRole, bytes32 indexed newRole);
    event UserProfileUpdated(address indexed user);

    // User profile struct
    struct UserProfile {
        string name;
        string email;
        string profileType; // "institution", "verifier", "student"
        bool isActive;
        uint256 registeredAt;
        string additionalData; // JSON string for flexible data
    }

    // Mappings
    mapping(address => UserProfile) public userProfiles;
    mapping(address => bool) public registeredUsers;

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Register a new user with a specific role
     * @param _user Address of the user
     * @param _role Role to assign to the user
     * @param _name Name of the user
     * @param _email Email of the user
     * @param _profileType Type of profile
     * @param _additionalData Additional data in JSON format
     */
    function registerUser(
        address _user,
        bytes32 _role,
        string memory _name,
        string memory _email,
        string memory _profileType,
        string memory _additionalData
    ) external onlyRole(DEFAULT_ADMIN_ROLE) whenNotPaused {
        require(_user != address(0), "Invalid user address");
        require(!registeredUsers[_user], "User already registered");
        require(
            _role == INSTITUTION_ROLE || _role == VERIFIER_ROLE || _role == STUDENT_ROLE,
            "Invalid role"
        );

        _grantRole(_role, _user);
        
        userProfiles[_user] = UserProfile({
            name: _name,
            email: _email,
            profileType: _profileType,
            isActive: true,
            registeredAt: block.timestamp,
            additionalData: _additionalData
        });

        registeredUsers[_user] = true;

        emit UserRegistered(_user, _role, _profileType);
    }

    /**
     * @dev Update user role
     * @param _user Address of the user
     * @param _newRole New role to assign
     */
    function updateUserRole(address _user, bytes32 _newRole) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
        whenNotPaused 
    {
        require(registeredUsers[_user], "User not registered");
        require(
            _newRole == INSTITUTION_ROLE || _newRole == VERIFIER_ROLE || _newRole == STUDENT_ROLE,
            "Invalid role"
        );

        bytes32 oldRole;
        
        // Determine current role
        if (hasRole(INSTITUTION_ROLE, _user)) {
            oldRole = INSTITUTION_ROLE;
            _revokeRole(INSTITUTION_ROLE, _user);
        } else if (hasRole(VERIFIER_ROLE, _user)) {
            oldRole = VERIFIER_ROLE;
            _revokeRole(VERIFIER_ROLE, _user);
        } else if (hasRole(STUDENT_ROLE, _user)) {
            oldRole = STUDENT_ROLE;
            _revokeRole(STUDENT_ROLE, _user);
        }

        _grantRole(_newRole, _user);
        
        emit UserRoleUpdated(_user, oldRole, _newRole);
    }

    /**
     * @dev Update user profile
     * @param _name New name
     * @param _email New email
     * @param _additionalData New additional data
     */
    function updateProfile(
        string memory _name,
        string memory _email,
        string memory _additionalData
    ) external whenNotPaused {
        require(registeredUsers[msg.sender], "User not registered");

        UserProfile storage profile = userProfiles[msg.sender];
        profile.name = _name;
        profile.email = _email;
        profile.additionalData = _additionalData;

        emit UserProfileUpdated(msg.sender);
    }

    /**
     * @dev Activate or deactivate a user
     * @param _user Address of the user
     * @param _isActive New status
     */
    function setUserStatus(address _user, bool _isActive) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
        whenNotPaused 
    {
        require(registeredUsers[_user], "User not registered");
        userProfiles[_user].isActive = _isActive;
    }

    /**
     * @dev Get user profile
     * @param _user Address of the user
     * @return UserProfile struct
     */
    function getUserProfile(address _user) external view returns (UserProfile memory) {
        require(registeredUsers[_user], "User not registered");
        return userProfiles[_user];
    }

    /**
     * @dev Check if user has a specific role
     * @param _user Address of the user
     * @param _role Role to check
     * @return Boolean indicating if user has the role
     */
    function userHasRole(address _user, bytes32 _role) external view returns (bool) {
        return hasRole(_role, _user);
    }

    /**
     * @dev Get user's role
     * @param _user Address of the user
     * @return Role of the user
     */
    function getUserRole(address _user) external view returns (bytes32) {
        if (hasRole(INSTITUTION_ROLE, _user)) return INSTITUTION_ROLE;
        if (hasRole(VERIFIER_ROLE, _user)) return VERIFIER_ROLE;
        if (hasRole(STUDENT_ROLE, _user)) return STUDENT_ROLE;
        return bytes32(0);
    }

    /**
     * @dev Check if user is active
     * @param _user Address of the user
     * @return Boolean indicating if user is active
     */
    function isUserActive(address _user) external view returns (bool) {
        return registeredUsers[_user] && userProfiles[_user].isActive;
    }

    /**
     * @dev Pause the contract
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}