const mongoose = require('mongoose');

const electricityUsageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true // Makes querying by userId faster
  },
  billingMonth: {
    type: Date,
    required: true
  },
  units: {
    type: Number,
    required: true,
    min: 0 // Consumption can't be negative
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
  timestamps: true // This automatically adds `createdAt` and `updatedAt`
});

// Compound index for user and billing month (prevents duplicate entries for the same month)
electricityUsageSchema.index({ userId: 1, billingMonth: 1 }, { unique: true });

module.exports = mongoose.model('ElectricityUsage', electricityUsageSchema);