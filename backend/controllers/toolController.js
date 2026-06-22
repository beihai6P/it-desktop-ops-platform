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
    // 解析请求体（支持 JSON 和 form-data）
    const body = req.body;
    const toolData = {
      name: body.name,
      description: body.description,
      longDescription: body.longDescription,
      category: body.category,
      type: body.type || 'tool',
      tags: typeof body.tags === 'string' ? JSON.parse(body.tags) : body.tags || [],
      version: body.version || '1.0.0',
      license: body.license,
      compatibility: typeof body.compatibility === 'string' ? JSON.parse(body.compatibility) : body.compatibility || [],
      storageFileId: body.storageFileId,
      screenshots: [],
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

    console.log('[工具创建] 请求体:', JSON.stringify(Object.keys(body)));
    console.log('[工具创建] req.files:', req.files ? req.files.length : 'undefined');
    console.log('[工具创建] body.screenshots:', body.screenshots);
    
    // upload.array('screenshots') 会将文件放在 req.files 数组中
    const screenshots = Array.isArray(req.files) ? req.files.filter(f => f.fieldname === 'screenshots') : [];
    
    console.log('[工具创建] 筛选后的截图文件:', screenshots.length, '个');
    
    if (screenshots.length > 0) {
      console.log('[工具创建] 找到截图文件:', screenshots.length, '个');
      
      for (let i = 0; i < screenshots.length; i++) {
        const screenshot = screenshots[i];
        const file = screenshot;
        
        console.log(`[工具创建] 处理截图 ${i+1}:`);
        console.log(`[工具创建]   - originalname: ${file.originalname}`);
        console.log(`[工具创建]   - mimetype: ${file.mimetype}`);
        console.log(`[工具创建]   - size: ${file.size} bytes`);
        console.log(`[工具创建]   - fieldname: ${file.fieldname}`);
        console.log(`[工具创建]   - buffer: ${file.buffer ? `Buffer(${file.buffer.length} bytes)` : 'null'}`);
        
        const ext = file.originalname.split('.').pop()?.toLowerCase();
        // 使用时间戳+随机字符串作为文件名，避免中文文件名的编码问题
        const safeFilename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;
        const objectKey = `uploads/images/${safeFilename}`;
        console.log(`[工具创建] 上传截图 ${i+1}: ${objectKey}`);

        try {
          // 上传截图到火山引擎对象存储
          const result = await storageAdapter.putObject(objectKey, file.buffer, {
            contentType: file.mimetype || `image/${ext}`
          });
          console.log(`[工具创建] 截图 ${i+1} 上传成功: ${objectKey}`);

          // 保存截图的key，通过后端代理访问
          toolData.screenshots.push(objectKey);
        } catch (uploadError) {
          console.error(`[工具创建] 截图 ${i+1} 上传失败:`, uploadError);
          throw new Error(`截图上传失败: ${uploadError.message}`);
        }
      }
    } else if (body.screenshots && Array.isArray(body.screenshots)) {
      // 兼容旧格式：如果已经是URL数组，直接使用
      toolData.screenshots = body.screenshots.filter(s => s.startsWith('http'));
      console.log('[工具创建] 使用已有的截图URL:', toolData.screenshots.length, '个');
    } else {
      console.log('[工具创建] 没有找到截图文件');
    }

    const tool = await Tool.create(toolData);
    res.status(201).json({ success: true, data: tool });
  } catch (error) {
    console.error('[工具创建] 错误:', error);
    console.error('[工具创建] 错误堆栈:', error.stack);
    res.status(500).json({ message: '服务器错误', error: error.message });
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

    const { getStorageAdapter } = require('../services/storageAdapter');
    const storageAdapter = getStorageAdapter();

    // 删除存储池中的主文件
    if (tool.storageFileId) {
      const storageFile = await StorageFile.findOne({ fileId: tool.storageFileId });
      if (storageFile && storageFile.storagePath) {
        try {
          await storageAdapter.deleteObject(storageFile.storagePath);
          console.log(`[工具删除] 删除存储文件: ${storageFile.storagePath}`);
        } catch (error) {
          console.error(`[工具删除] 删除存储文件失败:`, error);
        }
        // 删除数据库中的存储文件记录
        await StorageFile.deleteOne({ fileId: tool.storageFileId });
      }
    }

    // 删除存储池中的截图文件
    if (tool.screenshots && tool.screenshots.length > 0) {
      for (const screenshot of tool.screenshots) {
        // 判断是完整URL还是存储key
        const key = screenshot.startsWith('http') ? 
          screenshot.replace(`https://${process.env.VOLC_BUCKET}.${process.env.VOLC_ENDPOINT}/`, '') : 
          screenshot;
        try {
          await storageAdapter.deleteObject(key);
          console.log(`[工具删除] 删除截图: ${key}`);
        } catch (error) {
          console.error(`[工具删除] 删除截图失败:`, error);
        }
      }
    }

    // 删除数据库中的工具记录
    await Tool.findOneAndDelete({ id: req.params.id });
    
    res.json({ message: '工具及相关文件已删除' });
  } catch (error) {
    console.error('[工具删除] 错误:', error);
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

    res.json({ tool, message: tool.isFeatured ? '已加精' : '已取消加精' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const pinTool = async (req, res) => {
  try {
    const tool = await Tool.findOne({ id: req.params.id });

    if (!tool) {
      return res.status(404).json({ message: '工具不存在' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '没有权限' });
    }

    tool.isPinned = !tool.isPinned;
    tool.updatedAt = Date.now();
    await tool.save();

    res.json({ tool, message: tool.isPinned ? '已置顶' : '已取消置顶' });
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

const getScreenshot = async (req, res) => {
  try {
    const key = decodeURIComponent(req.params.key);
    console.log('[截图服务] 获取截图:', key);

    // 安全检查：只允许访问 uploads/images/ 目录下的文件
    if (!key.startsWith('uploads/images/')) {
      return res.status(403).json({ message: '访问被拒绝' });
    }

    // 从火山引擎存储获取文件
    const result = await storageAdapter.getObjectStream(key);
    
    if (!result) {
      return res.status(404).json({ message: '截图不存在' });
    }

    // 设置响应头
    res.setHeader('Content-Type', result.contentType || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    
    // 流式传输文件
    result.stream.pipe(res);
  } catch (error) {
    console.error('[截图服务] 获取截图失败:', error);
    res.status(500).json({ message: '获取截图失败' });
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
  pinTool,
  getToolStats,
  getScreenshot
};