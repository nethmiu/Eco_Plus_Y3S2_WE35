const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const { sendWelcomeEmail } = require('../utils/email');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

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

// Configure multer for file upload
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new Error('Not an image! Please upload only images.'), false);
    }
};

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = async (req, res, next) => {
    if (!req.file) return next();

    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, '..', 'uploads', 'users');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    await sharp(req.file.buffer)
        .resize(500, 500)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(path.join(uploadsDir, req.file.filename));

    next();
};

exports.registerUser = async (req, res) => {
    try {
        const { name, email, password, householdMembers, address, city } = req.body;

        const newUser = await User.create({
            name, email, password, householdMembers, address, city,
        });

        
        try {
            // After user creating send welcome email
            await sendWelcomeEmail(newUser.email, newUser.name);
        } catch (emailError) {
            // If failed to send email, log the error
            // but do not prevent user registration
            console.error('There was an error sending the welcome email:', emailError);
        }
        

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

       
        // පරිශීලකයාගේ status එක 'active' දැයි පරීක්ෂා කිරීම
        if (user.status !== 'active') {
            return res.status(401).json({ 
                status: 'fail', 
                message: 'Your account is inactive. Please contact an administrator.' 
            });
        }
        

        // සියලුම පරීක්ෂා කිරීම් සාර්ථක නම්, token එක යැවීම
        createSendToken(user, 200, res);

    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Something went wrong!' });
    }
};

exports.updateMe = async (req, res) => {
    try {
        const filteredBody = { ...req.body };
        // remove fields that are not allowed to be updated
        const disallowedFields = ['password', 'role', 'status'];
        disallowedFields.forEach(el => delete filteredBody[el]);

        // Add photo to update if uploaded
        if (req.file) {
            // Delete old photo if exists
            const currentUser = await User.findById(req.user.id);
            if (currentUser.photo && currentUser.photo !== 'default.jpg') {
                const oldPhotoPath = path.join(__dirname, '..', 'uploads', 'users', currentUser.photo);
                if (fs.existsSync(oldPhotoPath)) {
                    fs.unlinkSync(oldPhotoPath);
                }
            }
            filteredBody.photo = req.file.filename;
        }

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
        // 1. get user from db with password
        const user = await User.findById(req.user.id).select('+password');

        const { currentPassword, newPassword, confirmPassword } = req.body;
        
        // 2. check if posted current password is correct
        if (!currentPassword || !(await user.correctPassword(currentPassword, user.password))) {
            return res.status(401).json({ status: 'fail', message: 'Your current password is wrong.' });
        }

        // 3. check if new password and confirm password match
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ status: 'fail', message: 'New password and confirm password do not match.' });
        }

        // 4. update user password and save
        user.password = newPassword;
        await user.save();

        // 5. send new token to user for re-login
        createSendToken(user, 200, res);
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'An error occurred while changing the password.' });
    }
};

exports.deleteMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ status: 'fail', message: 'User not found.' });
        }

        // Delete user's profile photo if exists
        if (user.photo && user.photo !== 'default.jpg') {
            const photoPath = path.join(__dirname, '..', 'uploads', 'users', user.photo);
            if (fs.existsSync(photoPath)) {
                fs.unlinkSync(photoPath);
            }
        }

        // Delete the user account
        await User.findByIdAndDelete(req.user.id);

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'An error occurred while deleting the account.' });
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
