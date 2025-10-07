const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

// In-memory user storage (for demo purposes)
let users = [];
let userIdCounter = 1;

// Mock User class for in-memory storage
class InMemoryUser {
    constructor(data) {
        this.id = userIdCounter++;
        this.address = data.address;
        this.email = data.email.toLowerCase();
        this.name = data.name;
        this.role = data.role;
        this.password = data.password; // In real app, this should be hashed
        this.profile = data.profile || {};
        this.isActive = true;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    getPublicProfile() {
        return {
            id: this.id,
            address: this.address,
            email: this.email,
            name: this.name,
            role: this.role,
            profile: this.profile,
            isActive: this.isActive,
            createdAt: this.createdAt
        };
    }

    static findOne(query) {
        if (query.$or) {
            return users.find(user => 
                query.$or.some(condition => 
                    Object.keys(condition).every(key => 
                        user[key] === condition[key]
                    )
                )
            );
        }
        return users.find(user => 
            Object.keys(query).every(key => user[key] === query[key])
        );
    }

    save() {
        const existingIndex = users.findIndex(u => u.id === this.id);
        if (existingIndex >= 0) {
            users[existingIndex] = this;
        } else {
            users.push(this);
        }
        return Promise.resolve(this);
    }
}

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', [
    body('email').isEmail().withMessage('Valid email required'),
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['institution', 'verifier', 'student']).withMessage('Valid role required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, name, password, role, profile } = req.body;

        // Check if user already exists
        let user = InMemoryUser.findOne({ 
            email: email.toLowerCase()
        });

        if (user) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }

        // Create new user with a mock address
        const mockAddress = `0x${Math.random().toString(16).substr(2, 40)}`;
        user = new InMemoryUser({
            address: mockAddress,
            email: email.toLowerCase(),
            name,
            role,
            password, // In real app, this should be hashed
            profile: profile || {}
        });

        await user.save();

        // Generate JWT token
        const payload = {
            user: {
                id: user.id,
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
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 1 }).withMessage('Password required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Check if user exists
        const user = InMemoryUser.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // In real app, compare hashed password
        if (user.password !== password) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        if (!user.isActive) {
            return res.status(400).json({ error: 'Account is deactivated' });
        }

        // Generate JWT token
        const payload = {
            user: {
                id: user.id,
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
router.get('/me', async (req, res) => {
    try {
        // This would normally use auth middleware to get user from token
        res.json({ message: 'User profile endpoint - requires auth middleware' });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET /api/auth/users
// @desc    Get all users (for demo)
// @access  Public
router.get('/users', (req, res) => {
    try {
        const publicUsers = users.map(user => user.getPublicProfile());
        res.json(publicUsers);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;