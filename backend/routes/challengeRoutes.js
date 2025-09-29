const express = require('express');
const challengeController = require('../controllers/challengeController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// =======================================================
// 1. ADMIN/CRUD ENDPOINTS (Task 01)
// =======================================================

// Create Challenge (Protected: Admin/Env access required)
// POST /api/challenges
router.post('/', authMiddleware.protect, challengeController.createChallenge);

// Update/Delete Challenge (Protected)
// PATCH /api/challenges/:id
// DELETE /api/challenges/:id
router
    .route('/:id')
    .patch(authMiddleware.protect, challengeController.updateChallenge)
    .delete(authMiddleware.protect, challengeController.deleteChallenge);

// =======================================================
// 2. USER/VIEW ENDPOINTS
// =======================================================

// View all Challenges (Used by ChallengeListScreen.js)
// GET /api/challenges
router.get('/', challengeController.getAllChallenges);

// =======================================================
// 3. GAMIFICATION & STATS ENDPOINTS (Task 02)
// =======================================================

// User joins a specific challenge (Used by ChallengeListScreen.js)
// POST /api/challenges/:challengeId/join
router.post('/:challengeId/join', authMiddleware.protect, challengeController.joinChallenge);

// Get global leaderboard (Used by LeaderboardScreen.js)
// GET /api/challenges/leaderboard
router.get('/leaderboard', authMiddleware.protect, challengeController.getLeaderboard);

// Get Active Challenge Count (Used by AdminDashboard.js)
// GET /api/challenges/stats/active/count
router.get('/stats/active/count', authMiddleware.protect, challengeController.getActiveChallengesCount);

// Admin/Demo evaluation endpoint (for assigning points manually)
// PATCH /api/challenges/evaluate
router.patch('/evaluate', authMiddleware.protect, challengeController.evaluateChallenge);


module.exports = router;
