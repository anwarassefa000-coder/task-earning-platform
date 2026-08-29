const mongoose = require('mongoose');

const vipSchema = new mongoose.Schema({
  level: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
    unique: true,
    required: true
  },
  minPoints: {
    type: Number,
    required: true
  },
  maxPoints: Number,
  benefits: [{
    name: String,
    description: String,
    value: String
  }],
  commissionRate: {
    type: Number,
    default: 0 // percentage
  },
  taskBonus: {
    type: Number,
    default: 0 // percentage bonus on rewards
  },
  prioritySupport: Boolean,
  unlimitedTasks: Boolean,
  maxTasksPerDay: Number,
  dailyEarningCap: Number,
  withdrawalLimit: Number,
  withdrawalFeePercentage: {
    type: Number,
    default: 0
  },
  badgeIcon: String,
  badgeColor: String,
  description: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('VIP', vipSchema);
