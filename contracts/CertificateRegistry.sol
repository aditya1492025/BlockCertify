// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title CertificateRegistry
 * @dev Smart contract for managing certificate issuance and verification
 */
contract CertificateRegistry is Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;

    // Certificate ID counter
    Counters.Counter private _certificateIds;

    // Events
    event InstitutionRegistered(address indexed institution, string name);
    event CertificateIssued(
        uint256 indexed certificateId,
        address indexed institution,
        address indexed recipient,
        string certificateHash
    );
    event CertificateVerified(uint256 indexed certificateId, address indexed verifier);
    event InstitutionStatusChanged(address indexed institution, bool isActive);

    // Structs
    struct Institution {
        string name;
        string registrationNumber;
        bool isActive;
        bool isRegistered;
        uint256 registeredAt;
    }

    struct Certificate {
        uint256 id;
        address institution;
        address recipient;
        string certificateHash; // IPFS hash or document hash
        string metadataHash; // Additional metadata hash
        uint256 issuedAt;
        bool isValid;
        string certificateType; // e.g., "degree", "diploma", "certification"
        string courseName;
        string grade;
    }

    // Mappings
    mapping(address => Institution) public institutions;
    mapping(uint256 => Certificate) public certificates;
    mapping(string => uint256) public certificateHashToId;
    mapping(address => uint256[]) public recipientCertificates;
    mapping(address => uint256[]) public institutionCertificates;

    // Modifiers
    modifier onlyRegisteredInstitution() {
        require(
            institutions[msg.sender].isRegistered && institutions[msg.sender].isActive,
            "Not a registered or active institution"
        );
        _;
    }

    modifier certificateExists(uint256 _certificateId) {
        require(_certificateId > 0 && _certificateId <= _certificateIds.current(), "Certificate does not exist");
        _;
    }

    /**
     * @dev Register a new institution
     * @param _institutionAddress Address of the institution
     * @param _name Name of the institution
     * @param _registrationNumber Official registration number
     */
    function registerInstitution(
        address _institutionAddress,
        string memory _name,
        string memory _registrationNumber
    ) external onlyOwner {
        require(_institutionAddress != address(0), "Invalid institution address");
        require(!institutions[_institutionAddress].isRegistered, "Institution already registered");
        require(bytes(_name).length > 0, "Institution name required");
        require(bytes(_registrationNumber).length > 0, "Registration number required");

        institutions[_institutionAddress] = Institution({
            name: _name,
            registrationNumber: _registrationNumber,
            isActive: true,
            isRegistered: true,
            registeredAt: block.timestamp
        });

        emit InstitutionRegistered(_institutionAddress, _name);
    }

    /**
     * @dev Issue a new certificate
     * @param _recipient Address of the certificate recipient
     * @param _certificateHash Hash of the certificate document
     * @param _metadataHash Hash of additional metadata
     * @param _certificateType Type of certificate
     * @param _courseName Name of the course/program
     * @param _grade Grade or achievement level
     */
    function issueCertificate(
        address _recipient,
        string memory _certificateHash,
        string memory _metadataHash,
        string memory _certificateType,
        string memory _courseName,
        string memory _grade
    ) external onlyRegisteredInstitution nonReentrant {
        require(_recipient != address(0), "Invalid recipient address");
        require(bytes(_certificateHash).length > 0, "Certificate hash required");
        require(certificateHashToId[_certificateHash] == 0, "Certificate hash already exists");

        _certificateIds.increment();
        uint256 newCertificateId = _certificateIds.current();

        certificates[newCertificateId] = Certificate({
            id: newCertificateId,
            institution: msg.sender,
            recipient: _recipient,
            certificateHash: _certificateHash,
            metadataHash: _metadataHash,
            issuedAt: block.timestamp,
            isValid: true,
            certificateType: _certificateType,
            courseName: _courseName,
            grade: _grade
        });

        certificateHashToId[_certificateHash] = newCertificateId;
        recipientCertificates[_recipient].push(newCertificateId);
        institutionCertificates[msg.sender].push(newCertificateId);

        emit CertificateIssued(newCertificateId, msg.sender, _recipient, _certificateHash);
    }

    /**
     * @dev Verify a certificate by ID
     * @param _certificateId ID of the certificate to verify
     * @return Certificate struct if valid
     */
    function verifyCertificate(uint256 _certificateId)
        external
        certificateExists(_certificateId)
        returns (Certificate memory)
    {
        Certificate memory cert = certificates[_certificateId];
        require(cert.isValid, "Certificate is not valid");
        require(institutions[cert.institution].isActive, "Issuing institution is not active");

        emit CertificateVerified(_certificateId, msg.sender);
        return cert;
    }

    /**
     * @dev Verify a certificate by hash
     * @param _certificateHash Hash of the certificate to verify
     * @return Certificate struct if valid
     */
    function verifyCertificateByHash(string memory _certificateHash)
        external
        returns (Certificate memory)
    {
        uint256 certificateId = certificateHashToId[_certificateHash];
        require(certificateId > 0, "Certificate not found");
        
        return this.verifyCertificate(certificateId);
    }

    /**
     * @dev Revoke a certificate
     * @param _certificateId ID of the certificate to revoke
     */
    function revokeCertificate(uint256 _certificateId)
        external
        certificateExists(_certificateId)
        onlyRegisteredInstitution
    {
        Certificate storage cert = certificates[_certificateId];
        require(cert.institution == msg.sender, "Only issuing institution can revoke");
        require(cert.isValid, "Certificate already revoked");

        cert.isValid = false;
    }

    /**
     * @dev Set institution status (active/inactive)
     * @param _institution Address of the institution
     * @param _isActive New status
     */
    function setInstitutionStatus(address _institution, bool _isActive) external onlyOwner {
        require(institutions[_institution].isRegistered, "Institution not registered");
        institutions[_institution].isActive = _isActive;
        emit InstitutionStatusChanged(_institution, _isActive);
    }

    /**
     * @dev Get all certificates for a recipient
     * @param _recipient Address of the recipient
     * @return Array of certificate IDs
     */
    function getRecipientCertificates(address _recipient) external view returns (uint256[] memory) {
        return recipientCertificates[_recipient];
    }

    /**
     * @dev Get all certificates issued by an institution
     * @param _institution Address of the institution
     * @return Array of certificate IDs
     */
    function getInstitutionCertificates(address _institution) external view returns (uint256[] memory) {
        return institutionCertificates[_institution];
    }

    /**
     * @dev Get total number of certificates issued
     * @return Total certificate count
     */
    function getTotalCertificates() external view returns (uint256) {
        return _certificateIds.current();
    }

    /**
     * @dev Check if an address is a registered and active institution
     * @param _institution Address to check
     * @return Boolean indicating if institution is registered and active
     */
    function isValidInstitution(address _institution) external view returns (bool) {
        return institutions[_institution].isRegistered && institutions[_institution].isActive;
    }
}