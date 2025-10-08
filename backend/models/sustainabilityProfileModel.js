
const mongoose = require('mongoose');

const sustainabilityProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    primaryWaterSources: {
        type: [String],
        required: true,
    },
    separateWaste: {
        type: Boolean,
        required: true
    },
    compostWaste: {
        type: Boolean,
        default: false
    },
    plasticBagSize: {
        type: Number,
        default: 5,
        min: 1,
        max: 100
    },
    foodWasteBagSize: {
        type: Number,
        default: 5,
        min: 1,
        max: 100
    },
    paperWasteBagSize: {
        type: Number,
        default: 5,
        min: 1,
        max: 100
    },
    profileCompleted: {
        type: Boolean,
        default: false
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Compound index for faster queries
sustainabilityProfileSchema.index({ userId: 1 });

module.exports = mongoose.model('SustainabilityProfile', sustainabilityProfileSchema);