const express = require('express');
const { body } = require('express-validator');
const {
  getAllTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
  assignTicket,
  resolveTicket,
  getTicketStats
} = require('../controllers/ticketController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.get('/', getAllTickets);
router.get('/stats', getTicketStats);
router.get('/:id', getTicketById);
router.post(
  '/',
  protect,
  [
    body('title').notEmpty().withMessage('请输入工单标题'),
    body('priority').isIn(['high', 'medium', 'low']).withMessage('无效的优先级')
  ],
  createTicket
);
router.put('/:id', protect, updateTicket);
router.delete('/:id', protect, admin, deleteTicket);
router.post('/:id/assign', protect, admin, assignTicket);
router.post('/:id/resolve', protect, resolveTicket);

module.exports = router;