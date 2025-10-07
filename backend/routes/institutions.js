const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const blockchainService = require('../services/blockchainService');
const User = require('../models/User');

// @route   GET /api/institutions
// @desc    Get all institutions
// @access  Public
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const institutions = await User.find({ role: 'institution', isActive: true })
            .select('address name email profile createdAt')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await User.countDocuments({ role: 'institution', isActive: true });

        res.json({
            institutions,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total,
                limit
            }
        });
    } catch (error) {
        console.error('Error fetching institutions:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET /api/institutions/:address
// @desc    Get institution by address
// @access  Public
router.get('/:address', async (req, res) => {
    try {
        const institution = await User.findOne({ 
            address: req.params.address.toLowerCase(),
            role: 'institution' 
        }).select('address name email profile createdAt isActive');

        if (!institution) {
            return res.status(404).json({ error: 'Institution not found' });
        }

        // Get blockchain data
        let blockchainData = null;
        try {
            blockchainData = await blockchainService.getInstitution(req.params.address);
        } catch (error) {
            console.warn('Could not fetch blockchain data:', error.message);
        }

        res.json({
            institution,
            blockchain: blockchainData
        });
    } catch (error) {
        console.error('Error fetching institution:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST /api/institutions/register
// @desc    Register institution on blockchain
// @access  Private (Admin only)
router.post('/register', [
    auth,
    authorize('admin'),
    body('address').isEthereumAddress().withMessage('Valid Ethereum address required'),
    body('name').trim().isLength({ min: 2 }).withMessage('Institution name required'),
    body('registrationNumber').trim().isLength({ min: 1 }).withMessage('Registration number required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { address, name, registrationNumber } = req.body;

        // Check if institution exists in database
        const existingInstitution = await User.findOne({ 
            address: address.toLowerCase(),
            role: 'institution' 
        });

        if (!existingInstitution) {
            return res.status(404).json({ error: 'Institution not found in database. Please register as user first.' });
        }

        // Register on blockchain
        const result = await blockchainService.registerInstitution(
            address,
            name,
            registrationNumber
        );

        res.json({
            message: 'Institution registered on blockchain successfully',
            transaction: result
        });

    } catch (error) {
        console.error('Error registering institution:', error);
        if (error.message.includes('Institution already registered')) {
            return res.status(400).json({ error: 'Institution already registered on blockchain' });
        }
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET /api/institutions/:address/certificates
// @desc    Get certificates issued by institution
// @access  Public
router.get('/:address/certificates', async (req, res) => {
    try {
        const { address } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        // Get certificate IDs from blockchain
        const certificateIds = await blockchainService.getInstitutionCertificates(address);

        // Paginate the IDs
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedIds = certificateIds.slice(startIndex, endIndex);

        // Get certificate details for paginated IDs
        const certificates = [];
        for (const id of paginatedIds) {
            try {
                const result = await blockchainService.verifyCertificate(id);
                certificates.push(result.certificate);
            } catch (error) {
                console.warn(`Could not fetch certificate ${id}:`, error.message);
            }
        }

        res.json({
            certificates,
            pagination: {
                current: page,
                pages: Math.ceil(certificateIds.length / limit),
                total: certificateIds.length,
                limit
            }
        });

    } catch (error) {
        console.error('Error fetching institution certificates:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST /api/institutions/:address/certificates
// @desc    Issue certificate (institution only)
// @access  Private (Institution only)
router.post('/:address/certificates', [
    auth,
    authorize('institution'),
    body('recipientAddress').isEthereumAddress().withMessage('Valid recipient address required'),
    body('certificateType').isIn(['degree', 'diploma', 'certificate', 'transcript', 'other']).withMessage('Valid certificate type required'),
    body('courseName').trim().isLength({ min: 1 }).withMessage('Course name required'),
    body('grade').optional().isString(),
    body('recipientName').trim().isLength({ min: 1 }).withMessage('Recipient name required'),
    body('recipientEmail').optional().isEmail().withMessage('Valid email required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { address } = req.params;
        const { 
            recipientAddress, 
            certificateType, 
            courseName, 
            grade,
            recipientName,
            recipientEmail,
            description 
        } = req.body;

        // Verify the requesting user is the institution
        if (req.user.address.toLowerCase() !== address.toLowerCase()) {
            return res.status(403).json({ error: 'Can only issue certificates for your own institution' });
        }

        // Generate certificate data and hash
        const certificateData = {
            institution: address,
            recipient: recipientAddress,
            certificateType,
            courseName,
            grade: grade || '',
            issuedAt: new Date().toISOString(),
            recipientName,
            recipientEmail
        };

        const certificateHash = blockchainService.generateCertificateHash(certificateData);
        const metadataHash = blockchainService.generateCertificateHash({ description, ...certificateData });

        // Issue on blockchain
        const blockchainResult = await blockchainService.issueCertificate(
            recipientAddress,
            certificateHash,
            metadataHash,
            certificateType,
            courseName,
            grade || ''
        );

        // Save to database
        const Certificate = require('../models/Certificate');
        const certificate = new Certificate({
            certificateId: blockchainResult.certificateId,
            transactionHash: blockchainResult.transactionHash,
            blockNumber: blockchainResult.blockNumber,
            institution: {
                address: address.toLowerCase(),
                name: req.user.name || 'Unknown Institution'
            },
            recipient: {
                address: recipientAddress.toLowerCase(),
                name: recipientName,
                email: recipientEmail
            },
            certificate: {
                hash: certificateHash,
                metadataHash: metadataHash,
                type: certificateType,
                courseName,
                grade: grade || '',
                description
            },
            blockchain: {
                network: 'ethereum',
                contractAddress: process.env.CONTRACT_ADDRESS,
                gasUsed: blockchainResult.gasUsed,
                gasPrice: blockchainResult.gasPrice
            }
        });

        await certificate.save();

        res.status(201).json({
            message: 'Certificate issued successfully',
            certificate: {
                id: blockchainResult.certificateId,
                hash: certificateHash,
                transactionHash: blockchainResult.transactionHash
            },
            blockchain: blockchainResult
        });

    } catch (error) {
        console.error('Error issuing certificate:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET /api/institutions/:address/stats
// @desc    Get institution statistics
// @access  Private (Institution only)
router.get('/:address/stats', auth, async (req, res) => {
    try {
        const { address } = req.params;

        // Verify access
        if (req.user.role !== 'admin' && req.user.address.toLowerCase() !== address.toLowerCase()) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const Certificate = require('../models/Certificate');

        // Get statistics
        const totalCertificates = await Certificate.countDocuments({ 
            'institution.address': address.toLowerCase() 
        });

        const validCertificates = await Certificate.countDocuments({ 
            'institution.address': address.toLowerCase(),
            status: 'issued'
        });

        const revokedCertificates = await Certificate.countDocuments({ 
            'institution.address': address.toLowerCase(),
            status: 'revoked'
        });

        const recentCertificates = await Certificate.countDocuments({
            'institution.address': address.toLowerCase(),
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        });

        const totalVerifications = await Certificate.aggregate([
            { $match: { 'institution.address': address.toLowerCase() } },
            { $group: { _id: null, total: { $sum: '$verification.verificationCount' } } }
        ]);

        const typeStats = await Certificate.aggregate([
            { $match: { 'institution.address': address.toLowerCase() } },
            { $group: { _id: '$certificate.type', count: { $sum: 1 } } }
        ]);

        res.json({
            overview: {
                totalCertificates,
                validCertificates,
                revokedCertificates,
                recentCertificates
            },
            verifications: {
                total: totalVerifications[0]?.total || 0
            },
            typeDistribution: typeStats
        });

    } catch (error) {
        console.error('Error fetching institution stats:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;