const ElectricityUsage = require('../models/electricityUsageModel');
const WaterUsage = require('../models/waterUsageModel');
const WasteUsage = require('../models/wasteUsageModel');


const asyncHandler = require('express-async-handler'); 
const SustainabilityProfile = require('../models/sustainabilityProfileModel');

// Utility functions
const calculateEcoScore = (electricityData, waterData, wasteData, sustainabilityProfile) => {
    let ecoScore = 100;

    // Electricity usage with profile consideration
    const totalElectricityUnits = electricityData.reduce((sum, item) => sum + (item.units || 0), 0);
    const energyMultiplier = sustainabilityProfile?.primaryEnergySources?.includes('solar') ? 0.1 : 0.2;
    ecoScore -= totalElectricityUnits * energyMultiplier;

    // Water usage with profile consideration
    const totalWaterUnits = waterData.reduce((sum, item) => sum + (item.units || 0), 0);
    const waterMultiplier = sustainabilityProfile?.primaryWaterSources?.includes('rainwater') ? 0.05 : 0.1;
    ecoScore -= totalWaterUnits * waterMultiplier;

    // Waste calculation with profile consideration
    const totalWasteBags = wasteData.reduce((sum, item) => sum + (item.plasticBags || 0) + (item.paperBags || 0) + (item.foodWasteBags || 0), 0);
    const wasteMultiplier = sustainabilityProfile?.separateWaste ? 0.2 : 0.3;
    ecoScore -= totalWasteBags * wasteMultiplier;

    // Bonus points for sustainable practices
    if (sustainabilityProfile?.compostWaste) ecoScore += 5;
    if (sustainabilityProfile?.separateWaste) ecoScore += 5;

    return Math.max(0, Math.round(ecoScore));
};

const getWeekNumber = (d) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
};

const validateConsumptionData = (data, type) => {
    const errors = [];
    
    switch (type) {
        case 'electricity':
        case 'water':
            if (!data.billingMonth) errors.push('Billing month is required');
            if (!data.units || data.units < 0) errors.push('Valid units are required');
            if (!data.lastReading || data.lastReading < 0) errors.push('Valid last reading is required');
            if (!data.latestReading || data.latestReading < 0) errors.push('Valid latest reading is required');
            if (data.latestReading < data.lastReading) errors.push('Latest reading must be greater than last reading');
            break;
        case 'waste':
            if (!data.collectionDate) errors.push('Collection date is required');
            if ((data.plasticBags || 0) < 0) errors.push('Plastic bags cannot be negative');
            if ((data.paperBags || 0) < 0) errors.push('Paper bags cannot be negative');
            if ((data.foodWasteBags || 0) < 0) errors.push('Food waste bags cannot be negative');
            break;
    }
    
    return errors;
};

// Electricity Controllers
exports.addElectricityData = asyncHandler(async (req, res) => {
    const { billingMonth, units, lastReading, latestReading, accountNo } = req.body;
    
    // Validate input
    const validationErrors = validateConsumptionData(req.body, 'electricity');
    if (validationErrors.length > 0) {
        return res.status(400).json({
            status: 'fail',
            message: 'Validation failed',
            errors: validationErrors
        });
    }

    const newElectricityData = await ElectricityUsage.create({
        userId: req.user.id,
        billingMonth: new Date(billingMonth),
        units,
        lastReading,
        latestReading,
        accountNo
    });

    res.status(201).json({
        status: 'success',
        message: 'Electricity data added successfully',
        data: { electricityData: newElectricityData }
    });
});

exports.getElectricityHistory = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, sort = '-billingMonth' } = req.query;
    
    const electricityData = await ElectricityUsage.find({ userId: req.user.id })
        .sort(sort)
        .limit(limit * 1)
        .skip((page - 1) * limit);

    const total = await ElectricityUsage.countDocuments({ userId: req.user.id });

    res.status(200).json({
        status: 'success',
        results: electricityData.length,
        pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / limit),
            total
        },
        data: { electricityData }
    });
});

exports.deleteElectricityData = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const electricityData = await ElectricityUsage.findOneAndDelete({
        _id: id,
        userId: req.user.id // Ensure user can only delete their own data
    });

    if (!electricityData) {
        return res.status(404).json({
            status: 'fail',
            message: 'Electricity data not found or access denied'
        });
    }

    res.status(200).json({
        status: 'success',
        message: 'Electricity data deleted successfully',
        data: null
    });
});

// Water Controllers
exports.addWaterData = asyncHandler(async (req, res) => {
    const { billingMonth, units, lastReading, latestReading, accountNo } = req.body;
    
    const validationErrors = validateConsumptionData(req.body, 'water');
    if (validationErrors.length > 0) {
        return res.status(400).json({
            status: 'fail',
            message: 'Validation failed',
            errors: validationErrors
        });
    }

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
        message: 'Water data added successfully',
        data: { waterData: newWaterData }
    });
});

