// controllers/challengeController.js
const Challenge = require('../models/challengeModel');

// Function to create a new challenge
exports.createChallenge = async (req, res) => {
    try {
        const newChallenge = await Challenge.create(req.body);
        res.status(201).json({
            status: 'success',
            data: {
                challenge: newChallenge,
            },
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message,
        });
    }
};

// Function to get all challenges
exports.getAllChallenges = async (req, res) => {
    try {
        const challenges = await Challenge.find();
        res.status(200).json({
            status: 'success',
            results: challenges.length,
            data: {
                challenges,
            },
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong while fetching challenges',
        });
    }
};