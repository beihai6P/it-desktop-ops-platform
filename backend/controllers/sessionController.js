const Session = require('../models/Session');
const { validationResult } = require('express-validator');

const generateSessionId = () => {
  return 'SESSION-' + Date.now().toString(36).toUpperCase();
};

const getAllSessions = async (req, res) => {
  const { status, type, page = 1, limit = 10 } = req.query;
  const query = {};

  if (status) query.status = status;
  if (type) query.type = type;

  try {
    const sessions = await Session.find(query)
      .sort({ startTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Session.countDocuments(query);

    res.json({
      sessions,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const getSessionById = async (req, res) => {
  try {
    const session = await Session.findOne({ id: req.params.id });

    if (!session) {
      return res.status(404).json({ message: '会话不存在' });
    }

    res.json(session);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const createSession = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const sessionData = {
      ...req.body,
      id: generateSessionId(),
      participantList: [],
      participants: 0,
      createdAt: Date.now()
    };

    const session = await Session.create(sessionData);
    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const updateSession = async (req, res) => {
  try {
    const session = await Session.findOne({ id: req.params.id });

    if (!session) {
      return res.status(404).json({ message: '会话不存在' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '没有权限' });
    }

    const updatedSession = await Session.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true }
    );

    res.json(updatedSession);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const deleteSession = async (req, res) => {
  try {
    const session = await Session.findOne({ id: req.params.id });

    if (!session) {
      return res.status(404).json({ message: '会话不存在' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '没有权限' });
    }

    await Session.findOneAndDelete({ id: req.params.id });
    res.json({ message: '会话已删除' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const addParticipant = async (req, res) => {
  const { id, name, role = 'viewer' } = req.body;

  try {
    const session = await Session.findOne({ id: req.params.id });

    if (!session) {
      return res.status(404).json({ message: '会话不存在' });
    }

    const participant = {
      id,
      name,
      role,
      status: 'online'
    };

    session.participantList.push(participant);
    session.participants++;
    await session.save();

    res.json(session);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const removeParticipant = async (req, res) => {
  const { participantId } = req.body;

  try {
    const session = await Session.findOne({ id: req.params.id });

    if (!session) {
      return res.status(404).json({ message: '会话不存在' });
    }

    session.participantList = session.participantList.filter(p => p.id !== participantId);
    session.participants = session.participantList.length;
    await session.save();

    res.json(session);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const startSession = async (req, res) => {
  try {
    const session = await Session.findOne({ id: req.params.id });

    if (!session) {
      return res.status(404).json({ message: '会话不存在' });
    }

    session.status = 'active';
    session.startTime = Date.now();
    await session.save();

    res.json(session);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const endSession = async (req, res) => {
  try {
    const session = await Session.findOne({ id: req.params.id });

    if (!session) {
      return res.status(404).json({ message: '会话不存在' });
    }

    session.status = 'ended';
    session.endTime = Date.now();
    await session.save();

    res.json(session);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const getSessionStats = async (req, res) => {
  try {
    const total = await Session.countDocuments();
    const active = await Session.countDocuments({ status: 'active' });
    const completed = await Session.countDocuments({ status: 'ended' });
    const pending = await Session.countDocuments({ status: 'pending' });

    res.json({
      total,
      active,
      completed,
      pending
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

module.exports = {
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
};