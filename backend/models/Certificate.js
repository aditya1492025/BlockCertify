const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
    certificateId: {
        type: Number,
        required: true,
        unique: true
    },
    transactionHash: {
        type: String,
        required: true,
        unique: true
    },
    blockNumber: {
        type: Number,
        required: true
    },
    institution: {
        address: {
            type: String,
            required: true,
            lowercase: true
        },
        name: {
            type: String,
            required: true
        },
        registrationNumber: String
    },
    recipient: {
        address: {
            type: String,
            required: true,
            lowercase: true
        },
        name: {
            type: String,
            required: true
        },
        email: String,
        studentId: String
    },
    certificate: {
        hash: {
            type: String,
            required: true,
            unique: true
        },
        metadataHash: String,
        type: {
            type: String,
            required: true,
            enum: ['degree', 'diploma', 'certificate', 'transcript', 'other']
        },
        courseName: {
            type: String,
            required: true
        },
        grade: String,
        completionDate: Date,
        description: String
    },
    blockchain: {
        network: {
            type: String,
            required: true,
            default: 'ethereum'
        },
        contractAddress: {
            type: String,
            required: true
        },
        gasUsed: Number,
        gasPrice: String
    },
    metadata: {
        ipfsHash: String,
        documentUrl: String,
        thumbnailUrl: String,
        fileSize: Number,
        mimeType: String,
        additionalData: mongoose.Schema.Types.Mixed
    },
    verification: {
        isValid: {
            type: Boolean,
            default: true
        },
        verificationCount: {
            type: Number,
            default: 0
        },
        lastVerifiedAt: Date,
        verifiedBy: [{
            address: String,
            verifiedAt: Date,
            verifierType: String
        }]
    },
    status: {
        type: String,
        enum: ['issued', 'revoked', 'suspended'],
        default: 'issued'
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
certificateSchema.index({ certificateId: 1 });
certificateSchema.index({ 'certificate.hash': 1 });
certificateSchema.index({ 'institution.address': 1 });
certificateSchema.index({ 'recipient.address': 1 });
certificateSchema.index({ transactionHash: 1 });
certificateSchema.index({ status: 1 });
certificateSchema.index({ 'certificate.type': 1 });
certificateSchema.index({ createdAt: -1 });

// Virtual for certificate age
certificateSchema.virtual('age').get(function() {
    return Date.now() - this.createdAt.getTime();
});

// Method to check if certificate is valid
certificateSchema.methods.isValidCertificate = function() {
    return this.verification.isValid && this.status === 'issued';
};

// Method to increment verification count
certificateSchema.methods.recordVerification = function(verifierAddress, verifierType = 'unknown') {
    this.verification.verificationCount += 1;
    this.verification.lastVerifiedAt = new Date();
    this.verification.verifiedBy.push({
        address: verifierAddress,
        verifiedAt: new Date(),
        verifierType: verifierType
    });
    return this.save();
};

// Static method to find by hash
certificateSchema.statics.findByHash = function(hash) {
    return this.findOne({ 'certificate.hash': hash });
};

// Static method to find by certificate ID
certificateSchema.statics.findByCertificateId = function(certificateId) {
    return this.findOne({ certificateId: certificateId });
};

// Static method to get certificates by institution
certificateSchema.statics.findByInstitution = function(institutionAddress) {
    return this.find({ 'institution.address': institutionAddress.toLowerCase() });
};

// Static method to get certificates by recipient
certificateSchema.statics.findByRecipient = function(recipientAddress) {
    return this.find({ 'recipient.address': recipientAddress.toLowerCase() });
};

module.exports = mongoose.model('Certificate', certificateSchema);