// routes/challengeRoutes.js
const express = require('express');
const challengeController = require('../controllers/challengeController');
const authMiddleware = require('../middleware/authMiddleware'); // authMiddleware එකට import කරන්න.

const router = express.Router();

// Challenges create කරන්න, දැනට Admin role එකක් නැති නිසා, ඔයාට පුළුවන් මේකට protect middleware එක යොදන්න.
// ඒ කියන්නේ log වෙලා ඉන්න ඕන කියලා.
router.post('/', authMiddleware.protect, challengeController.createChallenge);

// Challenges view කරන්න. මේක public වෙන්නත් පුළුවන්, log වෙලා ඉන්න ඕන වෙන්නත් පුළුවන්.
router.get('/', challengeController.getAllChallenges);

module.exports = router;