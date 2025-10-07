const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    // Get token from header
    const token = req.header('x-auth-token') || req.header('Authorization')?.replace('Bearer ', '');

    // Check if no token
    if (!token) {
        return res.status(401).json({ error: 'No token, authorization denied' });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        
        // Check if user still exists and is active
        const user = await User.findById(decoded.user.id);
        if (!user || !user.isActive) {
            return res.status(401).json({ error: 'Token is not valid or user is deactivated' });
        }

        req.user = decoded.user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ error: 'Token is not valid' });
    }
};

// Role-based middleware
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Access denied. No user context.' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: `Access denied. Required role: ${roles.join(' or ')}` });
        }

        next();
    };
};

module.exports = { auth, authorize };