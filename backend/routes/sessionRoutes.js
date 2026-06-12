const express = require('express');
const { body } = require('express-validator');
const {
  getAllSessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession,
  addParticipant,
  removeParticipant,
  startSession,
  endSession,
  getSessionStats
} = require('../controllers/sessionController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.get('/', getAllSessions);
router.get('/stats', getSessionStats);
router.get('/:id', getSessionById);
router.post(
  '/',
  protect,
  [
    body('title').notEmpty().withMessage('请输入会话标题'),
    body('startTime').notEmpty().withMessage('请输入开始时间'),
    body('type').isIn(['screen', 'video', 'chat']).withMessage('无效的会话类型')
  ],
  createSession
);
router.put('/:id', protect, updateSession);
router.delete('/:id', protect, admin, deleteSession);
router.post('/:id/participants', protect, addParticipant);
router.delete('/:id/participants', protect, removeParticipant);
router.post('/:id/start', protect, startSession);
router.post('/:id/end', protect, endSession);

module.exports = router;