const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CertificateRegistry", function () {
    let CertificateRegistry;
    let certificateRegistry;
    let owner;
    let institution;
    let student;
    let verifier;

    beforeEach(async function () {
        // Get signers
        [owner, institution, student, verifier] = await ethers.getSigners();

        // Deploy CertificateRegistry contract
        CertificateRegistry = await ethers.getContractFactory("CertificateRegistry");
        certificateRegistry = await CertificateRegistry.deploy();
        await certificateRegistry.deployed();
    });

    describe("Institution Management", function () {
        it("Should register an institution", async function () {
            await certificateRegistry.registerInstitution(
                institution.address,
                "Test University",
                "TU123456"
            );

            const institutionData = await certificateRegistry.institutions(institution.address);
            expect(institutionData.name).to.equal("Test University");
            expect(institutionData.registrationNumber).to.equal("TU123456");
            expect(institutionData.isActive).to.be.true;
            expect(institutionData.isRegistered).to.be.true;
        });

        it("Should not allow non-owner to register institution", async function () {
            await expect(
                certificateRegistry.connect(institution).registerInstitution(
                    institution.address,
                    "Test University",
                    "TU123456"
                )
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should not register institution with empty name", async function () {
            await expect(
                certificateRegistry.registerInstitution(
                    institution.address,
                    "",
                    "TU123456"
                )
            ).to.be.revertedWith("Institution name required");
        });
    });

    describe("Certificate Issuance", function () {
        beforeEach(async function () {
            // Register institution first
            await certificateRegistry.registerInstitution(
                institution.address,
                "Test University",
                "TU123456"
            );
        });

        it("Should issue a certificate", async function () {
            const certificateHash = "QmTest123";
            const metadataHash = "QmMeta456";
            
            await certificateRegistry.connect(institution).issueCertificate(
                student.address,
                certificateHash,
                metadataHash,
                "Bachelor's Degree",
                "Computer Science",
                "A"
            );

            const certificate = await certificateRegistry.certificates(1);
            expect(certificate.institution).to.equal(institution.address);
            expect(certificate.recipient).to.equal(student.address);
            expect(certificate.certificateHash).to.equal(certificateHash);
            expect(certificate.isValid).to.be.true;
        });

        it("Should not allow unregistered institution to issue certificate", async function () {
            await expect(
                certificateRegistry.connect(verifier).issueCertificate(
                    student.address,
                    "QmTest123",
                    "QmMeta456",
                    "Bachelor's Degree",
                    "Computer Science",
                    "A"
                )
            ).to.be.revertedWith("Not a registered or active institution");
        });

        it("Should not allow duplicate certificate hash", async function () {
            const certificateHash = "QmTest123";
            
            await certificateRegistry.connect(institution).issueCertificate(
                student.address,
                certificateHash,
                "QmMeta456",
                "Bachelor's Degree",
                "Computer Science",
                "A"
            );

            await expect(
                certificateRegistry.connect(institution).issueCertificate(
                    student.address,
                    certificateHash,
                    "QmMeta789",
                    "Master's Degree",
                    "Computer Science",
                    "A"
                )
            ).to.be.revertedWith("Certificate hash already exists");
        });
    });

    describe("Certificate Verification", function () {
        beforeEach(async function () {
            // Register institution and issue certificate
            await certificateRegistry.registerInstitution(
                institution.address,
                "Test University",
                "TU123456"
            );

            await certificateRegistry.connect(institution).issueCertificate(
                student.address,
                "QmTest123",
                "QmMeta456",
                "Bachelor's Degree",
                "Computer Science",
                "A"
            );
        });

        it("Should verify a valid certificate by ID", async function () {
            const certificate = await certificateRegistry.connect(verifier).verifyCertificate(1);
            expect(certificate.institution).to.equal(institution.address);
            expect(certificate.recipient).to.equal(student.address);
            expect(certificate.isValid).to.be.true;
        });

        it("Should verify a valid certificate by hash", async function () {
            const certificate = await certificateRegistry.connect(verifier).verifyCertificateByHash("QmTest123");
            expect(certificate.institution).to.equal(institution.address);
            expect(certificate.recipient).to.equal(student.address);
            expect(certificate.isValid).to.be.true;
        });

        it("Should not verify non-existent certificate", async function () {
            await expect(
                certificateRegistry.connect(verifier).verifyCertificate(999)
            ).to.be.revertedWith("Certificate does not exist");
        });
    });

    describe("Certificate Revocation", function () {
        beforeEach(async function () {
            // Register institution and issue certificate
            await certificateRegistry.registerInstitution(
                institution.address,
                "Test University",
                "TU123456"
            );

            await certificateRegistry.connect(institution).issueCertificate(
                student.address,
                "QmTest123",
                "QmMeta456",
                "Bachelor's Degree",
                "Computer Science",
                "A"
            );
        });

        it("Should allow institution to revoke their certificate", async function () {
            await certificateRegistry.connect(institution).revokeCertificate(1);
            
            const certificate = await certificateRegistry.certificates(1);
            expect(certificate.isValid).to.be.false;
        });

        it("Should not allow non-issuing institution to revoke certificate", async function () {
            await expect(
                certificateRegistry.connect(verifier).revokeCertificate(1)
            ).to.be.revertedWith("Not a registered or active institution");
        });
    });

    describe("Utility Functions", function () {
        beforeEach(async function () {
            // Register institution and issue certificates
            await certificateRegistry.registerInstitution(
                institution.address,
                "Test University",
                "TU123456"
            );

            await certificateRegistry.connect(institution).issueCertificate(
                student.address,
                "QmTest123",
                "QmMeta456",
                "Bachelor's Degree",
                "Computer Science",
                "A"
            );

            await certificateRegistry.connect(institution).issueCertificate(
                student.address,
                "QmTest456",
                "QmMeta789",
                "Master's Degree",
                "Computer Science",
                "A+"
            );
        });

        it("Should get recipient certificates", async function () {
            const certificates = await certificateRegistry.getRecipientCertificates(student.address);
            expect(certificates.length).to.equal(2);
            expect(certificates[0]).to.equal(1);
            expect(certificates[1]).to.equal(2);
        });

        it("Should get institution certificates", async function () {
            const certificates = await certificateRegistry.getInstitutionCertificates(institution.address);
            expect(certificates.length).to.equal(2);
        });

        it("Should get total certificates count", async function () {
            const total = await certificateRegistry.getTotalCertificates();
            expect(total).to.equal(2);
        });

        it("Should check if institution is valid", async function () {
            const isValid = await certificateRegistry.isValidInstitution(institution.address);
            expect(isValid).to.be.true;

            const isInvalid = await certificateRegistry.isValidInstitution(verifier.address);
            expect(isInvalid).to.be.false;
        });
    });
});