const express = require('express');
const router = express.Router();
const { protect, requirePermission } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

router.use(protect);

router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.get('/:id', notificationController.getNotificationById);
router.post('/read', notificationController.markAsRead);
router.delete('/:id', notificationController.deleteNotification);
router.delete('/', notificationController.deleteAllNotifications);

router.post('/', notificationController.createNotification);
router.post('/broadcast', notificationController.broadcastNotification);

module.exports = router;