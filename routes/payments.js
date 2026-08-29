const express = require('express');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');
const { validateWithdrawal } = require('../middleware/validation');

const router = express.Router();

// Get payment history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const { type, status, page = 1, limit = 20 } = req.query;
    
    let filter = { user: req.user._id };
    if (type) filter.type = type;
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const payments = await Payment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments(filter);

    res.json({
      payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get wallet balance
router.get('/wallet/balance', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      balance: user.accountBalance,
      totalEarnings: user.totalEarnings,
      currency: 'USD'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Request withdrawal
router.post('/withdrawal/request', authMiddleware, validateWithdrawal, async (req, res) => {
  try {
    const { amount, method, accountDetails } = req.body;
    const user = await User.findById(req.user._id);

    // Check balance
    if (amount > user.accountBalance) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Check minimum withdrawal amount
    if (amount < 10) {
      return res.status(400).json({ error: 'Minimum withdrawal amount is $10' });
    }

    // Calculate withdrawal fee
    const VIP = require('../models/VIP');
    const vipInfo = await VIP.findOne({ level: user.vipLevel });
    const fee = (amount * (vipInfo?.withdrawalFeePercentage || 5)) / 100;
    const netAmount = amount - fee;

    // Create withdrawal payment record
    const payment = await Payment.create({
      user: req.user._id,
      amount,
      type: 'withdrawal',
      method,
      status: 'pending',
      fee,
      netAmount,
      description: `Withdrawal request via ${method}`,
      relatedTo: 'manual',
      metadata: { accountDetails }
    });

    res.status(201).json({
      message: 'Withdrawal request submitted successfully',
      payment,
      details: {
        amount,
        fee,
        netAmount,
        status: 'pending'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Process deposit
router.post('/deposit', authMiddleware, async (req, res) => {
  try {
    const { amount, method } = req.body;

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    // Create deposit payment record
    const payment = await Payment.create({
      user: req.user._id,
      amount,
      type: 'deposit',
      method,
      status: 'processing',
      description: `Deposit via ${method}`,
      relatedTo: 'manual',
      netAmount: amount
    });

    // In production, integrate with Stripe or PayPal
    // For now, auto-complete after verification
    payment.status = 'completed';
    payment.processedAt = new Date();
    await payment.save();

    // Update user balance
    const user = await User.findById(req.user._id);
    user.accountBalance += amount;
    await user.save();

    res.status(201).json({
      message: 'Deposit processed successfully',
      payment,
      newBalance: user.accountBalance
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get withdrawal requests (admin)
router.get('/admin/withdrawals', authMiddleware, async (req, res) => {
  try {
    const payments = await Payment.find({ type: 'withdrawal' })
      .populate('user', 'username email')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ withdrawals: payments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve withdrawal (admin)
router.post('/admin/withdrawal/:paymentId/approve', authMiddleware, async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(
      req.params.paymentId,
      {
        status: 'completed',
        processedAt: new Date()
      },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json({ message: 'Withdrawal approved', payment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
