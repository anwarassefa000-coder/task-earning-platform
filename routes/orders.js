const express = require('express');
const Order = require('../models/Order');
const User = require('../models/User');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all orders (with filters)
router.get('/', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    let filter = {};
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const orders = await Order.find(filter)
      .populate('customer', 'username email')
      .populate('assignedWorker', 'username rating')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    res.json({
      orders,
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

// Get single order
router.get('/:orderId', async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('customer', 'username email phone')
      .populate('assignedWorker', 'username rating email');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new order
router.post('/', async (req, res) => {
  try {
    const { orderId, customerId, items, totalAmount, paymentMethod, shippingAddress } = req.body;

    const order = new Order({
      orderId,
      customerId,
      items,
      totalAmount,
      paymentMethod,
      shippingAddress,
      status: 'pending',
      paymentStatus: 'unpaid',
      isMonitored: true
    });

    await order.save();

    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Assign order to worker
router.post('/:orderId/assign', authMiddleware, async (req, res) => {
  try {
    const { workerId } = req.body;
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const worker = await User.findById(workerId);
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    order.assignedWorker = workerId;
    order.status = 'processing';
    await order.save();

    // Notify worker
    await Notification.create({
      user: workerId,
      title: 'New Order Assigned',
      message: `Order ${order.orderId} has been assigned to you`,
      type: 'order',
      relatedId: order._id
    });

    res.json({
      message: 'Order assigned successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update order status
router.put('/:orderId/status', authMiddleware, async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.orderId,
      {
        status,
        paymentStatus,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      message: 'Order status updated',
      order
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Complete order and process reward
router.post('/:orderId/complete', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status === 'delivered') {
      return res.status(400).json({ error: 'Order already completed' });
    }

    // Calculate reward based on VIP level
    const worker = await User.findById(order.assignedWorker);
    let reward = order.reward || (order.totalAmount * 0.05); // 5% default

    if (worker.vipLevel === 'silver') reward *= 1.05;
    else if (worker.vipLevel === 'gold') reward *= 1.10;
    else if (worker.vipLevel === 'platinum') reward *= 1.15;
    else if (worker.vipLevel === 'diamond') reward *= 1.20;

    // Update order
    order.status = 'delivered';
    order.completedAt = new Date();
    order.reward = reward;
    await order.save();

    // Update worker stats and balance
    worker.ordersCompleted += 1;
    worker.totalEarnings += reward;
    worker.accountBalance += reward;
    await worker.save();

    // Create payment record
    await Payment.create({
      user: order.assignedWorker,
      amount: reward,
      type: 'order-reward',
      method: 'wallet',
      status: 'completed',
      description: `Reward for completing order ${order.orderId}`,
      relatedTo: 'order',
      relatedId: order._id,
      netAmount: reward,
      processedAt: new Date()
    });

    // Notify worker
    await Notification.create({
      user: order.assignedWorker,
      title: 'Order Completed',
      message: `You earned $${reward.toFixed(2)} for completing order ${order.orderId}`,
      type: 'payment',
      relatedId: order._id,
      priority: 'high'
    });

    res.json({
      message: 'Order completed and reward processed',
      order,
      reward
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
