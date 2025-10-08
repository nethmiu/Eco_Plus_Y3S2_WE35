const mongoose = require('mongoose');

const userChallengeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    challengeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Challenge',
        required: true,
    },
    // The consumption data recorded when the user joins (e.g., 200 kWh, 10 kg)
    startValue: {
        type: Number,
        required: true,
        min: 0
    },
    // The final consumption data recorded when the challenge ends/is completed
    endValue: {
        type: Number,
        default: 0, 
        min: 0
    },
    status: {
        type: String,
        enum: ['Joined', 'Completed', 'Failed', 'Withdrawn'],
        default: 'Joined',
    },
    pointsEarned: {
        type: Number,
        default: 0,
        min: 0
    },
    joinedDate: {
        type: Date,
        default: Date.now,
    },
    completionDate: Date,
}, {
    timestamps: true
});

// Ensures a user can only join a challenge once
userChallengeSchema.index({ userId: 1, challengeId: 1 }, { unique: true });

const UserChallenge = mongoose.model('UserChallenge', userChallengeSchema);
module.exports = UserChallenge;
