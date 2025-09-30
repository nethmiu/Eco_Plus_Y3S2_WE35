const ElectricityUsage = require('../models/electricityUsageModel');
const WaterUsage = require('../models/waterUsageModel');
const WasteUsage = require('../models/wasteUsageModel');
const SustainabilityProfile = require('../models/sustainabilityProfileModel');

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



exports.setSustainabilityProfile = async (req, res) => {
    try {
        const { 
            primaryWaterSources,
            separateWaste,
            compostWaste,
            plasticBagSize,
            foodWasteBagSize,
            paperWasteBagSize
        } = req.body;

        // Validate required fields
        if (!primaryWaterSources || separateWaste === undefined) {
            return res.status(400).json({
                status: 'fail',
                message: 'Primary water sources and waste separation status are required'
            });
        }

        // Check if profile already exists for this user
        let existingProfile = await SustainabilityProfile.findOne({ 
            userId: req.user.id 
        });

        if (existingProfile) {
            // Update existing profile
            existingProfile.primaryWaterSources = primaryWaterSources;
            existingProfile.separateWaste = separateWaste;
            existingProfile.compostWaste = compostWaste || false;
            existingProfile.plasticBagSize = plasticBagSize || 5;
            existingProfile.foodWasteBagSize = foodWasteBagSize || 5;
            existingProfile.paperWasteBagSize = paperWasteBagSize || 5;
            existingProfile.lastUpdated = new Date();

            await existingProfile.save();
        } else {
            // Create new profile
            existingProfile = await SustainabilityProfile.create({
                userId: req.user.id,
                primaryWaterSources,
                separateWaste,
                compostWaste: compostWaste || false,
                plasticBagSize: plasticBagSize || 5,
                foodWasteBagSize: foodWasteBagSize || 5,
                paperWasteBagSize: paperWasteBagSize || 5,
                profileCompleted: true
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Sustainability profile updated successfully',
            data: { sustainabilityProfile: existingProfile }
        });
    } catch (err) {
        res.status(400).json({ 
            status: 'fail', 
            message: err.message 
        });
    }
};

exports.getSustainabilityProfile = async (req, res) => {
    try {
        const profile = await SustainabilityProfile.findOne({ 
            userId: req.user.id 
        });

        if (!profile) {
            return res.status(404).json({
                status: 'fail',
                message: 'Sustainability profile not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: { sustainabilityProfile: profile }
        });
    } catch (err) {
        res.status(500).json({ 
            status: 'error', 
            message: 'Error fetching sustainability profile' 
        });
    }
};