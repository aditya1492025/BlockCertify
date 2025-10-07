const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    address: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    role: {
        type: String,
        enum: ['admin', 'institution', 'verifier', 'student'],
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    profile: {
        phone: String,
        organization: String,
        department: String,
        position: String,
        bio: String,
        avatar: String
    },
    preferences: {
        notifications: {
            email: { type: Boolean, default: true },
            browser: { type: Boolean, default: true }
        },
        theme: { type: String, default: 'light' },
        language: { type: String, default: 'en' }
    },
    verification: {
        isEmailVerified: { type: Boolean, default: false },
        emailVerificationToken: String,
        passwordResetToken: String,
        passwordResetExpires: Date
    }
}, {
    timestamps: true
});

// Index for efficient queries
userSchema.index({ address: 1 });
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
    return this.name;
});

// Method to check if user has specific role
userSchema.methods.hasRole = function(role) {
    return this.role === role;
};

// Method to get public profile
userSchema.methods.getPublicProfile = function() {
    return {
        _id: this._id,
        address: this.address,
        name: this.name,
        role: this.role,
        profile: {
            organization: this.profile?.organization,
            department: this.profile?.department,
            position: this.profile?.position,
            avatar: this.profile?.avatar
        },
        isActive: this.isActive,
        createdAt: this.createdAt
    };
};

module.exports = mongoose.model('User', userSchema);