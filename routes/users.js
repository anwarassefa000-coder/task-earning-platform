const express = require('express');
const User = require('../models/User');
const VIP = require('../models/VIP');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/profile/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        vipLevel: user.vipLevel,
        totalEarnings: user.totalEarnings,
        tasksCompleted: user.tasksCompleted,
        ordersCompleted: user.ordersCompleted,
        rating: user.rating,
        isVerified: user.isVerified,
        joinedDate: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { firstName, lastName, avatar, phone, address } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        firstName,
        lastName,
        avatar,
        phone,
        address,
        updatedAt: new Date()
      },
      { new: true }
    );

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        vipLevel: user.vipLevel
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user dashboard stats
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const vipInfo = await VIP.findOne({ level: user.vipLevel });

    res.json({
      stats: {
        totalEarnings: user.totalEarnings,
        accountBalance: user.accountBalance,
        tasksCompleted: user.tasksCompleted,
        ordersCompleted: user.ordersCompleted,
        rating: user.rating,
        vipLevel: user.vipLevel,
        vipBenefits: vipInfo?.benefits || []
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = 50;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('username vipLevel totalEarnings rating tasksCompleted ordersCompleted')
      .sort({ totalEarnings: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments();

    res.json({
      leaderboard: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user earnings history
router.get('/earnings', authMiddleware, async (req, res) => {
  try {
    const Payment = require('../models/Payment');
    const payments = await Payment.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      earnings: payments
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
