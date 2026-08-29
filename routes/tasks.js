const express = require('express');
const Task = require('../models/Task');
const { authMiddleware } = require('../middleware/auth');
const { validateTask } = require('../middleware/validation');

const router = express.Router();

// Get all available tasks
router.get('/', async (req, res) => {
  try {
    const { category, difficulty, minReward, maxReward, page = 1, limit = 20 } = req.query;
    
    let filter = { status: 'active' };
    
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    if (minReward || maxReward) {
      filter.reward = {};
      if (minReward) filter.reward.$gte = parseFloat(minReward);
      if (maxReward) filter.reward.$lte = parseFloat(maxReward);
    }

    const skip = (page - 1) * limit;
    const tasks = await Task.find(filter)
      .populate('postedBy', 'username rating vipLevel')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Task.countDocuments(filter);

    res.json({
      tasks,
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

// Get task by ID
router.get('/:taskId', async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId)
      .populate('postedBy', 'username email rating vipLevel')
      .populate('assignedTo', 'username rating');

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ task });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new task
router.post('/', authMiddleware, validateTask, async (req, res) => {
  try {
    const { title, description, category, reward, estimatedTime, difficulty, instructions, deadline } = req.body;

    const task = new Task({
      title,
      description,
      category,
      reward,
      estimatedTime,
      difficulty,
      instructions,
      deadline,
      postedBy: req.user._id,
      status: 'active'
    });

    await task.save();
    await task.populate('postedBy', 'username rating vipLevel');

    res.status(201).json({
      message: 'Task created successfully',
      task
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Accept task
router.post('/:taskId/accept', authMiddleware, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (task.status !== 'active') {
      return res.status(400).json({ error: 'Task is not available' });
    }

    task.assignedTo = req.user._id;
    task.status = 'assigned';
    await task.save();

    res.json({
      message: 'Task accepted successfully',
      task
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit task work
router.post('/:taskId/submit', authMiddleware, async (req, res) => {
  try {
    const { workLink, notes } = req.body;
    const task = await Task.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const submission = {
      user: req.user._id,
      workLink,
      notes,
      submittedAt: new Date(),
      status: 'pending'
    };

    task.submittedWork.push(submission);
    await task.save();

    res.json({
      message: 'Work submitted successfully',
      task
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
