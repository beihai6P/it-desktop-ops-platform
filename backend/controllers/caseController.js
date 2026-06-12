const Case = require('../models/Case');
const { validationResult } = require('express-validator');

const generateCaseId = () => {
  return 'CASE-' + Date.now().toString(36).toUpperCase();
};

const getAllCases = async (req, res) => {
  const { status, difficulty, page = 1, limit = 10 } = req.query;
  const query = {};

  if (status) query.status = status;
  if (difficulty) query.difficulty = difficulty;

  try {
    const cases = await Case.find(query, null, {
      sort: { createdAt: -1 },
      limit: limit * 1,
      skip: (page - 1) * limit
    });

    const total = await Case.countDocuments(query);

    res.json({
      cases,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('getAllCases error:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

const getCaseById = async (req, res) => {
  try {
    const caseItem = await Case.findOne({ id: req.params.id });

    if (!caseItem) {
      return res.status(404).json({ message: '案例不存在' });
    }

    caseItem.views++;
    await caseItem.save();

    res.json(caseItem);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const createCase = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const caseData = {
      ...req.body,
      id: generateCaseId(),
      authorId: req.user._id,
      author: req.user.name,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const caseItem = await Case.create(caseData);
    res.status(201).json(caseItem);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const updateCase = async (req, res) => {
  try {
    const caseItem = await Case.findOne({ id: req.params.id });

    if (!caseItem) {
      return res.status(404).json({ message: '案例不存在' });
    }

    if (caseItem.authorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: '没有权限' });
    }

    const updatedCase = await Case.findOneAndUpdate(
      { id: req.params.id },
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );

    res.json(updatedCase);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const deleteCase = async (req, res) => {
  try {
    const caseItem = await Case.findOne({ id: req.params.id });

    if (!caseItem) {
      return res.status(404).json({ message: '案例不存在' });
    }

    if (caseItem.authorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: '没有权限' });
    }

    await Case.findOneAndDelete({ id: req.params.id });
    res.json({ message: '案例已删除' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const likeCase = async (req, res) => {
  try {
    const caseItem = await Case.findOne({ id: req.params.id });

    if (!caseItem) {
      return res.status(404).json({ message: '案例不存在' });
    }

    caseItem.likes++;
    await caseItem.save();

    res.json(caseItem);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const getCaseStats = async (req, res) => {
  try {
    const total = await Case.countDocuments();
    const resolved = await Case.countDocuments({ status: 'resolved' });
    const pending = await Case.countDocuments({ status: 'pending' });
    const inProgress = await Case.countDocuments({ status: 'in_progress' });

    res.json({
      total,
      resolved,
      pending,
      inProgress,
      resolutionRate: total > 0 ? ((resolved / total) * 100).toFixed(1) : 0
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

module.exports = {
  getAllCases,
  getCaseById,
  createCase,
  updateCase,
  deleteCase,
  likeCase,
  getCaseStats
};