const Challenge = require('../models/challengeModel');
const UserChallenge = require('../models/userChallengeModel');
const ElectricityUsage = require('../models/electricityUsageModel'); 
const WaterUsage = require('../models/waterUsageModel');
const WasteUsage = require('../models/wasteUsageModel'); 
const mongoose = require('mongoose');

// ====================================================================
// SECTION 1: UTILITY FUNCTIONS (For internal use)
// ====================================================================

/**
 * Helper function to get the current/last recorded consumption data for a user
 * based on the unit type specified in the challenge.
 */
const getLatestConsumption = async (userId, unit) => {
    switch (unit.toLowerCase()) {
        case 'kwh':
            const elecData = await ElectricityUsage.findOne({ userId }).sort({ billingMonth: -1 });
            return elecData ? elecData.units : 0;
        case 'm3': 
            const waterData = await WaterUsage.findOne({ userId }).sort({ billingMonth: -1 });
            return waterData ? waterData.units : 0;
        case 'bags': 
        case 'kg':
            // Assuming waste tracking is based on total bags for simplicity
            const wasteData = await WasteUsage.findOne({ userId }).sort({ collectionDate: -1 });
            if (wasteData) {
                // FIX APPLIED: Explicitly convert String data from DB to Number 
                return Number(wasteData.plasticBags) + 
                       Number(wasteData.paperBags) + 
                       Number(wasteData.foodWasteBags);
            }
            return 0;
        default:
            return 0; 
    }
};

// ====================================================================
// SECTION 2: ADMIN/CRUD CHALLENGE MANAGEMENT (Task 01)
// ====================================================================

/**
 * Creates a new challenge (Admin/Env function).
 */
