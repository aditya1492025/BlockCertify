const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', [
    body('address').isEthereumAddress().withMessage('Valid Ethereum address required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('role').isIn(['institution', 'verifier', 'student']).withMessage('Valid role required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { address, email, name, role, profile } = req.body;

        // Check if user already exists
        let user = await User.findOne({ 
            $or: [{ address: address.toLowerCase() }, { email: email.toLowerCase() }] 
        });

        if (user) {
            return res.status(400).json({ error: 'User already exists with this address or email' });
        }

        // Create new user
        user = new User({
            address: address.toLowerCase(),
            email: email.toLowerCase(),
            name,
            role,
            profile: profile || {}
        });

        await user.save();

        // Generate JWT token
        const payload = {
            user: {
                id: user._id,
                address: user.address,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: process.env.JWT_EXPIRE || '7d' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    user: user.getPublicProfile()
                });
            }
        );

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST /api/auth/login
// @desc    Authenticate user
// @access  Public
router.post('/login', [
    body('address').isEthereumAddress().withMessage('Valid Ethereum address required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { address } = req.body;

        // Check if user exists
        const user = await User.findOne({ address: address.toLowerCase() });

        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }

        if (!user.isActive) {
            return res.status(400).json({ error: 'Account is deactivated' });
        }

        // Generate JWT token
        const payload = {
            user: {
                id: user._id,
                address: user.address,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: process.env.JWT_EXPIRE || '7d' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    user: user.getPublicProfile()
                });
            }
        );

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user.getPublicProfile());
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
    auth,
    body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').optional().isEmail().withMessage('Valid email required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update allowed fields
        const { name, email, profile, preferences } = req.body;
        
        if (name) user.name = name;
        if (email && email !== user.email) {
            // Check if email is already taken
            const existingUser = await User.findOne({ 
                email: email.toLowerCase(), 
                _id: { $ne: user._id } 
            });
            if (existingUser) {
                return res.status(400).json({ error: 'Email already in use' });
            }
            user.email = email.toLowerCase();
            user.verification.isEmailVerified = false; // Reset email verification
        }
        
        if (profile) {
            user.profile = { ...user.profile, ...profile };
        }
        
        if (preferences) {
            user.preferences = { ...user.preferences, ...preferences };
        }

        await user.save();

        res.json({
            message: 'Profile updated successfully',
            user: user.getPublicProfile()
        });

    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;