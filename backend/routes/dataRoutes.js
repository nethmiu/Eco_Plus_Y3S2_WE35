// backend/routes/dataRoutes.js (FIXED & IMPROVED VERSION)

const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');


const authMiddleware = require('../Middleware/authMiddleware'); 


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

// GIMHAN'S DASHBOARD ROUTE
router.get('/dashboard', dataController.getDashboardData);


router.post('/set-profile', dataController.setSustainabilityProfile);
router.get('/get-profile', dataController.getSustainabilityProfile);

module.exports = router;