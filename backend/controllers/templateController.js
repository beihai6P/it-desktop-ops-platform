const Template = require('../models/Template');
const { validationResult } = require('express-validator');

const generateTemplateId = () => {
  return 'TPL-' + Date.now().toString(36).toUpperCase();
};

const getAllTemplates = async (req, res) => {
  const { category, status, page = 1, limit = 10 } = req.query;
  const query = {};

  if (category) query.category = category;
  if (status) query.status = status;

  try {
    const templates = await Template.find(query)
      .sort({ downloads: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Template.countDocuments(query);

    res.json({
      templates,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const getTemplateById = async (req, res) => {
  try {
    const template = await Template.findOne({ id: req.params.id });

    if (!template) {
      return res.status(404).json({ message: '模板不存在' });
    }

    res.json(template);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const createTemplate = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const templateData = {
      ...req.body,
      id: generateTemplateId(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const template = await Template.create(templateData);
    res.status(201).json(template);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const updateTemplate = async (req, res) => {
  try {
    const template = await Template.findOne({ id: req.params.id });

    if (!template) {
      return res.status(404).json({ message: '模板不存在' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '没有权限' });
    }

    const updatedTemplate = await Template.findOneAndUpdate(
      { id: req.params.id },
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );

    res.json(updatedTemplate);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const deleteTemplate = async (req, res) => {
  try {
    const template = await Template.findOne({ id: req.params.id });

    if (!template) {
      return res.status(404).json({ message: '模板不存在' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '没有权限' });
    }

    await Template.findOneAndDelete({ id: req.params.id });
    res.json({ message: '模板已删除' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const downloadTemplate = async (req, res) => {
  try {
    const template = await Template.findOne({ id: req.params.id });

    if (!template) {
      return res.status(404).json({ message: '模板不存在' });
    }

    template.downloads++;
    await template.save();

    res.json(template);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const verifyTemplate = async (req, res) => {
  try {
    const template = await Template.findOne({ id: req.params.id });

    if (!template) {
      return res.status(404).json({ message: '模板不存在' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '没有权限' });
    }

    template.status = 'verified';
    template.updatedAt = Date.now();
    await template.save();

    res.json(template);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

module.exports = {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  downloadTemplate,
  verifyTemplate
};