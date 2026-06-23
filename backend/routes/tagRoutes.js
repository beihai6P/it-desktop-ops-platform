const express = require('express');
const {
  getAllTags,
  getPopularTags,
  getTagById,
  createTag,
  updateTag,
  deleteTag,
} = require('../controllers/tagController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.get('/', getAllTags);
router.get('/popular', getPopularTags);
router.get('/:id', getTagById);
router.post('/', protect, admin, createTag);
router.put('/:id', protect, admin, updateTag);
router.delete('/:id', protect, admin, deleteTag);

module.exports = router;