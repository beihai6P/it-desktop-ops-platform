const express = require('express');
const { body } = require('express-validator');
const {
  register,
  login,
  getMe,
  updateUser,
  getAllUsers,
  getUserById,
  updateUserById,
  deleteUser
} = require('../controllers/authController');
const userController = require('../controllers/userController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('请输入用户名'),
    body('email').isEmail().withMessage('请输入有效的邮箱'),
    body('password').isLength({ min: 6 }).withMessage('密码至少需要6个字符')
  ],
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('请输入有效的邮箱'),
    body('password').exists().withMessage('请输入密码')
  ],
  login
);

router.get('/me', protect, getMe);
router.put('/me', protect, updateUser);
router.get('/users', protect, admin, getAllUsers);
router.get('/users/stats', protect, admin, userController.getUserStats);
router.get('/users/:id', protect, admin, getUserById);
router.put('/users/:id', protect, admin, updateUserById);
router.delete('/users/:id', protect, admin, deleteUser);

module.exports = router;