exports.createChallenge = async (req, res) => {
    try {
        const newChallenge = await Challenge.create(req.body);
        res.status(201).json({
            status: 'success',
            data: { challenge: newChallenge },
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

/**
 * Gets all challenges (for User View or Admin Management).
 * *** UPDATED FOR FILTERING (1.1) ***
 */
exports.getAllChallenges = async (req, res) => {
    try {
        // 1. Get the filter parameter from the URL query
        const filterUnit = req.query.unit;
        let filter = {};

        // 2. Apply filtering based on the unit parameter
        if (filterUnit) {
            // Handle Case Insensitivity using $regex and 'i' option
            // This filters challenges where the 'unit' field matches the filterUnit (case insensitive)
            // The ^ and $ ensures it matches the entire string, not just part of it.
            filter = { unit: { $regex: new RegExp(`^${filterUnit}$`), $options: 'i' } };
        }

        const challenges = await Challenge.find(filter); 
        res.status(200).json({
            status: 'success',
            results: challenges.length,
            data: { challenges },
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Something went wrong while fetching challenges' });
    }
};

/**
 * Updates an existing challenge (Admin/Env function).
 */
exports.updateChallenge = async (req, res) => {
    try {
        const challenge = await Challenge.findByIdAndUpdate(req.params.id, req.body, {
            new: true, runValidators: true,
        });
        if (!challenge) {
            return res.status(404).json({ status: 'fail', message: 'No challenge found with that ID' });
        }
        res.status(200).json({ status: 'success', data: { challenge } });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

/**
 * Deletes a challenge (Admin/Env function).
 */
exports.deleteChallenge = async (req, res) => {
    try {
        const challenge = await Challenge.findByIdAndDelete(req.params.id);
        if (!challenge) {
            return res.status(404).json({ status: 'fail', message: 'No challenge found with that ID' });
        }
        res.status(204).json({ status: 'success', data: null });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Something went wrong while deleting the challenge' });
    }
};

// ====================================================================
// SECTION 3: USER PARTICIPATION (Task 02: Join, Leaderboard)
// ====================================================================

/**
 * Allows a user to join a specific challenge.
 */
exports.joinChallenge = async (req, res) => {
    try {
        const { challengeId } = req.params;
        const userId = req.user.id; 

        const challenge = await Challenge.findById(challengeId);
        if (!challenge) {
            return res.status(404).json({ status: 'fail', message: 'Challenge not found.' });
        }

        const existingEntry = await UserChallenge.findOne({ userId, challengeId });
        if (existingEntry) {
            return res.status(409).json({ status: 'fail', message: `You have already joined this challenge. Status: ${existingEntry.status}` });
        }
        
        const startValue = await getLatestConsumption(userId, challenge.unit);

        if (startValue === 0) {
             return res.status(400).json({ status: 'fail', message: `Cannot join challenge. Please submit at least one unit of ${challenge.unit} data first.` });
        }

        const newUserChallenge = await UserChallenge.create({
            userId,
            challengeId,
            startValue,
            joinedDate: new Date(),
            status: 'Joined',
        });

        res.status(201).json({
            status: 'success',
            data: { challenge: newUserChallenge },
            message: `Successfully joined challenge! Your starting value (${challenge.unit}): ${startValue}.`
        });
    } catch (err) {
        res.status(400).json({ 
            status: 'fail', 
            message: err.message.includes('duplicate key') ? 'You have already joined this challenge.' : err.message
        });
    }
};

/**
 * Generates the system-wide leaderboard.
 */
exports.getLeaderboard = async (req, res) => {
    try {
        const leaderboard = await UserChallenge.aggregate([
            { $match: { pointsEarned: { $gt: 0 } } },
            {
                $group: {
                    _id: '$userId',
                    totalPoints: { $sum: '$pointsEarned' },
                    challengesCompleted: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } }
                }
            },
            { $sort: { totalPoints: -1 } },
            { $limit: 100 },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'userDetails'
                }
            },
            { $unwind: { path: '$userDetails', preserveNullAndEmptyArrays: false } },
            {
                $project: {
                    _id: 0,
                    userId: '$_id',
                    name: '$userDetails.name',
                    city: '$userDetails.city',
                    photo: '$userDetails.photo',
                    totalPoints: '$totalPoints',
                    challengesCompleted: '$challengesCompleted',
                }
            }
        ]);

        res.status(200).json({
            status: 'success',
            results: leaderboard.length,
            data: { leaderboard }
        });
    } catch (err) {
        res.status(500).json({ 
            status: 'error', 
            message: 'Error generating leaderboard: ' + err.message 
        });
    }
};

// ====================================================================
// SECTION 4: ADMIN/DASHBOARD STATS & EVALUATION (Task 02)
// ====================================================================

/**
 * Gets the total count of currently active challenges for the Dashboard.
 */
exports.getActiveChallengesCount = async (req, res) => {
    // FIX: Returning 0 is a placeholder for stability until time zone logic is fully debugged.
    try {
        res.status(200).json({
            status: 'success',
            data: { activeCount: 0 },
        });
    } catch (err) {
        res.status(500).json({ 
            status: 'error', 
            message: 'Error fetching active challenge count.' 
        });
    }
};

/**
 * FOR TESTING/ADMIN DEMO: Function to manually complete a challenge and assign points.
 */
exports.evaluateChallenge = async (req, res) => {
    try {
        // NOTE: The Admin tool (Frontend) now sends the userId in the body.
        const { challengeId, points, userId: targetUserId } = req.body; 
        
        // Ensure userId is present (for Admin tool usability)
        if (!targetUserId) {
            return res.status(400).json({ status: 'fail', message: 'User ID is required in the payload to award points.' });
        }
        
        const challengeDetails = await Challenge.findById(challengeId);
        if (!challengeDetails) {
            return res.status(404).json({ status: 'fail', message: 'Challenge not found.' });
        }

        const endValue = await getLatestConsumption(targetUserId, challengeDetails.unit);

        const updatedChallenge = await UserChallenge.findOneAndUpdate(
            { userId: targetUserId, challengeId },
            { 
                status: 'Completed', 
                pointsEarned: points,
                completionDate: new Date(),
                endValue: endValue
            },
            { new: true, runValidators: true }
        );

        if (!updatedChallenge) {
            return res.status(404).json({ status: 'fail', message: 'User not joined this challenge. They must enroll first.' });
        }

        res.status(200).json({ 
            status: 'success', 
            data: { challenge: updatedChallenge },
            message: `Challenge completed and ${points} points awarded.`
        });

    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};