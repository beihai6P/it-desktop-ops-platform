const Tool = require('../models/Tool');
const { StorageFile } = require('../models/StorageFile');
const { validationResult } = require('express-validator');
const { getStorageAdapter } = require('../services/storageAdapter');
const {
  parseRangeHeader,
  generateETag,
  formatFileSize,
  getMimeType
} = require('../utils/fileUtils');

// 存储适配器（强制使用火山引擎对象存储）
const storageAdapter = getStorageAdapter();

const generateToolId = () => {
  return 'TOOL-' + Date.now().toString(36).toUpperCase();
};

const generateCommentId = () => {
  return 'TC-' + Date.now().toString(36).toUpperCase();
};

const getAllTools = async (req, res) => {
  const { category, type, authorId, page = 1, limit = 10 } = req.query;
  const query = {};

  if (category) query.category = category;
  if (type) query.type = type;
  if (authorId) query.authorId = authorId;

  try {
    const tools = await Tool.find(query)
      .sort({ downloads: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Tool.countDocuments(query);

    res.json({
      tools,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const getToolById = async (req, res) => {
  try {
    const tool = await Tool.findOne({ id: req.params.id });

    if (!tool) {
      return res.status(404).json({ message: '工具不存在' });
    }

    // 如果工具关联了存储文件，获取文件大小信息
    if (tool.storageFileId) {
      const storageFile = await StorageFile.findOne({ fileId: tool.storageFileId, status: 'active' });
      if (storageFile) {
        tool.fileSize = formatFileSize(storageFile.size);
        tool.actualFileSize = storageFile.size;
        tool.actualMimeType = storageFile.mimeType;
        tool.hasRealFile = true;
      }
    }

    tool.views++;
    await tool.save();

    res.json({ tool });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const createTool = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const toolData = {
      ...req.body,
      id: generateToolId(),
      authorId: req.user._id,
      author: req.user.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comments: [],
      downloads: 0,
      views: 0,
      stars: 0
    };

    const tool = await Tool.create(toolData);
    res.status(201).json({ tool });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const updateTool = async (req, res) => {
  try {
    const tool = await Tool.findOne({ id: req.params.id });

    if (!tool) {
      return res.status(404).json({ message: '工具不存在' });
    }

    if (tool.authorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: '没有权限' });
    }

    const updatedTool = await Tool.findOneAndUpdate(
      { id: req.params.id },
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );

    res.json(updatedTool);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const deleteTool = async (req, res) => {
  try {
    const tool = await Tool.findOne({ id: req.params.id });

    if (!tool) {
      return res.status(404).json({ message: '工具不存在' });
    }

    if (tool.authorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: '没有权限' });
    }

    await Tool.findOneAndDelete({ id: req.params.id });
    res.json({ message: '工具已删除' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const downloadTool = async (req, res) => {
  const startTime = Date.now();
  const requestId = `DL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  console.log('\n========================================');
  console.log(`[${requestId}] 工具下载请求开始`);
  console.log(`[${requestId}] 时间: ${new Date().toISOString()}`);
  console.log(`[${requestId}] 工具ID: ${req.params.id}`);
  console.log(`[${requestId}] 请求来源: ${req.headers.origin || req.headers.referer || '未知'}`);
  console.log(`[${requestId}] 用户代理: ${req.headers['user-agent']}`);
  console.log(`[${requestId}] Range请求: ${req.headers.range || '无'}`);
  console.log('========================================\n');
  
  try {
    const tool = await Tool.findOne({ id: req.params.id });

    if (!tool) {
      console.log(`[${requestId}] ❌ 工具不存在`);
      return res.status(404).json({ message: '工具不存在' });
    }

    console.log(`[${requestId}] 工具信息:`);
    console.log(`[${requestId}]   - 名称: ${tool.name}`);
    console.log(`[${requestId}]   - 类型: ${tool.type}`);
    console.log(`[${requestId}]   - 作者: ${tool.author}`);
    console.log(`[${requestId}]   - storageFileId: ${tool.storageFileId || '无'}`);
    
    // 检查工具是否有关联的存储文件
    if (tool.storageFileId) {
      console.log(`[${requestId}] 查询存储文件...`);
      const storageFile = await StorageFile.findOne({ fileId: tool.storageFileId, status: 'active' });
      
      if (!storageFile) {
        console.log(`[${requestId}] ❌ 存储文件记录不存在`);
        return res.status(404).json({ message: '工具文件不存在或已被删除' });
      }
      
      console.log(`[${requestId}] 存储文件信息:`);
      console.log(`[${requestId}]   - fileId: ${storageFile.fileId}`);
      console.log(`[${requestId}]   - originalName: ${storageFile.originalName}`);
      console.log(`[${requestId}]   - mimeType: ${storageFile.mimeType}`);
      console.log(`[${requestId}]   - size: ${storageFile.size} 字节`);
      console.log(`[${requestId}]   - storagePath: ${storageFile.storagePath}`);
      console.log(`[${requestId}]   - status: ${storageFile.status}`);
      
      // 通过火山引擎对象存储获取文件信息
      console.log(`[${requestId}] 通过火山引擎对象存储获取文件信息...`);
      const fileInfo = await storageAdapter.getObjectInfo(storageFile.storagePath);
      
      if (!fileInfo) {
        console.log(`[${requestId}] ❌ 文件不存在于火山引擎对象存储`);
        return res.status(404).json({ message: '工具文件不存在或已被删除' });
      }
      
      const fileSize = fileInfo.contentLength;
      console.log(`[${requestId}] 文件存在: ✅ 是`);
      console.log(`[${requestId}] 实际文件大小: ${fileSize} 字节`);
      
      // 更新工具下载计数
      tool.downloads++;
      await tool.save();
      console.log(`[${requestId}] 更新下载计数: ${tool.downloads}`);

      // 处理Range请求（断点续传）
      const rangeHeader = req.headers.range;
      if (rangeHeader) {
        console.log(`[${requestId}] 处理Range请求: ${rangeHeader}`);
        const ranges = parseRangeHeader(rangeHeader, fileSize);
        
        if (!ranges) {
          console.log(`[${requestId}] ❌ Range请求无效`);
          return res.status(416).json({ message: '请求范围无效' });
        }

        const { start, end } = ranges[0];
        const chunkSize = end - start + 1;
        
        console.log(`[${requestId}] Range范围: ${start}-${end}/${fileSize}`);
        console.log(`[${requestId}] 分块大小: ${chunkSize} 字节`);

        // 设置响应头
        res.status(206);
        res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
        res.setHeader('Content-Length', chunkSize);
        res.setHeader('Content-Type', storageFile.mimeType);
        
        // 处理中文文件名编码（优先使用工具名称）
        const downloadFilename = tool.name + (storageFile.extension ? '.' + storageFile.extension : '');
        const encodedFilename = encodeURIComponent(downloadFilename);
        const asciiFilename = downloadFilename.replace(/[^\x00-\x7F]/g, '_').replace(/"/g, '\\"');
        
        res.setHeader('Content-Disposition', `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodedFilename}`);
        res.setHeader('ETag', generateETag(storageFile.hash.sha256, storageFile.size, storageFile.updatedAt));
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.setHeader('Last-Modified', storageFile.updatedAt.toUTCString());
        
        console.log(`[${requestId}] 响应头设置完成 (Range请求)`);
        console.log(`[${requestId}]   - Content-Type: ${storageFile.mimeType}`);
        console.log(`[${requestId}]   - Content-Disposition: attachment; filename="${storageFile.originalName}"`);
        console.log(`[${requestId}]   - Content-Length: ${chunkSize}`);

        // 使用火山引擎对象存储获取文件流
        const result = await storageAdapter.getObjectStream(storageFile.storagePath, { start, end });
        result.stream.pipe(res);

        result.stream.on('error', (error) => {
          console.error(`[${requestId}] ❌ 文件流错误:`, error);
          if (!res.headersSent) {
            res.status(500).json({ message: '文件读取失败' });
          }
        });

        result.stream.on('end', () => {
          storageFile.incrementDownload(chunkSize);
          const endTime = Date.now();
          console.log(`[${requestId}] ✅ Range下载完成`);
          console.log(`[${requestId}] 耗时: ${endTime - startTime}ms`);
          console.log('========================================\n');
        });

        return;
      }

      // 完整文件下载
      console.log(`[${requestId}] 设置完整文件下载响应头...`);
      res.setHeader('Content-Type', storageFile.mimeType);
      
      // 处理中文文件名编码（优先使用工具名称）
      const downloadFilename = tool.name + (storageFile.extension ? '.' + storageFile.extension : '');
      const encodedFilename = encodeURIComponent(downloadFilename);
      const asciiFilename = downloadFilename.replace(/[^\x00-\x7F]/g, '_').replace(/"/g, '\\"');
      
      res.setHeader('Content-Disposition', `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodedFilename}`);
      res.setHeader('Content-Length', fileSize);
      res.setHeader('ETag', generateETag(storageFile.hash.sha256, storageFile.size, storageFile.updatedAt));
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.setHeader('Last-Modified', storageFile.updatedAt.toUTCString());
      
      console.log(`[${requestId}] 响应头设置完成 (完整下载)`);
      console.log(`[${requestId}]   - Content-Type: ${storageFile.mimeType}`);
      console.log(`[${requestId}]   - Content-Disposition: attachment; filename="${downloadFilename}"`);
      console.log(`[${requestId}]   - Content-Length: ${fileSize}`);
      console.log(`[${requestId}]   - Accept-Ranges: bytes`);

      // 检查If-None-Match（缓存验证）
      const ifNoneMatch = req.headers['if-none-match'];
      const etag = generateETag(storageFile.hash.sha256, storageFile.size, storageFile.updatedAt);
      if (ifNoneMatch && ifNoneMatch === etag) {
        console.log(`[${requestId}] ⚠️ 缓存命中，返回304`);
        return res.status(304).end();
      }

      console.log(`[${requestId}] 开始从火山引擎对象存储传输文件流...`);
      
      // 使用火山引擎对象存储获取文件流
      const result = await storageAdapter.getObjectStream(storageFile.storagePath);
      result.stream.pipe(res);

      result.stream.on('error', (error) => {
        console.error(`[${requestId}] ❌ 文件流错误:`, error);
        if (!res.headersSent) {
          res.status(500).json({ message: '文件读取失败' });
        }
      });

      result.stream.on('end', () => {
        storageFile.incrementDownload(fileSize);
        const endTime = Date.now();
        console.log(`[${requestId}] ✅ 完整下载完成`);
        console.log(`[${requestId}] 传输大小: ${fileSize} 字节`);
        console.log(`[${requestId}] 耗时: ${endTime - startTime}ms`);
        console.log('========================================\n');
      });

      return;
    }

    // 如果没有关联存储文件
    console.log(`[${requestId}] ❌ 工具没有关联存储文件`);
    return res.status(404).json({ message: '工具文件不存在或已被删除' });
  } catch (error) {
    console.error(`[${requestId}] ❌ 下载错误:`, error);
    console.error(`[${requestId}] 错误堆栈:`, error.stack);
    res.status(500).json({ message: '服务器错误' });
  }
};

const addComment = async (req, res) => {
  const { content, rating } = req.body;

  try {
    const tool = await Tool.findOne({ id: req.params.id });

    if (!tool) {
      return res.status(404).json({ message: '工具不存在' });
    }

    const comment = {
      id: generateCommentId(),
      userId: req.user._id,
      userName: req.user.name,
      content,
      rating: rating || 0,
      createdAt: Date.now(),
      replies: []
    };

    tool.comments.push(comment);
    
    if (rating) {
      const totalRating = tool.comments.reduce((sum, c) => sum + (c.rating || 0), 0);
      tool.stars = (totalRating / tool.comments.length).toFixed(1);
    }
    
    await tool.save();

    res.json(tool);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const addCommentReply = async (req, res) => {
  const { commentId, content } = req.body;

  try {
    const tool = await Tool.findOne({ id: req.params.id });

    if (!tool) {
      return res.status(404).json({ message: '工具不存在' });
    }

    const comment = tool.comments.find(c => c.id === commentId);
    if (!comment) {
      return res.status(404).json({ message: '评论不存在' });
    }

    const reply = {
      id: generateCommentId() + '-R',
      userId: req.user._id,
      userName: req.user.name,
      content,
      createdAt: Date.now()
    };

    comment.replies.push(reply);
    await tool.save();

    res.json(tool);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const verifyTool = async (req, res) => {
  try {
    const tool = await Tool.findOne({ id: req.params.id });

    if (!tool) {
      return res.status(404).json({ message: '工具不存在' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '没有权限' });
    }

    tool.isVerified = true;
    tool.updatedAt = Date.now();
    await tool.save();

    res.json(tool);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const featureTool = async (req, res) => {
  try {
    const tool = await Tool.findOne({ id: req.params.id });

    if (!tool) {
      return res.status(404).json({ message: '工具不存在' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '没有权限' });
    }

    tool.isFeatured = !tool.isFeatured;
    tool.updatedAt = Date.now();
    await tool.save();

    res.json(tool);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const getToolStats = async (req, res) => {
  try {
    const total = await Tool.countDocuments();
    const totalDownloads = await Tool.aggregate([{ $group: { _id: null, total: { $sum: '$downloads' } } }]);
    const avgRating = await Tool.aggregate([{ $group: { _id: null, avg: { $avg: '$stars' } } }]);
    const featuredCount = await Tool.countDocuments({ isFeatured: true });
    const verifiedCount = await Tool.countDocuments({ isVerified: true });

    res.json({
      total,
      totalDownloads: totalDownloads[0]?.total || 0,
      avgRating: avgRating[0]?.avg ? avgRating[0].avg.toFixed(1) : 0,
      featuredCount,
      verifiedCount
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

module.exports = {
  getAllTools,
  getToolById,
  createTool,
  updateTool,
  deleteTool,
  downloadTool,
  addComment,
  addCommentReply,
  verifyTool,
  featureTool,
  getToolStats
};