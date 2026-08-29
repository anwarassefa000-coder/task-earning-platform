const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'task-reward', 'order-reward', 'referral-bonus', 'vip-bonus'],
    required: true
  },
  method: {
    type: String,
    enum: ['bank-transfer', 'wallet', 'credit-card', 'debit-card', 'paypal', 'stripe'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  transactionId: String,
  description: String,
  relatedTo: {
    type: String,
    enum: ['task', 'order', 'referral', 'manual'],
    required: true
  },
  relatedId: mongoose.Schema.Types.ObjectId,
  fee: {
    type: Number,
    default: 0
  },
  netAmount: Number,
  metadata: mongoose.Schema.Types.Mixed,
  processedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ type: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
