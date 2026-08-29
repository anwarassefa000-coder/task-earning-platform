const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true,
    required: true
  },
  customerId: {
    type: String,
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  items: [{
    productId: String,
    productName: String,
    quantity: Number,
    price: Number
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'partially-paid', 'refunded'],
    default: 'unpaid'
  },
  paymentMethod: {
    type: String,
    enum: ['credit-card', 'debit-card', 'paypal', 'stripe', 'wallet'],
    required: true
  },
  transactionId: String,
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  notes: String,
  assignedWorker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processingTime: Number, // in minutes
  reward: {
    type: Number,
    default: 0
  },
  isMonitored: {
    type: Boolean,
    default: false
  },
  retryCount: {
    type: Number,
    default: 0
  },
  lastAttempt: Date,
  completedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ customerId: 1 });
orderSchema.index({ assignedWorker: 1 });

module.exports = mongoose.model('Order', orderSchema);
