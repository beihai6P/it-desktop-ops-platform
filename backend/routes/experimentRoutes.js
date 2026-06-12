const express = require('express');
const router = express.Router();
const experimentController = require('../controllers/experimentController');

router.get('/', experimentController.getAllExperiments);
router.get('/:id', experimentController.getExperimentById);
router.post('/', experimentController.createExperiment);
router.put('/:id', experimentController.updateExperiment);
router.delete('/:id', experimentController.deleteExperiment);
router.post('/run', experimentController.runExperiment);
router.post('/:id/complete', experimentController.completeExperiment);

module.exports = router;