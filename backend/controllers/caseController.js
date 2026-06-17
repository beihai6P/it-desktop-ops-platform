const Case = require('../models/Case');
const { validationResult } = require('express-validator');
const { getStorageAdapter } = require('../services/storageAdapter');

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
  console.log('\n========================================');
  console.log('[案例创建] 请求开始');
  console.log('[案例创建] 时间:', new Date().toISOString());
  console.log('[案例创建] 方法:', req.method);
  console.log('[案例创建] URL:', req.originalUrl);
  console.log('[案例创建] 请求体数据:', req.body.data ? '存在，长度: ' + req.body.data.length : '不存在');
  console.log('[案例创建] 文件数量:', req.files ? req.files.length : 0);
  console.log('========================================\n');
  
  try {
    const body = req.body.data ? JSON.parse(req.body.data) : req.body;
    
    const caseData = {
      ...body,
      id: generateCaseId(),
      authorId: req.user._id,
      author: req.user.name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      attachments: []
    };

    const storageAdapter = getStorageAdapter();
    
    const attachments = Array.isArray(req.files) ? req.files.filter(f => f.fieldname === 'attachments') : [];
    
    if (attachments.length > 0) {
      console.log(`[案例创建] 找到附件文件: ${attachments.length} 个`);
      
      for (const attachment of attachments) {
        const file = attachment;
        const ext = file.originalname.split('.').pop()?.toLowerCase();
        const safeFilename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;
        const objectKey = `uploads/cases/${safeFilename}`;
        console.log('[案例创建] 上传附件:', objectKey);

        const result = await storageAdapter.putObject(objectKey, file.buffer, {
          contentType: file.mimetype || `application/octet-stream`
        });
        console.log('[案例创建] 附件上传成功:', objectKey);

        caseData.attachments.push({
          name: file.originalname,
          url: `https://${process.env.VOLC_BUCKET}.${process.env.VOLC_ENDPOINT}/${objectKey}`,
          storagePath: objectKey,
          mimeType: file.mimetype,
          size: file.size
        });
      }
    } else if (body.attachments && Array.isArray(body.attachments)) {
      caseData.attachments = body.attachments.map(att => ({
        name: att.name,
        url: att.url,
        storagePath: att.storagePath,
        mimeType: att.mimeType,
        size: att.size
      }));
    }

    const caseItem = await Case.create(caseData);
    res.status(201).json(caseItem);
  } catch (error) {
    console.error('[案例创建] 错误:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
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