const express = require('express');
const { body } = require('express-validator');
const multer = require('multer');
const {
  getAllCases,
  getCaseById,
  createCase,
  updateCase,
  deleteCase,
  toggleEssence,
  togglePin,
  likeCase,
  getCaseStats
} = require('../controllers/caseController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'), false);
    }
  }
});

router.get('/', getAllCases);
router.get('/stats', getCaseStats);
router.get('/:id', getCaseById);
router.post('/', protect, upload.any(), createCase);
router.put('/:id', protect, updateCase);
router.delete('/:id', protect, deleteCase);
router.post('/:id/like', protect, likeCase);
router.post('/:id/essence', protect, admin, toggleEssence);
router.post('/:id/pin', protect, admin, togglePin);

module.exports = router;