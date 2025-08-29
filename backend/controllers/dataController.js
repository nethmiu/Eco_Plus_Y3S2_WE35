const ElectricityUsage = require('../models/electricityUsageModel');
const WaterUsage = require('../models/waterUsageModel');
const WasteUsage = require('../models/wasteUsageModel');

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

// Helper function to get week number
function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
}