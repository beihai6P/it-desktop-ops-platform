const Category = require('../models/Category');
const { v4: uuidv4 } = require('uuid');

const defaultCategories = [
  { name: '技术讨论', description: '讨论各种IT技术问题和解决方案', icon: 'zap', postCount: 128 },
  { name: '故障求助', description: '发布故障问题，寻求帮助', icon: 'help', postCount: 89 },
  { name: '经验分享', description: '分享运维经验和技巧', icon: 'book', postCount: 156 },
  { name: '工具推荐', description: '推荐实用的运维工具', icon: 'tag', postCount: 67 },
  { name: '行业资讯', description: '分享IT行业最新资讯', icon: 'news', postCount: 45 },
];

exports.getAllCategories = async (req, res) => {
  try {
    let categories = await Category.find().sort({ createdAt: -1 });
    
    if (categories.length === 0) {
      categories = await Category.insertMany(
        defaultCategories.map((cat, index) => ({
          ...cat,
          id: `cat-${Date.now()}-${index}`,
          createdAt: new Date(Date.now() - index * 1000),
        }))
      );
    }

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('获取分类失败:', error.message);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: '分类不存在',
      });
    }

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('获取分类失败:', error.message);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description, icon } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: '请输入分类名称',
      });
    }

    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: '分类名称已存在',
      });
    }

    const category = await Category.create({
      id: `cat-${uuidv4()}`,
      name,
      description: description || '',
      icon: icon || 'tag',
    });

    res.status(201).json({
      success: true,
      message: '分类创建成功',
      data: category,
    });
  } catch (error) {
    console.error('创建分类失败:', error.message);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { name, description, icon } = req.body;

    if (name) {
      const existingCategory = await Category.findOne({
        name,
        _id: { $ne: req.params.id },
      });
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: '分类名称已存在',
        });
      }
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        icon,
        updatedAt: Date.now(),
      },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: '分类不存在',
      });
    }

    res.status(200).json({
      success: true,
      message: '分类更新成功',
      data: category,
    });
  } catch (error) {
    console.error('更新分类失败:', error.message);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: '分类不存在',
      });
    }

    res.status(200).json({
      success: true,
      message: '分类删除成功',
    });
  } catch (error) {
    console.error('删除分类失败:', error.message);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
};