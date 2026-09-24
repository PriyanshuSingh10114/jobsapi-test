const Source = require('../models/Source');
const { NotFoundError } = require('../errors/AppErrors');

exports.getSources = async (req, res, next) => {
  try {
    const sources = await Source.find().sort({ name: 1 }).lean();
    res.json({ success: true, data: sources });
  } catch (error) {
    next(error);
  }
};

exports.getSourceByName = async (req, res, next) => {
  try {
    const source = await Source.findOne({ name: req.params.name }).lean();
    if (!source) {
      throw new NotFoundError(`Source '${req.params.name}' not found`);
    }
    res.json({ success: true, data: source });
  } catch (error) {
    next(error);
  }
};
