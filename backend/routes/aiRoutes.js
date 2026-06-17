const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// 智能诊断助手
router.post('/diagnose', aiController.diagnose);
router.get('/symptoms', aiController.getSymptoms);

// 智能问答（本地知识库优先，支持联网回退）
router.post('/qa', aiController.smartQA);

// 知识库AI助手
router.post('/knowledge/qa', aiController.knowledgeQA);
router.post('/knowledge/search', aiController.knowledgeSearch);
router.post('/knowledge/summarize', aiController.knowledgeSummarize);

// 沙盒实验室AI分析
router.post('/experiment/analyze', aiController.analyzeExperiment);
router.post('/experiment/compare', aiController.compareExperiments);

module.exports = router;
