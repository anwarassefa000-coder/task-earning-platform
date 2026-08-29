const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const validateRegister = [
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Invalid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').optional().trim(),
  body('lastName').optional().trim(),
  handleValidationErrors
];

const validateLogin = [
  body('email').isEmail().withMessage('Invalid email'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

const validateTask = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('reward').isFloat({ min: 0 }).withMessage('Reward must be a positive number'),
  body('estimatedTime').isInt({ min: 1 }).withMessage('Estimated time must be at least 1 minute'),
  body('category').isIn(['data-entry', 'surveys', 'testing', 'writing', 'design', 'programming', 'marketing', 'other']),
  handleValidationErrors
];

const validateWithdrawal = [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('method').isIn(['bank-transfer', 'wallet', 'paypal']).withMessage('Invalid withdrawal method'),
  handleValidationErrors
];

module.exports = {
  validateRegister,
  validateLogin,
  validateTask,
  validateWithdrawal,
  handleValidationErrors
};
