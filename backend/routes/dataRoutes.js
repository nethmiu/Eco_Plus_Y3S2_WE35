const express = require('express');
const dataController = require('../controllers/dataController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Protect all routes after this middleware
router.use(authMiddleware.protect);

// Electricity routes
<<<<<<< Updated upstream
router.post('/electricity', dataController.addElectricityData);
router.get('/electricity', dataController.getElectricityHistory);

// Water routes
router.post('/water', dataController.addWaterData);
router.get('/water', dataController.getWaterHistory);

// Waste routes
router.post('/waste', dataController.addWasteData);
router.get('/waste', dataController.getWasteHistory);
=======
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
>>>>>>> Stashed changes

module.exports = router;