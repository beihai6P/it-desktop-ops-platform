const Document = require('../models/Document');
const { validationResult } = require('express-validator');

const generateDocumentId = () => {
  return 'DOC-' + Date.now().toString(36).toUpperCase();
};

const getAllDocuments = async (req, res) => {
  const { category, type, status, authorId, page = 1, limit = 10 } = req.query;
  
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  
  if (pageNum < 1) return res.status(400).json({ message: '页码必须大于0' });
  if (limitNum < 1 || limitNum > 100) return res.status(400).json({ message: '每页数量必须在1-100之间' });
  
  const query = {};

  if (category) query.category = category;
  if (type) query.type = type;
  if (status) query.status = status;
  if (authorId) query.authorId = authorId;

  try {
    const documents = await Document.find(query)
      .sort({ updatedAt: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum);

    const total = await Document.countDocuments(query);

    res.status(200).json({
      documents,
      total,
      pages: Math.ceil(total / limitNum),
      currentPage: pageNum
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const getDocumentById = async (req, res) => {
  try {
    const document = await Document.findOne({ id: req.params.id });

    if (!document) {
      return res.status(404).json({ message: '文档不存在' });
    }

    document.views++;
    await document.save();

    res.status(200).json(document);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const createDocument = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const documentData = {
      ...req.body,
      id: generateDocumentId(),
      authorId: req.user._id,
      author: req.user.name,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const document = await Document.create(documentData);
    res.status(201).json(document);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const updateDocument = async (req, res) => {
  try {
    const document = await Document.findOne({ id: req.params.id });

    if (!document) {
      return res.status(404).json({ message: '文档不存在' });
    }

    if (document.authorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: '没有权限' });
    }

    const updatedDocument = await Document.findOneAndUpdate(
      { id: req.params.id },
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );

    res.status(200).json(updatedDocument);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findOne({ id: req.params.id });

    if (!document) {
      return res.status(404).json({ message: '文档不存在' });
    }

    if (document.authorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: '没有权限' });
    }

    await Document.findOneAndDelete({ id: req.params.id });
    res.status(200).json({ message: '文档已删除' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const downloadDocument = async (req, res) => {
  try {
    const document = await Document.findOne({ id: req.params.id });

    if (!document) {
      return res.status(404).json({ message: '文档不存在' });
    }

    document.downloads++;
    await document.save();

    res.status(200).json(document);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const toggleFavorite = async (req, res) => {
  try {
    const document = await Document.findOne({ id: req.params.id });

    if (!document) {
      return res.status(404).json({ message: '文档不存在' });
    }

    document.isFavorite = !document.isFavorite;
    document.favorites += document.isFavorite ? 1 : -1;
    await document.save();

    res.status(200).json(document);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const getDocumentStats = async (req, res) => {
  try {
    const total = await Document.countDocuments();
    const published = await Document.countDocuments({ status: 'published' });
    const draft = await Document.countDocuments({ status: 'draft' });
    const totalViews = await Document.aggregate([{ $group: { _id: null, total: { $sum: '$views' } } }]);
    const totalDownloads = await Document.aggregate([{ $group: { _id: null, total: { $sum: '$downloads' } } }]);

    res.status(200).json({
      total,
      published,
      draft,
      totalViews: totalViews[0]?.total || 0,
      totalDownloads: totalDownloads[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

module.exports = {
  getAllDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  downloadDocument,
  toggleFavorite,
  getDocumentStats
};