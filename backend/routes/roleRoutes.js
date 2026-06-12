const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { protect, authorize, requirePermission } = require('../middleware/auth');
const roleController = require('../controllers/roleController');

// 所有路由都需要管理员权限
router.use(protect);

// 获取所有角色
router.get('/roles',
  requirePermission('ROLE_MANAGE'),
  roleController.getAllRoles
);

// 获取单个角色
router.get('/roles/:id',
  requirePermission('ROLE_MANAGE'),
  roleController.getRoleById
);

// 创建角色
router.post('/roles',
  requirePermission('ROLE_MANAGE'),
  [
    body('name').notEmpty().withMessage('角色名称不能为空'),
    body('code').notEmpty().withMessage('角色代码不能为空')
  ],
  roleController.createRole
);

// 更新角色
router.put('/roles/:id',
  requirePermission('ROLE_MANAGE'),
  roleController.updateRole
);

// 删除角色
router.delete('/roles/:id',
  requirePermission('ROLE_MANAGE'),
  roleController.deleteRole
);

// 获取所有权限
router.get('/permissions',
  requirePermission('ROLE_MANAGE'),
  roleController.getAllPermissions
);

// 创建权限
router.post('/permissions',
  requirePermission('ROLE_MANAGE'),
  [
    body('name').notEmpty().withMessage('权限名称不能为空'),
    body('code').notEmpty().withMessage('权限代码不能为空')
  ],
  roleController.createPermission
);

// 更新权限
router.put('/permissions/:id',
  requirePermission('ROLE_MANAGE'),
  roleController.updatePermission
);

// 删除权限
router.delete('/permissions/:id',
  requirePermission('ROLE_MANAGE'),
  roleController.deletePermission
);

// 初始化默认权限和角色
router.post('/init',
  requirePermission('ROLE_MANAGE'),
  roleController.initDefaultRolesAndPermissions
);

module.exports = router;
