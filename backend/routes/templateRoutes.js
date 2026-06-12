const express = require('express');
const { body } = require('express-validator');
const {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  downloadTemplate,
  verifyTemplate
} = require('../controllers/templateController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.get('/', getAllTemplates);
router.get('/:id', getTemplateById);
router.post(
  '/',
  protect,
  [
    body('title').notEmpty().withMessage('请输入模板标题'),
    body('category').notEmpty().withMessage('请选择分类'),
    body('type').notEmpty().withMessage('请选择类型')
  ],
  createTemplate
);
router.put('/:id', protect, admin, updateTemplate);
router.delete('/:id', protect, admin, deleteTemplate);
router.post('/:id/download', downloadTemplate);
router.post('/:id/verify', protect, admin, verifyTemplate);

module.exports = router;