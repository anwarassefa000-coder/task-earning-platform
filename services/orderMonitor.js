const mongoose = require('mongoose');
const cron = require('node-cron');
const Order = require('../models/Order');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Payment = require('../models/Payment');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ Order Monitor: MongoDB connected');
}).catch(err => {
  console.error('❌ Order Monitor: MongoDB connection error:', err);
  process.exit(1);
});

// Order status flow
const ORDER_STATUS_FLOW = {
  'pending': 'confirmed',
  'confirmed': 'processing',
  'processing': 'shipped',
  'shipped': 'delivered'
};

// Check and process pending orders
async function processPendingOrders() {
  try {
    const pendingOrders = await Order.find({ 
      status: 'pending',
      isMonitored: true 
    });

    console.log(`\n📋 Processing ${pendingOrders.length} pending orders...`);

    for (const order of pendingOrders) {
      try {
        // Check if order needs auto-confirmation
        const createdTime = new Date(order.createdAt);
        const currentTime = new Date();
        const diffMinutes = (currentTime - createdTime) / (1000 * 60);

        if (diffMinutes > 2) {
          order.status = 'confirmed';
          order.paymentStatus = 'paid';
          order.lastAttempt = new Date();
          await order.save();

          console.log(`✅ Order ${order.orderId} auto-confirmed`);

          // Notify customers
          await Notification.create({
            title: 'Order Confirmed',
            message: `Your order ${order.orderId} has been confirmed`,
            type: 'order',
            relatedId: order._id,
            priority: 'medium'
          });
        }
      } catch (err) {
        console.error(`❌ Error processing order ${order.orderId}:`, err.message);
        order.retryCount += 1;
        if (order.retryCount < process.env.MAX_RETRIES || 3) {
          order.lastAttempt = new Date();
          await order.save();
        }
      }
    }
  } catch (error) {
    console.error('❌ Error in processPendingOrders:', error.message);
  }
}

// Process confirmed orders
async function processConfirmedOrders() {
  try {
    const confirmedOrders = await Order.find({ 
      status: 'confirmed',
      isMonitored: true,
      assignedWorker: { $exists: false }
    }).limit(10);

    console.log(`\n👥 Assigning ${confirmedOrders.length} orders to workers...`);

    for (const order of confirmedOrders) {
      try {
        // Find available worker with matching VIP level
        const worker = await User.findOne({
          isActive: true,
          vipLevel: { $in: ['silver', 'gold', 'platinum', 'diamond'] }
        }).sort({ totalEarnings: -1 });

        if (worker) {
          order.assignedWorker = worker._id;
          order.status = 'processing';
          await order.save();

          console.log(`👤 Order ${order.orderId} assigned to ${worker.username}`);

          // Notify worker
          await Notification.create({
            user: worker._id,
            title: 'New Order Assignment',
            message: `You have been assigned order ${order.orderId} worth $${order.totalAmount}`,
            type: 'order',
            relatedId: order._id,
            actionUrl: `/orders/${order._id}`,
            priority: 'high'
          });
        } else {
          console.log(`⚠️ No available workers for order ${order.orderId}`);
        }
      } catch (err) {
        console.error(`❌ Error assigning order ${order.orderId}:`, err.message);
      }
    }
  } catch (error) {
    console.error('❌ Error in processConfirmedOrders:', error.message);
  }
}

// Process orders in progress
async function processInProgressOrders() {
  try {
    const inProgressOrders = await Order.find({ 
      status: 'processing',
      isMonitored: true,
      assignedWorker: { $exists: true }
    }).limit(10);

    console.log(`\n⏳ Updating ${inProgressOrders.length} orders in progress...`);

    for (const order of inProgressOrders) {
      try {
        // Auto-update status for demonstration
        const processingTime = new Date() - new Date(order.updatedAt);
        const minutes = Math.floor(processingTime / 60000);

        if (minutes > 5) {
          order.status = 'shipped';
          order.lastAttempt = new Date();
          await order.save();

          console.log(`📦 Order ${order.orderId} marked as shipped`);

          // Notify customer
          await Notification.create({
            title: 'Order Shipped',
            message: `Your order ${order.orderId} has been shipped`,
            type: 'order',
            relatedId: order._id,
            priority: 'medium'
          });
        }
      } catch (err) {
        console.error(`❌ Error updating order ${order.orderId}:`, err.message);
      }
    }
  } catch (error) {
    console.error('❌ Error in processInProgressOrders:', error.message);
  }
}

