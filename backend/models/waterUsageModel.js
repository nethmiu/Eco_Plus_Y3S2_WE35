const mongoose = require('mongoose');

const wasteUsageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  plasticBags: {
    type: Number,
    required: true,
    min: 0
  },
  paperBags: {
    type: Number,
    required: true,
    min: 0
  },
  foodWasteBags: {
    type: Number,
    required: true,
    min: 0
  },
  collectionDate: {
    type: Date,
    required: true
  },
  // These can be calculated from collectionDate, so they are optional
  collectionWeek: Number, 
  collectionMonth: Number
}, {
  timestamps: true  
});

// Index for fetching a user's waste entries quickly
wasteUsageSchema.index({ userId: 1, collectionDate: -1 });

module.exports = mongoose.model('WasteUsage', wasteUsageSchema);