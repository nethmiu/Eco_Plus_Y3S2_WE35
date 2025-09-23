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
exports.updateMe = async (req, res) => {
    try {
        const filteredBody = { ...req.body };
        // User ට update කිරීමට අවසර නැති fields ඉවත් කිරීම
        const disallowedFields = ['password', 'role', 'status'];
        disallowedFields.forEach(el => delete filteredBody[el]);

        const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ status: 'success', data: { user: updatedUser } });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

exports.updatePassword = async (req, res) => {
    try {
        // 1. User ව DB එකෙන් ලබාගැනීම (password එකත් සමඟ)
        const user = await User.findById(req.user.id).select('+password');

        const { currentPassword, newPassword, confirmPassword } = req.body;
        
        // 2. දැනට ඇති password එක නිවැරදිදැයි පරීක්ෂා කිරීම
        if (!currentPassword || !(await user.correctPassword(currentPassword, user.password))) {
            return res.status(401).json({ status: 'fail', message: 'Your current password is wrong.' });
        }

        // 3. අලුත් password දෙක සමානදැයි පරීක්ෂා කිරීම
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ status: 'fail', message: 'New password and confirm password do not match.' });
        }

        // 4. User ගේ password එක update කර save කිරීම
        user.password = newPassword;
        await user.save();

        // 5. අලුත් token එකක් යවා user ව නැවත log කිරීම
        createSendToken(user, 200, res);
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'An error occurred while changing the password.' });
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

exports.deleteMe = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.user.id);

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Error deleting account.' });
    }
};