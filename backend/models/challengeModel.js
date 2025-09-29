// models/challengeModel.js
const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a challenge title'],
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Please provide a challenge description'],
    },
    goal: {
        type: Number,
        required: [true, 'Please provide a numerical goal for the challenge'],
        min: 0,
    },
    unit: {
        type: String,
        required: [true, 'Please provide the unit of measurement (e.g., kWh, kg)'],
    },
    startDate: {
        type: Date,
        required: [true, 'Please provide a start date'],
    },
    endDate: {
        type: Date,
        required: [true, 'Please provide an end date'],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Challenge = mongoose.model('Challenge', challengeSchema);
module.exports = Challenge;
