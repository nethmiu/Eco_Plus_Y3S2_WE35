const ElectricityUsage = require('../models/electricityUsageModel');
const WaterUsage = require('../models/waterUsageModel');
const WasteUsage = require('../models/wasteUsageModel');
const asyncHandler = require('express-async-handler'); 


exports.addElectricityData = async (req, res) => {
    try {
        const { billingMonth, units, lastReading, latestReading, accountNo } = req.body;
        
        const newElectricityData = await ElectricityUsage.create({
            userId: req.user.id, // From protect middleware
            billingMonth: new Date(billingMonth),
            units,
            lastReading,
            latestReading,
            accountNo
        });

        res.status(201).json({
            status: 'success',
            data: { electricityData: newElectricityData }
        });
    } catch (err) {
        res.status(400).json({ 
            status: 'fail', 
            message: err.message 
        });
    }
};

exports.getElectricityHistory = async (req, res) => {
    try {
        const electricityData = await ElectricityUsage.find({ 
            userId: req.user.id 
        }).sort({ billingMonth: -1 });

        res.status(200).json({
            status: 'success',
            results: electricityData.length,
            data: { electricityData }
        });
    } catch (err) {
        res.status(500).json({ 
            status: 'error', 
            message: 'Error fetching electricity history' 
        });
    }
};


exports.addWaterData = async (req, res) => {
    try {
        const { billingMonth, units, lastReading, latestReading, accountNo } = req.body;
        
        const newWaterData = await WaterUsage.create({
            userId: req.user.id,
            billingMonth: new Date(billingMonth),
            units,
            lastReading,
            latestReading,
            accountNo
        });

        res.status(201).json({
            status: 'success',
            data: { waterData: newWaterData }
        });
    } catch (err) {
        res.status(400).json({ 
            status: 'fail', 
            message: err.message 
        });
    }
};

exports.getWaterHistory = async (req, res) => {
    try {
        const waterData = await WaterUsage.find({ 
            userId: req.user.id 
        }).sort({ billingMonth: -1 });

        res.status(200).json({
            status: 'success',
            results: waterData.length,
            data: { waterData }
        });
    } catch (err) {
        res.status(500).json({ 
            status: 'error', 
            message: 'Error fetching water history' 
        });
    }
};


exports.addWasteData = async (req, res) => {
    try {
        const { plasticBags, paperBags, foodWasteBags, collectionDate } = req.body;
        
        const date = new Date(collectionDate);
        const collectionWeek = getWeekNumber(date);
        const collectionMonth = date.getMonth() + 1;

        const newWasteData = await WasteUsage.create({
            userId: req.user.id,
            plasticBags,
            paperBags,
            foodWasteBags,
            collectionDate: date,
            collectionWeek,
            collectionMonth
        });

        res.status(201).json({
            status: 'success',
            data: { wasteData: newWasteData }
        });
    } catch (err) {
        res.status(400).json({ 
            status: 'fail', 
            message: err.message 
        });
    }
};

exports.getWasteHistory = async (req, res) => {
    try {
        const wasteData = await WasteUsage.find({ 
            userId: req.user.id 
        }).sort({ collectionDate: -1 });

        res.status(200).json({
            status: 'success',
            results: wasteData.length,
            data: { wasteData }
        });
    } catch (err) {
        res.status(500).json({ 
            status: 'error', 
            message: 'Error fetching waste history' 
        });
    }
};

// @desc    Get all data for the user dashboard
// @route   GET /api/data/dashboard
// @access  Private
exports.getDashboardData = asyncHandler(async (req, res) => {
    const userId = req.user.id; 

    // 1. Database eken user ge data okkoma gannawa
    const electricityData = await ElectricityUsage.find({ user: userId });
    const waterData = await WaterUsage.find({ user: userId });
    const wasteData = await WasteUsage.find({ user: userId });

    // 2. Eco Score Calculation
    let ecoScore = 100;

    // Electricity usage (1 unit = 0.2 points)
    const totalElectricityUnits = electricityData.reduce((sum, item) => sum + (item.units || 0), 0);
    ecoScore -= totalElectricityUnits * 0.2;

    // Water usage (1 unit/liter = 0.1 points)
    const totalWaterUnits = waterData.reduce((sum, item) => sum + (item.units || 0), 0);
    ecoScore -= totalWaterUnits * 0.1;

    // Waste calculation (1 bag = 0.3 points)
    const totalWasteBags = wasteData.reduce((sum, item) => sum + (item.plasticBags || 0) + (item.paperBags || 0) + (item.foodWasteBags || 0), 0);
    ecoScore -= totalWasteBags * 0.3; 

    // Score eka 0ta adu wenne nathuwa hadamu
    ecoScore = Math.max(0, Math.round(ecoScore));

  
    const chartData = {
        labels: electricityData.length > 0 ? 
            electricityData
                .sort((a, b) => new Date(a.billingMonth) - new Date(b.billingMonth)) 
                .slice(-6) 
                .map(d => new Date(d.billingMonth).toLocaleString('default', { month: 'short' })) 
            : ['Start'], 
        datasets: [{
            data: electricityData.length > 0 ? 
                electricityData
                    .sort((a, b) => new Date(a.billingMonth) - new Date(b.billingMonth))
                    .slice(-6)
                    .map(d => d.units)
                : [0], 
            legend: ["Electricity Usage (Units)"]
        }]
    };
    
    // 4. Key Metrics (dashboard eke podi cards) hadamu
    const keyMetrics = [
       
        { 
            id: 1, 
            title: 'Last Electricity Bill', 
           
            value: `${electricityData.length > 0 ? electricityData[electricityData.length - 1].units : 0} Units`, 
            icon: 'flash-outline' 
        },
        { 
            id: 2, 
            title: 'Last Water Bill', 
            value: `${waterData.length > 0 ? waterData[waterData.length - 1].units : 0} Units`, 
            icon: 'water-outline' 
        },
        { 
            id: 3, 
            title: 'Last Waste Entry', 
            value: `${wasteData.length > 0 ? (wasteData[wasteData.length - 1].plasticBags + wasteData[wasteData.length - 1].paperBags + wasteData[wasteData.length - 1].foodWasteBags) : 0} Bags`, 
            icon: 'trash-can-outline' 
        },
    ];

    
    res.status(200).json({
        ecoScore,
        keyMetrics,
        chartData
    });
});

// Helper function to get week number
function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
}