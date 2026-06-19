const Source = require('../models/Source');

exports.getSources = async (req, res, next) => {
  try {
    const sources = await Source.find().sort({ name: 1 });
    res.json({ success: true, data: sources });
  } catch (error) {
    next(error);
  }
};

exports.getSourceByName = async (req, res, next) => {
  try {
    const source = await Source.findOne({ name: req.params.name });
    if (!source) {
      return res.status(404).json({ success: false, message: 'Source not found' });
    }
    res.json({ success: true, data: source });
  } catch (error) {
    next(error);
  }
};
