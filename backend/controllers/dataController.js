const ElectricityUsage = require('../models/electricityUsageModel');
const WaterUsage = require('../models/waterUsageModel');
const WasteUsage = require('../models/wasteUsageModel');
<<<<<<< Updated upstream
=======
const asyncHandler = require('express-async-handler'); 
const SustainabilityProfile = require('../models/sustainabilityProfileModel');
>>>>>>> Stashed changes

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

exports.deleteElectricityData = async (req, res) => {
    try {
        const { id } = req.params;
        const electricityData = await ElectricityUsage.findByIdAndDelete(id);
        res.status(200).json({
            status: 'success',
            data: { electricityData }
        });
    } catch (err) {
        res.status(500).json({ 
            status: 'error', 
            message: 'Error deleting electricity data' 
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

exports.deleteWaterData = async (req, res) => {
    try {
        const { id } = req.params;
        const waterData = await WaterUsage.findByIdAndDelete(id);
        res.status(200).json({
            status: 'success',
            data: { waterData }
        });
    } catch (err) {
        res.status(500).json({ 
            status: 'error', 
            message: 'Error deleting water data' 
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

<<<<<<< Updated upstream
=======
exports.deleteWasteData = async (req, res) => {
    try {
        const { id } = req.params;
        const wasteData = await WasteUsage.findByIdAndDelete(id);
        res.status(200).json({
            status: 'success',
            data: { wasteData }
        });
    } catch (err) {
        res.status(500).json({ 
            status: 'error', 
            message: 'Error deleting waste data' 
        });
    }
};

// @desc    Get all data for the user dashboard
// @route   GET /api/data/dashboard
// @access  Private
exports.getDashboardData = asyncHandler(async (req, res) => {
    const userId = req.user.id; 

    // 1. Database eken user ge data okkoma gannawa
   const electricityData = await ElectricityUsage.find({ userId: userId });
const waterData = await WaterUsage.find({ userId: userId });
const wasteData = await WasteUsage.find({ userId: userId });

    console.log("==========================================");
    console.log(`[Dashboard] Fetching data for user ID: ${userId}`);

     console.log(`[Dashboard] Electricity documents found: ${electricityData.length}`);
   
    // console.log(electricityData);
    
    console.log(`[Dashboard] Water documents found: ${waterData.length}`);
    console.log(`[Dashboard] Waste documents found: ${wasteData.length}`);
    console.log("==========================================");
    

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

>>>>>>> Stashed changes
// Helper function to get week number
function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
<<<<<<< Updated upstream
}
=======
}


exports.setSustainabilityProfile = async (req, res) => {
    try {
        const { 
            primaryWaterSources,
            primaryEnergySources,
            separateWaste,
            compostWaste,
            plasticBagSize,
            foodWasteBagSize,
            paperWasteBagSize
        } = req.body;

        // Validate required fields
        if (!primaryWaterSources || !primaryEnergySources || separateWaste === undefined) {
            return res.status(400).json({
                status: 'fail',
                message: 'Primary water sources, energy sources and waste separation status are required'
            });
        }

        // Check if profile already exists for this user
        let existingProfile = await SustainabilityProfile.findOne({ 
            userId: req.user.id 
        });

        if (existingProfile) {
            // Update existing profile
            existingProfile.primaryWaterSources = primaryWaterSources;
            existingProfile.primaryEnergySources = primaryEnergySources;
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
                primaryEnergySources,
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
>>>>>>> Stashed changes
