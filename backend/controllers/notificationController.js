const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, priority } = req.query;
    
    const query = { userId: req.user._id };
    
    if (type) {
      query.type = type;
    }
    
    if (priority) {
      query.priority = priority;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Notification.countDocuments(query)
    ]);
    
    res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('获取通知失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      userId: req.user._id, 
      read: false 
    });
    
    res.status(200).json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('获取未读通知数量失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

exports.getNotificationById = async (req, res) => {
  try {
    const notification = await Notification.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: '通知不存在'
      });
    }
    
    notification.read = true;
    await notification.save();
    
    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('获取通知详情失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.body;
    
    if (notificationId) {
      const updated = await Notification.findByIdAndUpdate(
        notificationId,
        { read: true },
        { new: true }
      );
      
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: '通知不存在'
        });
      }
    } else {
      await Notification.updateMany(
        { userId: req.user._id, read: false },
        { read: true }
      );
    }
    
    res.status(200).json({
      success: true,
      message: notificationId ? '通知已标记为已读' : '所有通知已标记为已读'
    });
  } catch (error) {
    console.error('标记通知为已读失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

exports.createNotification = async (req, res) => {
  try {
    const { userId, type, title, message, link, priority, metadata, expiresAt } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '用户ID不能为空'
      });
    }
    
    const notification = await Notification.create({
      userId,
      type: type || 'system',
      title,
      message,
      link,
      priority: priority || 'medium',
      metadata: metadata || {},
      expiresAt
    });
    
    res.status(201).json({
      success: true,
      message: '通知创建成功',
      data: notification
    });
  } catch (error) {
    console.error('创建通知失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: '通知不存在'
      });
    }
    
    await Notification.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: '通知已删除'
    });
  } catch (error) {
    console.error('删除通知失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

exports.deleteAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user._id });
    
    res.status(200).json({
      success: true,
      message: '所有通知已清空'
    });
  } catch (error) {
    console.error('清空通知失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

exports.broadcastNotification = async (req, res) => {
  try {
    const { type, title, message, link, priority, metadata, expiresAt, userIds } = req.body;
    
    const notifications = [];
    const targetUserIds = userIds || [];
    
    if (targetUserIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请指定接收通知的用户ID列表'
      });
    }
    
    for (const userId of targetUserIds) {
      const notification = await Notification.create({
        userId,
        type: type || 'system',
        title,
        message,
        link,
        priority: priority || 'medium',
        metadata: metadata || {},
        expiresAt
      });
      notifications.push(notification);
    }
    
    res.status(201).json({
      success: true,
      message: `已向 ${notifications.length} 个用户发送通知`,
      data: notifications
    });
  } catch (error) {
    console.error('广播通知失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};