const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');

const { protect } = require('../Middleware/authMiddleware'); 
// Electricity routes

router.post('/electricity', protect, dataController.addElectricityData); 
router.get('/electricity', protect, dataController.getElectricityHistory); 

// Water routes
router.post('/water', protect, dataController.addWaterData); 
router.get('/water', protect, dataController.getWaterHistory); 

// Waste routes
router.post('/waste', protect, dataController.addWasteData); 
router.get('/waste', protect, dataController.getWasteHistory); 

router.get('/dashboard', protect, dataController.getDashboardData);

module.exports = router;