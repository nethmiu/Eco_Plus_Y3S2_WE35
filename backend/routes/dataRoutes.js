const express = require('express');
const dataController = require('../controllers/dataController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Protect all routes after this middleware
router.use(authMiddleware.protect);

// Electricity routes
router.post('/electricity', dataController.addElectricityData);
router.get('/electricity', dataController.getElectricityHistory);

// Water routes
router.post('/water', dataController.addWaterData);
router.get('/water', dataController.getWaterHistory);

// Waste routes
router.post('/waste', dataController.addWasteData);
router.get('/waste', dataController.getWasteHistory);

module.exports = router;