const express = require('express');
const router = express.Router();
const faultTypeController = require('../controllers/faultTypeController');

router.get('/', faultTypeController.getAllFaultTypes);
router.get('/:id', faultTypeController.getFaultTypeById);
router.post('/', faultTypeController.createFaultType);
router.put('/:id', faultTypeController.updateFaultType);
router.delete('/:id', faultTypeController.deleteFaultType);

module.exports = router;