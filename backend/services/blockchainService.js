const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

class BlockchainService {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.certificateRegistry = null;
        this.userManagement = null;
        this.network = process.env.NETWORK || 'localhost';
        this.contractAddress = process.env.CONTRACT_ADDRESS;
        
        this.init();
    }

    async init() {
        try {
            // Initialize provider based on network
            if (this.network === 'localhost') {
                this.provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
            } else if (this.network === 'goerli') {
                this.provider = new ethers.providers.InfuraProvider('goerli', process.env.INFURA_PROJECT_ID);
            } else if (this.network === 'sepolia') {
                this.provider = new ethers.providers.InfuraProvider('sepolia', process.env.INFURA_PROJECT_ID);
            }

            // Initialize signer
            if (process.env.PRIVATE_KEY) {
                this.signer = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
            }

            // Load contract ABIs and addresses
            await this.loadContracts();

            console.log(`Blockchain service initialized on ${this.network}`);
        } catch (error) {
            console.error('Error initializing blockchain service:', error);
        }
    }

    async loadContracts() {
        try {
            // Load deployment info
            const deploymentPath = path.join(__dirname, '..', '..', 'deployments', `${this.network}.json`);
            
            if (fs.existsSync(deploymentPath)) {
                const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
                
                // Load CertificateRegistry
                const certificateABI = require('../contracts/CertificateRegistry.json');
                this.certificateRegistry = new ethers.Contract(
                    deploymentInfo.contracts.CertificateRegistry.address,
                    certificateABI.abi,
                    this.signer || this.provider
                );

                // Load UserManagement
                const userManagementABI = require('../contracts/UserManagement.json');
                this.userManagement = new ethers.Contract(
                    deploymentInfo.contracts.UserManagement.address,
                    userManagementABI.abi,
                    this.signer || this.provider
                );

                console.log('Smart contracts loaded successfully');
            } else {
                console.warn('Deployment file not found. Please deploy contracts first.');
            }
        } catch (error) {
            console.error('Error loading contracts:', error);
        }
    }

    // Certificate Registry Methods
    async issueCertificate(recipientAddress, certificateHash, metadataHash, certificateType, courseName, grade) {
        try {
            if (!this.certificateRegistry || !this.signer) {
                throw new Error('Contract not initialized or no signer available');
            }

            const tx = await this.certificateRegistry.issueCertificate(
                recipientAddress,
                certificateHash,
                metadataHash,
                certificateType,
                courseName,
                grade
            );

            const receipt = await tx.wait();
            
            // Extract certificate ID from events
            const event = receipt.events?.find(e => e.event === 'CertificateIssued');
            const certificateId = event?.args?.certificateId?.toNumber();

            return {
                success: true,
                transactionHash: receipt.transactionHash,
                blockNumber: receipt.blockNumber,
                certificateId,
                gasUsed: receipt.gasUsed.toNumber(),
                gasPrice: tx.gasPrice.toString()
            };
        } catch (error) {
            console.error('Error issuing certificate:', error);
            throw error;
        }
    }

    async verifyCertificate(certificateId) {
        try {
            if (!this.certificateRegistry) {
                throw new Error('Contract not initialized');
            }

            const certificate = await this.certificateRegistry.verifyCertificate(certificateId);
            
            return {
                success: true,
                certificate: {
                    id: certificate.id.toNumber(),
                    institution: certificate.institution,
                    recipient: certificate.recipient,
                    certificateHash: certificate.certificateHash,
                    metadataHash: certificate.metadataHash,
                    issuedAt: new Date(certificate.issuedAt.toNumber() * 1000),
                    isValid: certificate.isValid,
                    certificateType: certificate.certificateType,
                    courseName: certificate.courseName,
                    grade: certificate.grade
                }
            };
        } catch (error) {
            console.error('Error verifying certificate:', error);
            throw error;
        }
    }

    async verifyCertificateByHash(certificateHash) {
        try {
            if (!this.certificateRegistry) {
                throw new Error('Contract not initialized');
            }

            const certificate = await this.certificateRegistry.verifyCertificateByHash(certificateHash);
            
            return {
                success: true,
                certificate: {
                    id: certificate.id.toNumber(),
                    institution: certificate.institution,
                    recipient: certificate.recipient,
                    certificateHash: certificate.certificateHash,
                    metadataHash: certificate.metadataHash,
                    issuedAt: new Date(certificate.issuedAt.toNumber() * 1000),
                    isValid: certificate.isValid,
                    certificateType: certificate.certificateType,
                    courseName: certificate.courseName,
                    grade: certificate.grade
                }
            };
        } catch (error) {
            console.error('Error verifying certificate by hash:', error);
            throw error;
        }
    }

    async revokeCertificate(certificateId) {
        try {
            if (!this.certificateRegistry || !this.signer) {
                throw new Error('Contract not initialized or no signer available');
            }

            const tx = await this.certificateRegistry.revokeCertificate(certificateId);
            const receipt = await tx.wait();

            return {
                success: true,
                transactionHash: receipt.transactionHash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toNumber()
            };
        } catch (error) {
            console.error('Error revoking certificate:', error);
            throw error;
        }
    }

    async getRecipientCertificates(recipientAddress) {
        try {
            if (!this.certificateRegistry) {
                throw new Error('Contract not initialized');
            }

            const certificateIds = await this.certificateRegistry.getRecipientCertificates(recipientAddress);
            return certificateIds.map(id => id.toNumber());
        } catch (error) {
            console.error('Error getting recipient certificates:', error);
            throw error;
        }
    }

    async getInstitutionCertificates(institutionAddress) {
        try {
            if (!this.certificateRegistry) {
                throw new Error('Contract not initialized');
            }

            const certificateIds = await this.certificateRegistry.getInstitutionCertificates(institutionAddress);
            return certificateIds.map(id => id.toNumber());
        } catch (error) {
            console.error('Error getting institution certificates:', error);
            throw error;
        }
    }

    async getTotalCertificates() {
        try {
            if (!this.certificateRegistry) {
                throw new Error('Contract not initialized');
            }

            const total = await this.certificateRegistry.getTotalCertificates();
            return total.toNumber();
        } catch (error) {
            console.error('Error getting total certificates:', error);
            throw error;
        }
    }

    // Institution Management Methods
    async registerInstitution(institutionAddress, name, registrationNumber) {
        try {
            if (!this.certificateRegistry || !this.signer) {
                throw new Error('Contract not initialized or no signer available');
            }

            const tx = await this.certificateRegistry.registerInstitution(
                institutionAddress,
                name,
                registrationNumber
            );

            const receipt = await tx.wait();

            return {
                success: true,
                transactionHash: receipt.transactionHash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toNumber()
            };
        } catch (error) {
            console.error('Error registering institution:', error);
            throw error;
        }
    }

    async isValidInstitution(institutionAddress) {
        try {
            if (!this.certificateRegistry) {
                throw new Error('Contract not initialized');
            }

            const isValid = await this.certificateRegistry.isValidInstitution(institutionAddress);
            return isValid;
        } catch (error) {
            console.error('Error checking institution validity:', error);
            throw error;
        }
    }

    async getInstitution(institutionAddress) {
        try {
            if (!this.certificateRegistry) {
                throw new Error('Contract not initialized');
            }

            const institution = await this.certificateRegistry.institutions(institutionAddress);
            return {
                name: institution.name,
                registrationNumber: institution.registrationNumber,
                isActive: institution.isActive,
                isRegistered: institution.isRegistered,
                registeredAt: new Date(institution.registeredAt.toNumber() * 1000)
            };
        } catch (error) {
            console.error('Error getting institution:', error);
            throw error;
        }
    }

    // Utility Methods
    async getNetworkInfo() {
        try {
            if (!this.provider) {
                throw new Error('Provider not initialized');
            }

            const network = await this.provider.getNetwork();
            const blockNumber = await this.provider.getBlockNumber();

            return {
                name: network.name,
                chainId: network.chainId,
                blockNumber
            };
        } catch (error) {
            console.error('Error getting network info:', error);
            throw error;
        }
    }

    async getTransactionReceipt(transactionHash) {
        try {
            if (!this.provider) {
                throw new Error('Provider not initialized');
            }

            const receipt = await this.provider.getTransactionReceipt(transactionHash);
            return receipt;
        } catch (error) {
            console.error('Error getting transaction receipt:', error);
            throw error;
        }
    }

    // Generate certificate hash
    generateCertificateHash(certificateData) {
        const dataString = JSON.stringify(certificateData);
        return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(dataString));
    }

    // Validate Ethereum address
    isValidAddress(address) {
        return ethers.utils.isAddress(address);
    }
}

module.exports = new BlockchainService();