exports.getWaterHistory = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, sort = '-billingMonth' } = req.query;
    
    const waterData = await WaterUsage.find({ userId: req.user.id })
        .sort(sort)
        .limit(limit * 1)
        .skip((page - 1) * limit);

    const total = await WaterUsage.countDocuments({ userId: req.user.id });

    res.status(200).json({
        status: 'success',
        results: waterData.length,
        pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / limit),
            total
        },
        data: { waterData }
    });
});

exports.deleteWaterData = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const waterData = await WaterUsage.findOneAndDelete({
        _id: id,
        userId: req.user.id
    });

    if (!waterData) {
        return res.status(404).json({
            status: 'fail',
            message: 'Water data not found or access denied'
        });
    }

    res.status(200).json({
        status: 'success',
        message: 'Water data deleted successfully',
        data: null
    });
});

// Waste Controllers
exports.addWasteData = asyncHandler(async (req, res) => {
    const { plasticBags, paperBags, foodWasteBags, collectionDate } = req.body;
    
    const validationErrors = validateConsumptionData(req.body, 'waste');
    if (validationErrors.length > 0) {
        return res.status(400).json({
            status: 'fail',
            message: 'Validation failed',
            errors: validationErrors
        });
    }

    const date = new Date(collectionDate);
    const collectionWeek = getWeekNumber(date);
    const collectionMonth = date.getMonth() + 1;

    const newWasteData = await WasteUsage.create({
        userId: req.user.id,
        plasticBags: plasticBags || 0,
        paperBags: paperBags || 0,
        foodWasteBags: foodWasteBags || 0,
        collectionDate: date,
        collectionWeek,
        collectionMonth
    });

    res.status(201).json({
        status: 'success',
        message: 'Waste data added successfully',
        data: { wasteData: newWasteData }
    });
});

exports.getWasteHistory = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, sort = '-collectionDate' } = req.query;
    
    const wasteData = await WasteUsage.find({ userId: req.user.id })
        .sort(sort)
        .limit(limit * 1)
        .skip((page - 1) * limit);

    const total = await WasteUsage.countDocuments({ userId: req.user.id });

    res.status(200).json({
        status: 'success',
        results: wasteData.length,
        pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / limit),
            total
        },
        data: { wasteData }
    });
});

exports.deleteWasteData = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const wasteData = await WasteUsage.findOneAndDelete({
        _id: id,
        userId: req.user.id
    });

    if (!wasteData) {
        return res.status(404).json({
            status: 'fail',
            message: 'Waste data not found or access denied'
        });
    }

    res.status(200).json({
        status: 'success',
        message: 'Waste data deleted successfully',
        data: null
    });
});

// Get data for the last month
exports.getLastMonthData = asyncHandler(async (req, res) => {
    const currentDate = new Date();
    const lastMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const lastMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
    
    // Get electricity data for last month
    const electricityData = await ElectricityUsage.findOne({
        userId: req.user.id,
        billingMonth: {
            $gte: lastMonthStart,
            $lte: lastMonthEnd
        }
    }).sort({ billingMonth: -1 });

    // Get water data for last month
    const waterData = await WaterUsage.findOne({
        userId: req.user.id,
        billingMonth: {
            $gte: lastMonthStart,
            $lte: lastMonthEnd
        }
    }).sort({ billingMonth: -1 });

    // Get waste data for last month and calculate total bags
    const wasteData = await WasteUsage.find({
        userId: req.user.id,
        collectionDate: {
            $gte: lastMonthStart,
            $lte: lastMonthEnd
        }
    });

    // Calculate total waste bags for the last month
    let totalWasteBags = 0;
    let plasticBags = 0;
    let paperBags = 0;
    let foodWasteBags = 0;

    if (wasteData && wasteData.length > 0) {
        wasteData.forEach(record => {
            plasticBags += record.plasticBags || 0;
            paperBags += record.paperBags || 0;
            foodWasteBags += record.foodWasteBags || 0;
        });
        
        totalWasteBags = plasticBags + paperBags + foodWasteBags;
    }

    res.status(200).json({
        status: 'success',
        data: { 
            electricityData, 
            waterData, 
            wasteData,
            wasteSummary: {
                totalWasteBags,
                plasticBags,
                paperBags,
                foodWasteBags,
                collectionCount: wasteData.length
            }
        }
    });
});

