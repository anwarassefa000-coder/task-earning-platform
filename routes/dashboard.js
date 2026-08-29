const express = require('express');
const User = require('../models/User');
const Task = require('../models/Task');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get user dashboard
router.get('/user', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const vipInfo = require('../models/VIP');
    const currentVipLevel = await vipInfo.findOne({ level: user.vipLevel });

    // Get recent tasks
    const recentTasks = await Task.find({ assignedTo: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5);

    // Get recent orders
    const recentOrders = await Order.find({ assignedWorker: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5);

    // Get recent payments
    const recentPayments = await Payment.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5);

    // Calculate earnings this month
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const thisMonthEarnings = await Payment.aggregate([
      {
        $match: {
          user: user._id,
          createdAt: { $gte: thisMonth },
          status: 'completed',
          type: { $in: ['task-reward', 'order-reward'] }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        vipLevel: user.vipLevel,
        rating: user.rating,
        isVerified: user.isVerified
      },
      stats: {
        totalEarnings: user.totalEarnings,
        accountBalance: user.accountBalance,
        tasksCompleted: user.tasksCompleted,
        ordersCompleted: user.ordersCompleted,
        thisMonthEarnings: thisMonthEarnings[0]?.total || 0
      },
      vipInfo: currentVipLevel,
      recentTasks,
      recentOrders,
      recentPayments
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get admin dashboard
router.get('/admin', authMiddleware, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalTasks = await Task.countDocuments();
    const totalOrders = await Order.countDocuments();
    const activeTasks = await Task.countDocuments({ status: 'active' });
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const processingOrders = await Order.countDocuments({ status: 'processing' });
    
    // Total payments processed this month
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const monthlyPayments = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: thisMonth },
          status: 'completed'
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // VIP distribution
    const vipDistribution = await User.aggregate([
      { $group: { _id: '$vipLevel', count: { $sum: 1 } } }
    ]);

    res.json({
      overview: {
        totalUsers,
        totalTasks,
        totalOrders,
        activeTasks,
        pendingOrders,
        processingOrders
      },
      monthlyPayments: monthlyPayments[0]?.total || 0,
      vipDistribution
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get analytics
router.get('/analytics', authMiddleware, async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    let startDate = new Date();
    if (period === '7d') startDate.setDate(startDate.getDate() - 7);
    if (period === '30d') startDate.setMonth(startDate.getMonth() - 1);
    if (period === '90d') startDate.setMonth(startDate.getMonth() - 3);

    // Daily earnings
    const dailyEarnings = await Payment.aggregate([
      {
        $match: {
          user: req.user._id,
          createdAt: { $gte: startDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          amount: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Tasks vs Orders
    const tasksStats = await Payment.countDocuments({
      user: req.user._id,
      type: 'task-reward',
      createdAt: { $gte: startDate }
    });

    const ordersStats = await Payment.countDocuments({
      user: req.user._id,
      type: 'order-reward',
      createdAt: { $gte: startDate }
    });

    res.json({
      period,
      dailyEarnings,
      taskCount: tasksStats,
      orderCount: ordersStats,
      comparison: {
        tasks: tasksStats,
        orders: ordersStats
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
