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

// Function to update a challenge
exports.updateChallenge = async (req, res) => {
    try {
        const challenge = await Challenge.findByIdAndUpdate(req.params.id, req.body, {
            new: true, // Return the updated document
            runValidators: true, // Run schema validators
        });

        if (!challenge) {
            return res.status(404).json({
                status: 'fail',
                message: 'No challenge found with that ID',
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                challenge,
            },
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message,
        });
    }
};

// Function to delete a challenge
exports.deleteChallenge = async (req, res) => {
    try {
        const challenge = await Challenge.findByIdAndDelete(req.params.id);

        if (!challenge) {
            return res.status(404).json({
                status: 'fail',
                message: 'No challenge found with that ID',
            });
        }

        res.status(204).json({
            status: 'success',
            data: null,
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong while deleting the challenge',
        });
    }
};
