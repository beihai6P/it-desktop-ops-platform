const Ticket = require('../models/Ticket');
const { validationResult } = require('express-validator');

const generateTicketId = () => {
  return 'TICKET-' + Date.now().toString(36).toUpperCase();
};

const getAllTickets = async (req, res) => {
  const { priority, status, assignee, creatorId, page = 1, limit = 10 } = req.query;
  const query = {};

  if (priority) query.priority = priority;
  if (status) query.status = status;
  if (assignee) query.assignee = assignee;
  if (creatorId) query.creatorId = creatorId;

  try {
    const tickets = await Ticket.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Ticket.countDocuments(query);

    res.json({
      tickets,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ id: req.params.id });

    if (!ticket) {
      return res.status(404).json({ message: '工单不存在' });
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const createTicket = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const ticketData = {
      ...req.body,
      id: generateTicketId(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const ticket = await Ticket.create(ticketData);
    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const updateTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ id: req.params.id });

    if (!ticket) {
      return res.status(404).json({ message: '工单不存在' });
    }

    if (req.user.role !== 'admin' && ticket.assigneeId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '没有权限' });
    }

    const updatedTicket = await Ticket.findOneAndUpdate(
      { id: req.params.id },
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );

    res.json(updatedTicket);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ id: req.params.id });

    if (!ticket) {
      return res.status(404).json({ message: '工单不存在' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '没有权限' });
    }

    await Ticket.findOneAndDelete({ id: req.params.id });
    res.json({ message: '工单已删除' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const assignTicket = async (req, res) => {
  const { assignee, assigneeId } = req.body;

  try {
    const ticket = await Ticket.findOne({ id: req.params.id });

    if (!ticket) {
      return res.status(404).json({ message: '工单不存在' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '没有权限' });
    }

    ticket.assignee = assignee;
    ticket.assigneeId = assigneeId;
    ticket.status = 'in_progress';
    ticket.updatedAt = Date.now();
    await ticket.save();

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const resolveTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ id: req.params.id });

    if (!ticket) {
      return res.status(404).json({ message: '工单不存在' });
    }

    if (req.user.role !== 'admin' && ticket.assigneeId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '没有权限' });
    }

    ticket.status = 'resolved';
    ticket.updatedAt = Date.now();
    await ticket.save();

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const getTicketStats = async (req, res) => {
  try {
    const total = await Ticket.countDocuments();
    const open = await Ticket.countDocuments({ status: 'open' });
    const inProgress = await Ticket.countDocuments({ status: 'in_progress' });
    const resolved = await Ticket.countDocuments({ status: 'resolved' });
    const highPriority = await Ticket.countDocuments({ priority: 'high' });
    const mediumPriority = await Ticket.countDocuments({ priority: 'medium' });
    const lowPriority = await Ticket.countDocuments({ priority: 'low' });

    res.json({
      total,
      open,
      inProgress,
      resolved,
      resolutionRate: total > 0 ? ((resolved / total) * 100).toFixed(1) : 0,
      priorityDistribution: {
        high: highPriority,
        medium: mediumPriority,
        low: lowPriority
      }
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

module.exports = {
  getAllTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
  assignTicket,
  resolveTicket,
  getTicketStats
};