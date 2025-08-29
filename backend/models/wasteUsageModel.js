const mongoose = require('mongoose');

const waterUsageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  billingMonth: {
    type: Date,
    required: true
  },
  units: {
    type: Number,
    required: true,
    min: 0
  },
  lastReading: {
    type: Number,
    min: 0
  },
  latestReading: {
    type: Number,
    min: 0
  },
  accountNo: String
}, {
  timestamps: true
});

waterUsageSchema.index({ userId: 1, billingMonth: 1 }, { unique: true });

module.exports = mongoose.model('WaterUsage', waterUsageSchema);