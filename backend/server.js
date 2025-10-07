const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) * 60 * 1000 || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(limiter);
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database connection
const connectDB = async () => {
    try {
        if (process.env.MONGODB_URI) {
            const conn = await mongoose.connect(process.env.MONGODB_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
            console.log(`MongoDB Connected: ${conn.connection.host}`);
        } else {
            console.log('MongoDB URI not provided, running without database');
            console.log('Note: Data will not be persisted');
        }
    } catch (error) {
        console.warn('Database connection failed, continuing without persistence:', error.message);
    }
};

connectDB();

// Routes
if (process.env.MONGODB_URI) {
    // Use regular auth routes with database
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/certificates', require('./routes/certificates'));
} else {
    // Use in-memory routes for demo
    app.use('/api/auth', require('./routes/auth-memory'));
    app.use('/api/certificates', require('./routes/certificates-memory'));
}
app.use('/api/institutions', require('./routes/institutions'));
app.use('/api/users', require('./routes/users'));
app.use('/api/blockchain', require('./routes/blockchain'));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation Error',
            message: err.message,
            details: err.errors
        });
    }
    
    if (err.name === 'CastError') {
        return res.status(400).json({
            error: 'Invalid ID format',
            message: 'The provided ID is not valid'
        });
    }
    
    if (err.code === 11000) {
        return res.status(400).json({
            error: 'Duplicate Error',
            message: 'Resource already exists'
        });
    }
    
    res.status(err.status || 500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: 'Route not found'
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});