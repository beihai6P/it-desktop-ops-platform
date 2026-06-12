const FaultType = require('../models/FaultType');

exports.getAllFaultTypes = async (req, res) => {
  try {
    const faultTypes = await FaultType.find();
    res.json({ success: true, faultTypes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getFaultTypeById = async (req, res) => {
  try {
    const faultType = await FaultType.findById(req.params.id);
    if (!faultType) {
      return res.status(404).json({ success: false, message: 'Fault type not found' });
    }
    res.json({ success: true, faultType });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createFaultType = async (req, res) => {
  try {
    const faultType = new FaultType(req.body);
    const savedFaultType = await faultType.save();
    res.status(201).json({ success: true, faultType: savedFaultType });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateFaultType = async (req, res) => {
  try {
    const faultType = await FaultType.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!faultType) {
      return res.status(404).json({ success: false, message: 'Fault type not found' });
    }
    res.json({ success: true, faultType });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteFaultType = async (req, res) => {
  try {
    const faultType = await FaultType.findByIdAndDelete(req.params.id);
    if (!faultType) {
      return res.status(404).json({ success: false, message: 'Fault type not found' });
    }
    res.json({ success: true, message: 'Fault type deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};