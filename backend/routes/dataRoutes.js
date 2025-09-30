const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');

const { protect } = require('../Middleware/authMiddleware'); 
// Electricity routes
router.post('/electricity', dataController.addElectricityData);
router.get('/electricity', dataController.getElectricityHistory);

// Water routes
router.post('/water', dataController.addWaterData);
router.get('/water', dataController.getWaterHistory);

// Waste routes
router.post('/waste', dataController.addWasteData);
router.get('/waste', dataController.getWasteHistory);


router.get('/dashboard', protect, dataController.getDashboardData);

module.exports = router;