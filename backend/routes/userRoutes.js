const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { protect, authorize, requirePermission } = require('../middleware/auth');
const userController = require('../controllers/userController');

// 所有路由都需要管理员权限
router.use(protect);

// 获取所有用户
router.get('/', 
  requirePermission('USER_VIEW'),
  userController.getAllUsers
);

// 获取用户统计
router.get('/stats', 
  requirePermission('USER_VIEW'),
  userController.getUserStats
);

// 获取单个用户
router.get('/:id', 
  requirePermission('USER_VIEW'),
  userController.getUserById
);

// 创建用户
router.post('/',
  requirePermission('USER_CREATE'),
  [
    body('name').notEmpty().withMessage('用户名不能为空'),
    body('email').isEmail().withMessage('请输入有效的邮箱'),
    body('password').isLength({ min: 6 }).withMessage('密码长度至少为6个字符')
  ],
  userController.createUser
);

// 更新用户
router.put('/:id',
  requirePermission('USER_EDIT'),
  userController.updateUser
);

// 删除用户
router.delete('/:id',
  requirePermission('USER_DELETE'),
  userController.deleteUser
);

// 批量删除用户
router.post('/delete-multiple',
  requirePermission('USER_DELETE'),
  userController.deleteMultipleUsers
);

// 重置用户密码
router.post('/:id/reset-password',
  requirePermission('USER_EDIT'),
  userController.resetPassword
);

// 更新用户状态
router.post('/:id/toggle-status',
  requirePermission('USER_EDIT'),
  userController.toggleUserStatus
);

module.exports = router;
