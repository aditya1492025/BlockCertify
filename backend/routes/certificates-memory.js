const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

// In-memory certificate storage
let certificates = [];
let certificateIdCounter = 1;

// Mock Certificate class
class InMemoryCertificate {
    constructor(data) {
        this.id = `CERT-${certificateIdCounter.toString().padStart(6, '0')}`;
        certificateIdCounter++;
        this.recipientName = data.recipientName;
        this.recipientEmail = data.recipientEmail;
        this.courseName = data.courseName;
        this.courseCode = data.courseCode;
        this.grade = data.grade || null;
        this.completionDate = data.completionDate;
        this.description = data.description || '';
        this.institutionName = data.institutionName;
        this.issuerName = data.issuerName;
        this.certificateType = data.certificateType;
        this.issuedDate = new Date();
        this.status = 'active';
        this.verificationHash = this.generateHash();
    }

    generateHash() {
        // Simple hash generation for demo
        const str = `${this.recipientName}${this.courseName}${this.institutionName}${this.completionDate}`;
        return Buffer.from(str).toString('base64').substr(0, 16);
    }

    getPublicInfo() {
        return {
            id: this.id,
            recipientName: this.recipientName,
            recipientEmail: this.recipientEmail,
            courseName: this.courseName,
            courseCode: this.courseCode,
            grade: this.grade,
            completionDate: this.completionDate,
            description: this.description,
            institutionName: this.institutionName,
            issuerName: this.issuerName,
            certificateType: this.certificateType,
            issuedDate: this.issuedDate,
            status: this.status,
            verificationHash: this.verificationHash
        };
    }

    static findById(id) {
        return certificates.find(cert => cert.id === id);
    }

    static findAll() {
        return certificates;
    }

    save() {
        const existingIndex = certificates.findIndex(c => c.id === this.id);
        if (existingIndex >= 0) {
            certificates[existingIndex] = this;
        } else {
            certificates.push(this);
        }
        return Promise.resolve(this);
    }
}

// @route   POST /api/certificates/upload
// @desc    Upload a new certificate
// @access  Public (should be protected for institutions only)
router.post('/upload', [
    body('recipientName').trim().isLength({ min: 2 }).withMessage('Recipient name is required'),
    body('recipientEmail').isEmail().withMessage('Valid email is required'),
    body('courseName').trim().isLength({ min: 2 }).withMessage('Course name is required'),
    body('courseCode').trim().isLength({ min: 1 }).withMessage('Course code is required'),
    body('completionDate').isISO8601().withMessage('Valid completion date is required'),
    body('institutionName').trim().isLength({ min: 2 }).withMessage('Institution name is required'),
    body('issuerName').trim().isLength({ min: 2 }).withMessage('Issuer name is required'),
    body('certificateType').isIn(['completion', 'achievement', 'degree', 'diploma', 'certification']).withMessage('Valid certificate type is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const certificateData = req.body;

        // Create new certificate
        const certificate = new InMemoryCertificate(certificateData);
        await certificate.save();

        res.status(201).json({
            message: 'Certificate uploaded successfully',
            certificate: certificate.getPublicInfo()
        });

    } catch (error) {
        console.error('Certificate upload error:', error);
        res.status(500).json({ error: 'Server error while uploading certificate' });
    }
});

// @route   GET /api/certificates/verify/:id
// @desc    Verify a certificate by ID
// @access  Public
router.get('/verify/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const certificate = InMemoryCertificate.findById(id);

        if (!certificate) {
            return res.status(404).json({ 
                error: 'Certificate not found',
                verified: false 
            });
        }

        if (certificate.status !== 'active') {
            return res.status(400).json({ 
                error: 'Certificate is not active',
                verified: false 
            });
        }

        res.json({
            verified: true,
            certificate: certificate.getPublicInfo(),
            message: 'Certificate is valid and verified'
        });

    } catch (error) {
        console.error('Certificate verification error:', error);
        res.status(500).json({ error: 'Server error during verification' });
    }
});

// @route   GET /api/certificates
// @desc    Get all certificates
// @access  Public
router.get('/', async (req, res) => {
    try {
        const allCertificates = InMemoryCertificate.findAll();
        const publicCertificates = allCertificates.map(cert => cert.getPublicInfo());
        
        res.json({
            certificates: publicCertificates,
            total: publicCertificates.length
        });

    } catch (error) {
        console.error('Get certificates error:', error);
        res.status(500).json({ error: 'Server error while fetching certificates' });
    }
});

// @route   GET /api/certificates/search
// @desc    Search certificates by recipient name or email
// @access  Public
router.get('/search', async (req, res) => {
    try {
        const { query } = req.query;
        
        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        const allCertificates = InMemoryCertificate.findAll();
        const filteredCertificates = allCertificates.filter(cert => 
            cert.recipientName.toLowerCase().includes(query.toLowerCase()) ||
            cert.recipientEmail.toLowerCase().includes(query.toLowerCase()) ||
            cert.courseName.toLowerCase().includes(query.toLowerCase()) ||
            cert.institutionName.toLowerCase().includes(query.toLowerCase())
        );

        const publicCertificates = filteredCertificates.map(cert => cert.getPublicInfo());
        
        res.json({
            certificates: publicCertificates,
            total: publicCertificates.length,
            query: query
        });

    } catch (error) {
        console.error('Certificate search error:', error);
        res.status(500).json({ error: 'Server error during search' });
    }
});

// @route   DELETE /api/certificates/:id
// @desc    Revoke a certificate
// @access  Protected (should be institution only)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const certificate = InMemoryCertificate.findById(id);

        if (!certificate) {
            return res.status(404).json({ error: 'Certificate not found' });
        }

        certificate.status = 'revoked';
        await certificate.save();

        res.json({
            message: 'Certificate revoked successfully',
            certificate: certificate.getPublicInfo()
        });

    } catch (error) {
        console.error('Certificate revocation error:', error);
        res.status(500).json({ error: 'Server error during revocation' });
    }
});

module.exports = router;