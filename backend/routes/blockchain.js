const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const blockchainService = require('../services/blockchainService');
const { auth, authorize } = require('../middleware/auth');

// @route   GET /api/blockchain/network
// @desc    Get blockchain network information
// @access  Public
router.get('/network', async (req, res) => {
    try {
        const networkInfo = await blockchainService.getNetworkInfo();
        res.json(networkInfo);
    } catch (error) {
        console.error('Error fetching network info:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET /api/blockchain/stats
// @desc    Get blockchain statistics
// @access  Public
router.get('/stats', async (req, res) => {
    try {
        const totalCertificates = await blockchainService.getTotalCertificates();
        const networkInfo = await blockchainService.getNetworkInfo();

        res.json({
            totalCertificates,
            network: networkInfo,
            contractStatus: 'connected'
        });
    } catch (error) {
        console.error('Error fetching blockchain stats:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET /api/blockchain/transaction/:hash
// @desc    Get transaction details
// @access  Public
router.get('/transaction/:hash', async (req, res) => {
    try {
        const { hash } = req.params;
        
        if (!/^0x[a-fA-F0-9]{64}$/.test(hash)) {
            return res.status(400).json({ error: 'Invalid transaction hash format' });
        }

        const receipt = await blockchainService.getTransactionReceipt(hash);
        
        if (!receipt) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        res.json({
            transactionHash: receipt.transactionHash,
            blockNumber: receipt.blockNumber,
            blockHash: receipt.blockHash,
            from: receipt.from,
            to: receipt.to,
            gasUsed: receipt.gasUsed.toNumber(),
            effectiveGasPrice: receipt.effectiveGasPrice?.toString(),
            status: receipt.status,
            confirmations: receipt.confirmations,
            events: receipt.events || []
        });
    } catch (error) {
        console.error('Error fetching transaction:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST /api/blockchain/verify-certificate
// @desc    Verify certificate on blockchain
// @access  Public
router.post('/verify-certificate', [
    body('certificateId').optional().isInt({ min: 1 }).withMessage('Valid certificate ID required'),
    body('certificateHash').optional().isString().withMessage('Valid certificate hash required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { certificateId, certificateHash } = req.body;

        if (!certificateId && !certificateHash) {
            return res.status(400).json({ error: 'Either certificateId or certificateHash is required' });
        }

        let result;
        
        if (certificateId) {
            result = await blockchainService.verifyCertificate(certificateId);
        } else {
            result = await blockchainService.verifyCertificateByHash(certificateHash);
        }

        res.json({
            verified: true,
            certificate: result.certificate
        });

    } catch (error) {
        console.error('Error verifying certificate on blockchain:', error);
        
        if (error.message.includes('Certificate does not exist') || 
            error.message.includes('Certificate not found')) {
            return res.status(404).json({ 
                verified: false, 
                error: 'Certificate not found on blockchain' 
            });
        }
        
        if (error.message.includes('not valid') || error.message.includes('revoked')) {
            return res.status(400).json({ 
                verified: false, 
                error: 'Certificate is not valid or has been revoked' 
            });
        }

        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST /api/blockchain/revoke-certificate
// @desc    Revoke certificate on blockchain
// @access  Private (Institution only)
router.post('/revoke-certificate', [
    auth,
    authorize('institution'),
    body('certificateId').isInt({ min: 1 }).withMessage('Valid certificate ID required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { certificateId } = req.body;

        // First verify the certificate to check ownership
        const certificate = await blockchainService.verifyCertificate(certificateId);
        
        if (certificate.certificate.institution.toLowerCase() !== req.user.address.toLowerCase()) {
            return res.status(403).json({ error: 'Can only revoke certificates issued by your institution' });
        }

        // Revoke on blockchain
        const result = await blockchainService.revokeCertificate(certificateId);

        // Update database
        const Certificate = require('../models/Certificate');
        await Certificate.findOneAndUpdate(
            { certificateId: certificateId },
            { 
                status: 'revoked',
                'verification.isValid': false
            }
        );

        res.json({
            message: 'Certificate revoked successfully',
            transaction: result
        });

    } catch (error) {
        console.error('Error revoking certificate:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET /api/blockchain/address/:address/certificates
// @desc    Get certificates for an address from blockchain
// @access  Public
router.get('/address/:address/certificates', async (req, res) => {
    try {
        const { address } = req.params;
        const { type } = req.query; // 'recipient' or 'institution'

        if (!blockchainService.isValidAddress(address)) {
            return res.status(400).json({ error: 'Invalid Ethereum address' });
        }

        let certificateIds;
        
        if (type === 'institution') {
            certificateIds = await blockchainService.getInstitutionCertificates(address);
        } else {
            certificateIds = await blockchainService.getRecipientCertificates(address);
        }

        // Get details for each certificate
        const certificates = [];
        for (const id of certificateIds) {
            try {
                const result = await blockchainService.verifyCertificate(id);
                certificates.push(result.certificate);
            } catch (error) {
                console.warn(`Could not fetch certificate ${id}:`, error.message);
            }
        }

        res.json({
            address,
            type: type || 'recipient',
            certificateCount: certificateIds.length,
            certificates
        });

    } catch (error) {
        console.error('Error fetching address certificates:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST /api/blockchain/validate-address
// @desc    Validate Ethereum address
// @access  Public
router.post('/validate-address', [
    body('address').isString().withMessage('Address is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { address } = req.body;
        const isValid = blockchainService.isValidAddress(address);

        res.json({
            address,
            isValid,
            checksum: isValid ? address : null
        });

    } catch (error) {
        console.error('Error validating address:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST /api/blockchain/generate-hash
// @desc    Generate certificate hash for given data
// @access  Private
router.post('/generate-hash', [
    auth,
    body('certificateData').isObject().withMessage('Certificate data object required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { certificateData } = req.body;
        const hash = blockchainService.generateCertificateHash(certificateData);

        res.json({
            hash,
            data: certificateData
        });

    } catch (error) {
        console.error('Error generating hash:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET /api/blockchain/institution/:address/status
// @desc    Check institution status on blockchain
// @access  Public
router.get('/institution/:address/status', async (req, res) => {
    try {
        const { address } = req.params;

        if (!blockchainService.isValidAddress(address)) {
            return res.status(400).json({ error: 'Invalid Ethereum address' });
        }

        const isValid = await blockchainService.isValidInstitution(address);
        let institutionData = null;

        if (isValid) {
            try {
                institutionData = await blockchainService.getInstitution(address);
            } catch (error) {
                console.warn('Could not fetch institution data:', error.message);
            }
        }

        res.json({
            address,
            isRegistered: isValid,
            institution: institutionData
        });

    } catch (error) {
        console.error('Error checking institution status:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;