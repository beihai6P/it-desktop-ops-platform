const Tag = require('../models/Tag');
const { v4: uuidv4 } = require('uuid');

const defaultTags = [
  { name: 'Linux', postCount: 234 },
  { name: 'Windows', postCount: 189 },
  { name: 'Docker', postCount: 156 },
  { name: 'Kubernetes', postCount: 123 },
  { name: 'Python', postCount: 267 },
  { name: 'Shell', postCount: 98 },
  { name: '网络', postCount: 145 },
  { name: '安全', postCount: 87 },
  { name: '自动化', postCount: 112 },
  { name: '监控', postCount: 134 },
];

exports.getAllTags = async (req, res) => {
  try {
    let tags = await Tag.find().sort({ postCount: -1 });

    if (tags.length === 0) {
      tags = await Tag.insertMany(
        defaultTags.map((tag, index) => ({
          ...tag,
          id: `tag-${Date.now()}-${index}`,
          createdAt: new Date(Date.now() - index * 1000),
        }))
      );
    }

    res.status(200).json({
      success: true,
      data: tags,
    });
  } catch (error) {
    console.error('获取标签失败:', error.message);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
};

exports.getPopularTags = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    let tags = await Tag.find().sort({ postCount: -1 }).limit(limit);

    if (tags.length === 0) {
      tags = await Tag.insertMany(
        defaultTags.map((tag, index) => ({
          ...tag,
          id: `tag-${Date.now()}-${index}`,
          createdAt: new Date(Date.now() - index * 1000),
        }))
      );
      tags = tags.slice(0, limit);
    }

    res.status(200).json({
      success: true,
      data: tags,
    });
  } catch (error) {
    console.error('获取热门标签失败:', error.message);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
};

exports.getTagById = async (req, res) => {
  try {
    const tag = await Tag.findById(req.params.id);

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: '标签不存在',
      });
    }

    res.status(200).json({
      success: true,
      data: tag,
    });
  } catch (error) {
    console.error('获取标签失败:', error.message);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
};

exports.createTag = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: '请输入标签名称',
      });
    }

    const existingTag = await Tag.findOne({ name });
    if (existingTag) {
      return res.status(400).json({
        success: false,
        message: '标签名称已存在',
      });
    }

    const tag = await Tag.create({
      id: `tag-${uuidv4()}`,
      name,
    });

    res.status(201).json({
      success: true,
      message: '标签创建成功',
      data: tag,
    });
  } catch (error) {
    console.error('创建标签失败:', error.message);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
};

exports.updateTag = async (req, res) => {
  try {
    const { name } = req.body;

    if (name) {
      const existingTag = await Tag.findOne({
        name,
        _id: { $ne: req.params.id },
      });
      if (existingTag) {
        return res.status(400).json({
          success: false,
          message: '标签名称已存在',
        });
      }
    }

    const tag = await Tag.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true }
    );

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: '标签不存在',
      });
    }

    res.status(200).json({
      success: true,
      message: '标签更新成功',
      data: tag,
    });
  } catch (error) {
    console.error('更新标签失败:', error.message);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
};

exports.deleteTag = async (req, res) => {
  try {
    const tag = await Tag.findByIdAndDelete(req.params.id);

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: '标签不存在',
      });
    }

    res.status(200).json({
      success: true,
      message: '标签删除成功',
    });
  } catch (error) {
    console.error('删除标签失败:', error.message);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
};