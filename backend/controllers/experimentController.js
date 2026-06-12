const Experiment = require('../models/Experiment');

exports.getAllExperiments = async (req, res) => {
  try {
    const experiments = await Experiment.find().sort({ createdAt: -1 });
    res.json({ success: true, experiments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getExperimentById = async (req, res) => {
  try {
    const experiment = await Experiment.findById(req.params.id);
    if (!experiment) {
      return res.status(404).json({ success: false, message: 'Experiment not found' });
    }
    res.json({ success: true, experiment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createExperiment = async (req, res) => {
  try {
    const experiment = new Experiment(req.body);
    const savedExperiment = await experiment.save();
    res.status(201).json({ success: true, experiment: savedExperiment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateExperiment = async (req, res) => {
  try {
    const experiment = await Experiment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!experiment) {
      return res.status(404).json({ success: false, message: 'Experiment not found' });
    }
    res.json({ success: true, experiment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteExperiment = async (req, res) => {
  try {
    const experiment = await Experiment.findByIdAndDelete(req.params.id);
    if (!experiment) {
      return res.status(404).json({ success: false, message: 'Experiment not found' });
    }
    res.json({ success: true, message: 'Experiment deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.runExperiment = async (req, res) => {
  try {
    const { faultType, faultTypeId } = req.body;
    const experiment = new Experiment({
      name: `${faultType}演练`,
      faultType,
      faultTypeId,
      status: 'running',
      progress: 0,
    });
    
    const savedExperiment = await experiment.save();
    
    res.json({ success: true, experiment: savedExperiment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.completeExperiment = async (req, res) => {
  try {
    const experiment = await Experiment.findById(req.params.id);
    if (!experiment) {
      return res.status(404).json({ success: false, message: 'Experiment not found' });
    }
    
    experiment.status = 'completed';
    experiment.progress = 100;
    experiment.result = {
      issues: ['DNS解析超时', '缓存未命中'],
      recommendations: ['检查DNS配置', '优化缓存策略'],
    };
    
    const updatedExperiment = await experiment.save();
    res.json({ success: true, experiment: updatedExperiment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};