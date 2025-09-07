const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);
    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: { user },
    });
};

exports.registerUser = async (req, res) => {
    try {
        // fingerprintDescriptor is no longer needed here
        const { name, email, password, householdMembers, address, city } = req.body;

        const newUser = await User.create({
            name, email, password, householdMembers, address, city,
        });

        createSendToken(newUser, 201, res);
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
        
    }
};

exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ status: 'fail', message: 'Please provide email and password!' });
        }

        const user = await User.findOne({ email }).select('+password');

        if (!user || !(await user.correctPassword(password, user.password))) {
            return res.status(401).json({ status: 'fail', message: 'Incorrect email or password' });
        }

        createSendToken(user, 200, res);
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Something went wrong!' });
        
    }
};

// This function gets the current user's data if they provide a valid token
exports.getMe = async (req, res) => {
    // The user data is attached to req.user by the 'protect' middleware
    const user = await User.findById(req.user.id);

    res.status(200).json({
        status: 'success',
        data: { user },
    });
};