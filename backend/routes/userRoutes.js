const express = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware'); // Import middleware

const router = express.Router();

router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);

// This is a protected route. User must have a valid token to access it.
router.get('/me', authMiddleware.protect, userController.getMe);

module.exports = router;