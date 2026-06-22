const Case = require('../models/Case');
const { StorageFile } = require('../models/StorageFile');
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

    res.json({ case: caseItem });
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
  console.log('[案例创建] 请求体数据:', req.body ? '存在，长度: ' + JSON.stringify(req.body).length : '不存在');
  console.log('[案例创建] 文件数量:', req.files ? req.files.length : 0);
  console.log('========================================\n');
  
  try {
    let body = req.body;
    
    if (req.body.data) {
      try {
        body = JSON.parse(req.body.data);
      } catch (e) {
        console.error('[案例创建] 解析 data 字段失败:', e);
      }
    }
    
    const caseData = {
      ...body,
      id: generateCaseId(),
      authorId: req.user._id,
      author: req.user.name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      attachments: [],
      troubleshootingImages: [],
      causeAnalysisImages: [],
      solutionImages: []
    };

    // 处理通过预签名上传的附件（文件ID数组）
    if (body.attachments && Array.isArray(body.attachments)) {
      console.log(`[案例创建] 找到附件文件ID: ${body.attachments.length} 个`);
      
      for (const attachment of body.attachments) {
        if (attachment.fileId) {
          const storageFile = await StorageFile.findOne({ fileId: attachment.fileId, status: 'active' });
          
          if (storageFile) {
            console.log('[案例创建] 找到存储文件:', storageFile.fileId, storageFile.originalName);
            
            caseData.attachments.push({
              name: attachment.fileName || storageFile.originalName,
              url: `https://${process.env.VOLC_BUCKET}.${process.env.VOLC_ENDPOINT}/${storageFile.storagePath}`,
              storagePath: storageFile.storagePath,
              mimeType: storageFile.mimeType,
              size: storageFile.size,
              fileId: storageFile.fileId
            });
          } else {
            console.warn('[案例创建] 未找到存储文件:', attachment.fileId);
          }
        }
      }
    }

    // 兼容旧的表单上传方式
    const attachments = Array.isArray(req.files) ? req.files.filter(f => f.fieldname === 'attachments') : [];
    
    if (attachments.length > 0) {
      console.log(`[案例创建] 找到直接上传的附件文件: ${attachments.length} 个`);
      
      const storageAdapter = getStorageAdapter();
      
      for (const attachment of attachments) {
        const file = attachment;
        const ext = file.originalname.split('.').pop()?.toLowerCase();
        const safeFilename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;
        const objectKey = `uploads/documents/${safeFilename}`;
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
    }

    // 处理排查过程图片
    const troubleshootingImages = Array.isArray(req.files) ? req.files.filter(f => f.fieldname === 'troubleshootingImages') : [];
    if (troubleshootingImages.length > 0) {
      console.log(`[案例创建] 找到排查过程图片: ${troubleshootingImages.length} 个`);
      
      const storageAdapter = getStorageAdapter();
      
      for (const image of troubleshootingImages) {
        const file = image;
        const ext = file.originalname.split('.').pop()?.toLowerCase();
        const safeFilename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;
        const objectKey = `uploads/images/troubleshooting/${safeFilename}`;
        console.log('[案例创建] 上传排查过程图片:', objectKey);

        const result = await storageAdapter.putObject(objectKey, file.buffer, {
          contentType: file.mimetype || 'image/jpeg'
        });
        console.log('[案例创建] 排查过程图片上传成功:', objectKey);

        const imageUrl = `https://${process.env.VOLC_BUCKET}.${process.env.VOLC_ENDPOINT}/${encodeURI(objectKey)}`;
        console.log('[案例创建] 图片URL:', imageUrl);
        
        caseData.troubleshootingImages.push({
          name: file.originalname,
          url: imageUrl,
          storagePath: objectKey,
          mimeType: file.mimetype,
          size: file.size
        });
      }
    }

    // 处理原因分析图片
    const causeAnalysisImages = Array.isArray(req.files) ? req.files.filter(f => f.fieldname === 'causeAnalysisImages') : [];
    if (causeAnalysisImages.length > 0) {
      console.log(`[案例创建] 找到原因分析图片: ${causeAnalysisImages.length} 个`);
      
      const storageAdapter = getStorageAdapter();
      
      for (const image of causeAnalysisImages) {
        const file = image;
        const ext = file.originalname.split('.').pop()?.toLowerCase();
        const safeFilename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;
        const objectKey = `uploads/images/causeanalysis/${safeFilename}`;
        console.log('[案例创建] 上传原因分析图片:', objectKey);

        const result = await storageAdapter.putObject(objectKey, file.buffer, {
          contentType: file.mimetype || 'image/jpeg'
        });
        console.log('[案例创建] 原因分析图片上传成功:', objectKey);

        const imageUrl = `https://${process.env.VOLC_BUCKET}.${process.env.VOLC_ENDPOINT}/${encodeURI(objectKey)}`;
        console.log('[案例创建] 图片URL:', imageUrl);
        
        caseData.causeAnalysisImages.push({
          name: file.originalname,
          url: imageUrl,
          storagePath: objectKey,
          mimeType: file.mimetype,
          size: file.size
        });
      }
    }

    // 处理解决方案图片
    const solutionImages = Array.isArray(req.files) ? req.files.filter(f => f.fieldname === 'solutionImages') : [];
    if (solutionImages.length > 0) {
      console.log(`[案例创建] 找到解决方案图片: ${solutionImages.length} 个`);
      
      const storageAdapter = getStorageAdapter();
      
      for (const image of solutionImages) {
        const file = image;
        const ext = file.originalname.split('.').pop()?.toLowerCase();
        const safeFilename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;
        const objectKey = `uploads/images/solution/${safeFilename}`;
        console.log('[案例创建] 上传解决方案图片:', objectKey);

        const result = await storageAdapter.putObject(objectKey, file.buffer, {
          contentType: file.mimetype || 'image/jpeg'
        });
        console.log('[案例创建] 解决方案图片上传成功:', objectKey);

        const imageUrl = `https://${process.env.VOLC_BUCKET}.${process.env.VOLC_ENDPOINT}/${encodeURI(objectKey)}`;
        console.log('[案例创建] 图片URL:', imageUrl);
        
        caseData.solutionImages.push({
          name: file.originalname,
          url: imageUrl,
          storagePath: objectKey,
          mimeType: file.mimetype,
          size: file.size
        });
      }
    }

    const caseItem = await Case.create(caseData);
    res.status(201).json({ success: true, data: caseItem });
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

    const storageAdapter = getStorageAdapter();
    
    if (caseItem.attachments && caseItem.attachments.length > 0) {
      for (const attachment of caseItem.attachments) {
        if (attachment.storagePath) {
          try {
            await storageAdapter.deleteFile(attachment.storagePath);
          } catch (storageError) {
            console.error('Failed to delete attachment:', attachment.storagePath, storageError);
          }
        }
      }
    }

    await Case.findOneAndDelete({ id: req.params.id });
    res.json({ message: '案例已删除' });
  } catch (error) {
    console.error('deleteCase error:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

const toggleEssence = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '只有管理员可以操作' });
    }

    const caseItem = await Case.findOne({ id: req.params.id });

    if (!caseItem) {
      return res.status(404).json({ message: '案例不存在' });
    }

    caseItem.isEssence = !caseItem.isEssence;
    await caseItem.save();

    res.json({ 
      message: caseItem.isEssence ? '已设为精华案例' : '已取消精华案例',
      isEssence: caseItem.isEssence
    });
  } catch (error) {
    console.error('toggleEssence error:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

const togglePin = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '只有管理员可以操作' });
    }

    const caseItem = await Case.findOne({ id: req.params.id });

    if (!caseItem) {
      return res.status(404).json({ message: '案例不存在' });
    }

    caseItem.isPinned = !caseItem.isPinned;
    await caseItem.save();

    res.json({ 
      message: caseItem.isPinned ? '已置顶案例' : '已取消置顶',
      isPinned: caseItem.isPinned
    });
  } catch (error) {
    console.error('togglePin error:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
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
  toggleEssence,
  togglePin,
  likeCase,
  getCaseStats
};