const express = require('express');
const challengeController = require('../controllers/challengeController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Challenges create කරන්න
router.post('/', authMiddleware.protect, challengeController.createChallenge);

// Challenges view කරන්න
router.get('/', challengeController.getAllChallenges);

// Challenges update සහ delete කරන්න
router
    .route('/:id')
    .patch(authMiddleware.protect, challengeController.updateChallenge)
    .delete(authMiddleware.protect, challengeController.deleteChallenge);

module.exports = router;
