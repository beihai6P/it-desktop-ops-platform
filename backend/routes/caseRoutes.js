const express = require('express');
const { body } = require('express-validator');
const multer = require('multer');
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

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp',
      'text/plain', 'text/html', 'application/json',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/x-zip-compressed', 'application/zip', 'application/x-rar-compressed',
      'videomp4', 'video/avi', 'video/mov', 'video/webm'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'), false);
    }
  }
});

router.get('/', getAllCases);
router.get('/stats', getCaseStats);
router.get('/:id', getCaseById);
router.post(
  '/',
  protect,
  upload.array('attachments', 20),
  createCase
);
router.put('/:id', protect, updateCase);
router.delete('/:id', protect, deleteCase);
router.post('/:id/like', protect, likeCase);

module.exports = router;