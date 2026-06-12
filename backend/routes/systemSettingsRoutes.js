const express = require('express');
const {
  getSettings,
  updateSettings,
  updateNotificationSettings,
  updateSecuritySettings,
  updateAppearanceSettings,
  updateDataRetentionSettings,
  updateIntegrationSettings,
  updateAISettings
} = require('../controllers/systemSettingsController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.get('/', getSettings);
router.put('/', protect, admin, updateSettings);
router.put('/notifications', protect, admin, updateNotificationSettings);
router.put('/security', protect, admin, updateSecuritySettings);
router.put('/appearance', protect, updateAppearanceSettings);
router.put('/data-retention', protect, admin, updateDataRetentionSettings);
router.put('/integrations', protect, admin, updateIntegrationSettings);
router.put('/ai-settings', protect, admin, updateAISettings);

module.exports = router;