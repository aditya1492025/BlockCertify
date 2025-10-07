const express = require('express');
const router = express.Router();
const Certificate = require('../models/Certificate');
const { body, validationResult } = require('express-validator');

// @route   GET /api/certificates
// @desc    Get all certificates with pagination
// @access  Public
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = {};
        
        // Filter by status
        if (req.query.status) {
            query.status = req.query.status;
        }
        
        // Filter by type
        if (req.query.type) {
            query['certificate.type'] = req.query.type;
        }
        
        // Filter by institution
        if (req.query.institution) {
            query['institution.address'] = req.query.institution.toLowerCase();
        }
        
        // Filter by recipient
        if (req.query.recipient) {
            query['recipient.address'] = req.query.recipient.toLowerCase();
        }

        const certificates = await Certificate.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Certificate.countDocuments(query);

        res.json({
            certificates,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total,
                limit
            }
        });
    } catch (error) {
        console.error('Error fetching certificates:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET /api/certificates/:id
// @desc    Get certificate by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const certificate = await Certificate.findByCertificateId(req.params.id);
        
        if (!certificate) {
            return res.status(404).json({ error: 'Certificate not found' });
        }

        res.json(certificate);
    } catch (error) {
        console.error('Error fetching certificate:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET /api/certificates/hash/:hash
// @desc    Get certificate by hash
// @access  Public
router.get('/hash/:hash', async (req, res) => {
    try {
        const certificate = await Certificate.findByHash(req.params.hash);
        
        if (!certificate) {
            return res.status(404).json({ error: 'Certificate not found' });
        }

        res.json(certificate);
    } catch (error) {
        console.error('Error fetching certificate:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST /api/certificates/verify/:id
// @desc    Verify a certificate and record verification
// @access  Public
router.post('/verify/:id', [
    body('verifierAddress').isEthereumAddress().withMessage('Valid Ethereum address required'),
    body('verifierType').optional().isString()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const certificate = await Certificate.findByCertificateId(req.params.id);
        
        if (!certificate) {
            return res.status(404).json({ error: 'Certificate not found' });
        }

        if (!certificate.isValidCertificate()) {
            return res.status(400).json({ error: 'Certificate is not valid or has been revoked' });
        }

        // Record the verification
        await certificate.recordVerification(
            req.body.verifierAddress,
            req.body.verifierType || 'web'
        );

        res.json({
            message: 'Certificate verified successfully',
            certificate: {
                id: certificate.certificateId,
                isValid: certificate.verification.isValid,
                status: certificate.status,
                institution: certificate.institution,
                recipient: certificate.recipient,
                certificate: certificate.certificate,
                verificationCount: certificate.verification.verificationCount,
                lastVerifiedAt: certificate.verification.lastVerifiedAt
            }
        });
    } catch (error) {
        console.error('Error verifying certificate:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET /api/certificates/institution/:address
// @desc    Get certificates by institution address
// @access  Public
router.get('/institution/:address', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const certificates = await Certificate.findByInstitution(req.params.address)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Certificate.countDocuments({ 
            'institution.address': req.params.address.toLowerCase() 
        });

        res.json({
            certificates,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total,
                limit
            }
        });
    } catch (error) {
        console.error('Error fetching institution certificates:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET /api/certificates/recipient/:address
// @desc    Get certificates by recipient address
// @access  Public
router.get('/recipient/:address', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const certificates = await Certificate.findByRecipient(req.params.address)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Certificate.countDocuments({ 
            'recipient.address': req.params.address.toLowerCase() 
        });

        res.json({
            certificates,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total,
                limit
            }
        });
    } catch (error) {
        console.error('Error fetching recipient certificates:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET /api/certificates/stats/overview
// @desc    Get certificate statistics
// @access  Public
router.get('/stats/overview', async (req, res) => {
    try {
        const totalCertificates = await Certificate.countDocuments();
        const validCertificates = await Certificate.countDocuments({ status: 'issued' });
        const revokedCertificates = await Certificate.countDocuments({ status: 'revoked' });
        
        const recentCertificates = await Certificate.countDocuments({
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
        });

        const verificationStats = await Certificate.aggregate([
            {
                $group: {
                    _id: null,
                    totalVerifications: { $sum: '$verification.verificationCount' },
                    avgVerifications: { $avg: '$verification.verificationCount' }
                }
            }
        ]);

        const typeStats = await Certificate.aggregate([
            {
                $group: {
                    _id: '$certificate.type',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            overview: {
                totalCertificates,
                validCertificates,
                revokedCertificates,
                recentCertificates
            },
            verifications: verificationStats[0] || { totalVerifications: 0, avgVerifications: 0 },
            typeDistribution: typeStats
        });
    } catch (error) {
        console.error('Error fetching certificate stats:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;