// Dashboard Data
exports.getDashboardData = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    // Get all data in parallel for better performance
    const [electricityData, waterData, wasteData, sustainabilityProfile] = await Promise.all([
        ElectricityUsage.find({ userId }),
        WaterUsage.find({ userId }),
        WasteUsage.find({ userId }),
        SustainabilityProfile.findOne({ userId })
    ]);

    // Calculate eco score with sustainability profile consideration
    const ecoScore = calculateEcoScore(electricityData, waterData, wasteData, sustainabilityProfile);

    // Prepare chart data
    const sortedElectricityData = electricityData
        .sort((a, b) => new Date(a.billingMonth) - new Date(b.billingMonth))
        .slice(-6);

    const chartData = {
        labels: sortedElectricityData.length > 0 
            ? sortedElectricityData.map(d => 
                new Date(d.billingMonth).toLocaleString('default', { month: 'short', year: '2-digit' }))
            : ['Start'],
        datasets: [{
            data: sortedElectricityData.length > 0 
                ? sortedElectricityData.map(d => d.units)
                : [0],
            legend: ["Electricity Usage (Units)"]
        }]
    };

    // Key Metrics
    const keyMetrics = [
        { 
            id: 1, 
            title: 'Last Electricity Bill', 
            value: `${electricityData.length > 0 ? electricityData[electricityData.length - 1].units : 0} Units`, 
            icon: 'flash-outline',
            trend: electricityData.length > 1 ? 
                (electricityData[electricityData.length - 1].units - electricityData[electricityData.length - 2].units) : 0
        },
        { 
            id: 2, 
            title: 'Last Water Bill', 
            value: `${waterData.length > 0 ? waterData[waterData.length - 1].units : 0} Units`, 
            icon: 'water-outline',
            trend: waterData.length > 1 ? 
                (waterData[waterData.length - 1].units - waterData[waterData.length - 2].units) : 0
        },
        { 
            id: 3, 
            title: 'Last Waste Entry', 
            value: `${wasteData.length > 0 ? 
                (wasteData[wasteData.length - 1].plasticBags + 
                 wasteData[wasteData.length - 1].paperBags + 
                 wasteData[wasteData.length - 1].foodWasteBags) : 0} Bags`, 
            icon: 'trash-can-outline'
        },
        {
            id: 4,
            title: 'Eco Score',
            value: `${ecoScore}/100`,
            icon: 'leaf-outline'
        }
    ];

    res.status(200).json({
        ecoScore,
        keyMetrics,
        chartData,
        hasSustainabilityProfile: !!sustainabilityProfile,
        totalEntries: {
            electricity: electricityData.length,
            water: waterData.length,
            waste: wasteData.length
        }
    });
});

// Sustainability Profile Controllers
exports.setSustainabilityProfile = asyncHandler(async (req, res) => {
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

    // Validate array fields
    if (!Array.isArray(primaryWaterSources) || !Array.isArray(primaryEnergySources)) {
        return res.status(400).json({
            status: 'fail',
            message: 'Water sources and energy sources must be arrays'
        });
    }

    let profile = await SustainabilityProfile.findOne({ userId: req.user.id });

    const profileData = {
        primaryWaterSources,
        primaryEnergySources,
        separateWaste,
        compostWaste: compostWaste || false,
        plasticBagSize: plasticBagSize || 5,
        foodWasteBagSize: foodWasteBagSize || 5,
        paperWasteBagSize: paperWasteBagSize || 5,
        lastUpdated: new Date(),
        profileCompleted: true
    };

    if (profile) {
        // Update existing profile
        profile = await SustainabilityProfile.findOneAndUpdate(
            { userId: req.user.id },
            profileData,
            { new: true, runValidators: true }
        );
    } else {
        // Create new profile
        profile = await SustainabilityProfile.create({
            userId: req.user.id,
            ...profileData
        });
    }

    res.status(200).json({
        status: 'success',
        message: 'Sustainability profile updated successfully',
        data: { sustainabilityProfile: profile }
    });
});

exports.getSustainabilityProfile = asyncHandler(async (req, res) => {
    const profile = await SustainabilityProfile.findOne({ userId: req.user.id });

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
});

//Check if sustainability profile exists
exports.checkSustainabilityProfile = asyncHandler(async (req, res) => {
    const profile = await SustainabilityProfile.findOne({ userId: req.user.id });

    res.status(200).json({
        status: 'success',
        data: { sustainabilityProfile: !!profile }
    });
})

// Additional utility endpoint
exports.getConsumptionStats = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    const [totalElectricity, totalWater, totalWaste, recentEntries] = await Promise.all([
        ElectricityUsage.aggregate([
            { $match: { userId } },
            { $group: { _id: null, total: { $sum: '$units' } } }
        ]),
        WaterUsage.aggregate([
            { $match: { userId } },
            { $group: { _id: null, total: { $sum: '$units' } } }
        ]),
        WasteUsage.aggregate([
            { $match: { userId } },
            { $group: { 
                _id: null, 
                plastic: { $sum: '$plasticBags' },
                paper: { $sum: '$paperBags' },
                food: { $sum: '$foodWasteBags' }
            }}
        ]),
        Promise.all([
            ElectricityUsage.findOne({ userId }).sort({ billingMonth: -1 }),
            WaterUsage.findOne({ userId }).sort({ billingMonth: -1 }),
            WasteUsage.findOne({ userId }).sort({ collectionDate: -1 })
        ])
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            totals: {
                electricity: totalElectricity[0]?.total || 0,
                water: totalWater[0]?.total || 0,
                waste: {
                    plastic: totalWaste[0]?.plastic || 0,
                    paper: totalWaste[0]?.paper || 0,
                    food: totalWaste[0]?.food || 0,
                    total: (totalWaste[0]?.plastic || 0) + (totalWaste[0]?.paper || 0) + (totalWaste[0]?.food || 0)
                }
            },
            recent: {
                electricity: recentEntries[0],
                water: recentEntries[1],
                waste: recentEntries[2]
            }
        }
    });
});
