const express = require('express');
const { body } = require('express-validator');
const {
  getAllDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  downloadDocument,
  toggleFavorite,
  getDocumentStats
} = require('../controllers/documentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', getAllDocuments);
router.get('/stats', getDocumentStats);
router.get('/:id', getDocumentById);
router.post(
  '/',
  protect,
  [
    body('title').notEmpty().withMessage('请输入文档标题'),
    body('category').notEmpty().withMessage('请选择分类'),
    body('type').notEmpty().withMessage('请选择类型')
  ],
  createDocument
);
router.put('/:id', protect, updateDocument);
router.delete('/:id', protect, deleteDocument);
router.post('/:id/download', downloadDocument);
router.post('/:id/favorite', protect, toggleFavorite);

module.exports = router;