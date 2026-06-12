const express = require('express');
const { body } = require('express-validator');
const {
  getAllCases,
  getCaseById,
  createCase,
  updateCase,
  deleteCase,
  likeCase,
  getCaseStats
} = require('../controllers/caseController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.get('/', getAllCases);
router.get('/stats', getCaseStats);
router.get('/:id', getCaseById);
router.post(
  '/',
  protect,
  [
    body('title').notEmpty().withMessage('请输入案例标题'),
    body('deviceType').notEmpty().withMessage('请选择设备类型'),
    body('brand').notEmpty().withMessage('请输入品牌'),
    body('model').notEmpty().withMessage('请输入型号'),
    body('symptoms').isArray().withMessage('症状必须是数组'),
    body('causeAnalysis').notEmpty().withMessage('请输入原因分析'),
    body('solution').notEmpty().withMessage('请输入解决方案')
  ],
  createCase
);
router.put('/:id', protect, updateCase);
router.delete('/:id', protect, deleteCase);
router.post('/:id/like', protect, likeCase);

module.exports = router;