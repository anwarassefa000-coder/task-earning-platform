const express = require('express');
const VIP = require('../models/VIP');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all VIP levels
router.get('/levels', async (req, res) => {
  try {
    const vipLevels = await VIP.find().sort({ minPoints: 1 });
    res.json({ vipLevels });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get VIP level details
router.get('/:level', async (req, res) => {
  try {
    const vipLevel = await VIP.findOne({ level: req.params.level });
    if (!vipLevel) {
      return res.status(404).json({ error: 'VIP level not found' });
    }
    res.json({ vipLevel });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user's VIP info
router.get('/info/current', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const vipInfo = await VIP.findOne({ level: user.vipLevel });
    
    // Calculate progress to next level
    const nextLevelInfo = await VIP.findOne({ 
      minPoints: { $gt: vipInfo.minPoints } 
    }).sort({ minPoints: 1 });

    const currentProgress = ((user.totalEarnings - vipInfo.minPoints) / 
                            (nextLevelInfo ? nextLevelInfo.minPoints - vipInfo.minPoints : 100)) * 100;

    res.json({
      currentLevel: user.vipLevel,
      vipInfo,
      nextLevel: nextLevelInfo?.level || 'Max Level',
      totalEarnings: user.totalEarnings,
      progressToNextLevel: Math.min(100, Math.max(0, currentProgress)),
      accountBalance: user.accountBalance,
      tasksCompleted: user.tasksCompleted,
      ordersCompleted: user.ordersCompleted
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check VIP eligibility and auto-upgrade
router.post('/check-upgrade', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const nextVipLevel = await VIP.findOne({
      minPoints: { $lte: user.totalEarnings }
    }).sort({ minPoints: -1 });

    if (nextVipLevel && nextVipLevel.level !== user.vipLevel) {
      user.vipLevel = nextVipLevel.level;
      await user.save();

      res.json({
        upgraded: true,
        newLevel: nextVipLevel.level,
        benefits: nextVipLevel.benefits,
        message: `Congratulations! You've been upgraded to ${nextVipLevel.level.toUpperCase()} VIP level!`
      });
    } else {
      res.json({
        upgraded: false,
        currentLevel: user.vipLevel,
        message: 'Keep earning to upgrade to the next VIP level!'
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get VIP benefits comparison
router.get('/compare/all', async (req, res) => {
  try {
    const vipLevels = await VIP.find().sort({ minPoints: 1 });
    res.json({ comparison: vipLevels });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