// Process shipped orders
async function processShippedOrders() {
  try {
    const shippedOrders = await Order.find({ 
      status: 'shipped',
      isMonitored: true 
    }).limit(10);

    console.log(`\n🚚 Delivering ${shippedOrders.length} orders...`);

    for (const order of shippedOrders) {
      try {
        const shippedTime = new Date() - new Date(order.updatedAt);
        const minutes = Math.floor(shippedTime / 60000);

        if (minutes > 3) {
          order.status = 'delivered';
          order.completedAt = new Date();
          await order.save();

          // Calculate and process reward
          const worker = await User.findById(order.assignedWorker);
          if (worker) {
            let reward = order.reward || (order.totalAmount * 0.05);

            // Apply VIP bonuses
            if (worker.vipLevel === 'silver') reward *= 1.05;
            else if (worker.vipLevel === 'gold') reward *= 1.10;
            else if (worker.vipLevel === 'platinum') reward *= 1.15;
            else if (worker.vipLevel === 'diamond') reward *= 1.20;

            worker.ordersCompleted += 1;
            worker.totalEarnings += reward;
            worker.accountBalance += reward;
            await worker.save();

            // Create payment record
            await Payment.create({
              user: worker._id,
              amount: reward,
              type: 'order-reward',
              method: 'wallet',
              status: 'completed',
              description: `Auto-reward for order ${order.orderId}`,
              relatedTo: 'order',
              relatedId: order._id,
              netAmount: reward,
              processedAt: new Date()
            });

            console.log(`💰 Order ${order.orderId} completed. Reward $${reward.toFixed(2)} to ${worker.username}`);

            // Notify worker
            await Notification.create({
              user: worker._id,
              title: 'Order Completed & Rewarded',
              message: `You earned $${reward.toFixed(2)} for completing order ${order.orderId}`,
              type: 'payment',
              relatedId: order._id,
              priority: 'high'
            });
          }
        }
      } catch (err) {
        console.error(`❌ Error completing order ${order.orderId}:`, err.message);
      }
    }
  } catch (error) {
    console.error('❌ Error in processShippedOrders:', error.message);
  }
}

// Retry failed orders
async function retryFailedOrders() {
  try {
    const failedOrders = await Order.find({
      $or: [
        { status: 'pending', retryCount: { $lt: 3 } },
        { status: 'confirmed', retryCount: { $lt: 3 } }
      ],
      isMonitored: true
    });

    console.log(`\n🔄 Retrying ${failedOrders.length} failed orders...`);

    for (const order of failedOrders) {
      try {
        if (order.status === 'pending') {
          order.status = 'confirmed';
          order.paymentStatus = 'paid';
        }
        order.retryCount += 1;
        order.lastAttempt = new Date();
        await order.save();

        console.log(`🔄 Retry ${order.retryCount} for order ${order.orderId}`);
      } catch (err) {
        console.error(`❌ Error retrying order ${order.orderId}:`, err.message);
      }
    }
  } catch (error) {
    console.error('❌ Error in retryFailedOrders:', error.message);
  }
}

// Health check
async function healthCheck() {
  try {
    const totalOrders = await Order.countDocuments({ isMonitored: true });
    const pendingOrders = await Order.countDocuments({ status: 'pending', isMonitored: true });
    const processingOrders = await Order.countDocuments({ status: 'processing', isMonitored: true });
    const deliveredOrders = await Order.countDocuments({ status: 'delivered', isMonitored: true });

    console.log(`\n📊 Order Monitor Health Check:`);
    console.log(`   Total Monitored: ${totalOrders}`);
    console.log(`   Pending: ${pendingOrders}`);
    console.log(`   Processing: ${processingOrders}`);
    console.log(`   Delivered: ${deliveredOrders}`);
  } catch (error) {
    console.error('❌ Health check error:', error.message);
  }
}

// Schedule tasks
console.log('🚀 Starting Order Monitor Service...\n');

// Run every 5 seconds
cron.schedule('*/5 * * * * *', processPendingOrders);
cron.schedule('*/10 * * * * *', processConfirmedOrders);
cron.schedule('*/15 * * * * *', processInProgressOrders);
cron.schedule('*/20 * * * * *', processShippedOrders);

// Run every minute
cron.schedule('* * * * *', retryFailedOrders);

// Run every 5 minutes
cron.schedule('*/5 * * * *', healthCheck);

console.log('✅ Order Monitor scheduled tasks activated');
console.log('   - Process pending orders every 5 seconds');
console.log('   - Assign orders every 10 seconds');
console.log('   - Update in-progress orders every 15 seconds');
console.log('   - Deliver orders every 20 seconds');
console.log('   - Retry failed orders every minute');
console.log('   - Health check every 5 minutes\n');

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Order Monitor shutting down...');
  process.exit(0);
});
