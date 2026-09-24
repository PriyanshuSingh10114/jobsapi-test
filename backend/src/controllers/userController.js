const userProfileService = require('../services/userProfile.service');
const UNIVERSAL_FIELD_REGISTRY = require('../config/universalFieldRegistry');

exports.getFieldRegistry = (req, res) => {
  res.json({
    success: true,
    count: UNIVERSAL_FIELD_REGISTRY.length,
    registry: UNIVERSAL_FIELD_REGISTRY
  });
};

exports.getReadiness = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.query.userId || 'local_admin_1';
    const readiness = await userProfileService.getReadiness(userId);
    res.json({ success: true, readiness });
  } catch (err) {
    next(err);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.user?.userId || 'local_admin_1';
    const result = await userProfileService.getProfile(userId);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

exports.getCompleteProfile = async (req, res, next) => {
  try {
    const userId = req.user?.userId || 'local_admin_1';
    const result = await userProfileService.getCompleteProfile(userId);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

exports.getHistory = async (req, res, next) => {
  try {
    const userId = req.user?.userId || 'local_admin_1';
    const history = await userProfileService.getHistory(userId);
    res.json({ success: true, count: history.length, history });
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user?.userId || 'local_admin_1';
    const result = await userProfileService.updateProfile(userId, req.body);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

exports.uploadResume = async (req, res, next) => {
  try {
    const userId = req.user?.userId || 'local_admin_1';
    const result = await userProfileService.uploadResumeAsset(userId, req.file);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};
