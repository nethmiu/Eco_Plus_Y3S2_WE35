const express = require('express');
const dataController = require('../controllers/dataController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Protect all routes after this middleware
router.use(authMiddleware.protect);

// Electricity routes
router.post('/electricity', dataController.addElectricityData); 
router.get('/electricity', dataController.getElectricityHistory); 
router.delete('/electricity/:id', dataController.deleteElectricityData);

// Water routes
router.post('/water', dataController.addWaterData); 
router.get('/water', dataController.getWaterHistory); 
router.delete('/water/:id', dataController.deleteWaterData);

// Waste routes
router.post('/waste', dataController.addWasteData); 
router.get('/waste', dataController.getWasteHistory); 
router.delete('/waste/:id', dataController.deleteWasteData);

// Aggregate data routes
router.get('/last-month', dataController.getLastMonthData);
router.get('/check-profile', dataController.checkSustainabilityProfile);

// GIMHAN'S DASHBOARD ROUTE
router.get('/dashboard', dataController.getDashboardData);


router.post('/set-profile', dataController.setSustainabilityProfile);
router.get('/get-profile', dataController.getSustainabilityProfile);

module.exports = router;