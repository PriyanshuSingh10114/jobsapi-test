const candidateProfileService = require('../services/candidateProfile.service');
const Job = require('../models/Job');

exports.getProfile = async (req, res, next) => {
  try {
    const candidateId = req.user?.userId || req.query.userId || 'local_admin_1';
    const result = await candidateProfileService.getProfile(candidateId);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const candidateId = req.user?.userId || 'local_admin_1';
    const result = await candidateProfileService.updateProfile(candidateId, req.body);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

exports.getReadiness = async (req, res, next) => {
  try {
    const candidateId = req.user?.userId || req.query.userId || 'local_admin_1';
    const { readiness } = await candidateProfileService.getProfile(candidateId);
    res.json({ success: true, readiness });
  } catch (err) {
    next(err);
  }
};

exports.getExperience = async (req, res, next) => {
  try {
    const candidateId = req.user?.userId || 'local_admin_1';
    const { profile } = await candidateProfileService.getProfile(candidateId);
    res.json({ success: true, count: profile.experience.length, experience: profile.experience });
  } catch (err) {
    next(err);
  }
};

exports.addExperience = async (req, res, next) => {
  try {
    const candidateId = req.user?.userId || 'local_admin_1';
    const experience = await candidateProfileService.addExperience(candidateId, req.body);
    res.status(201).json({ success: true, experience });
  } catch (err) {
    next(err);
  }
};

exports.updateExperience = async (req, res, next) => {
  try {
    const candidateId = req.user?.userId || 'local_admin_1';
    const updated = await candidateProfileService.updateExperience(candidateId, req.params.id, req.body);
    res.json({ success: true, item: updated });
  } catch (err) {
    next(err);
  }
};

exports.deleteExperience = async (req, res, next) => {
  try {
    const candidateId = req.user?.userId || 'local_admin_1';
    const experience = await candidateProfileService.deleteExperience(candidateId, req.params.id);
    res.json({ success: true, experience });
  } catch (err) {
    next(err);
  }
};

exports.getEducation = async (req, res, next) => {
  try {
    const candidateId = req.user?.userId || 'local_admin_1';
    const { profile } = await candidateProfileService.getProfile(candidateId);
    res.json({ success: true, count: profile.education.length, education: profile.education });
  } catch (err) {
    next(err);
  }
};

exports.addEducation = async (req, res, next) => {
  try {
    const candidateId = req.user?.userId || 'local_admin_1';
    const education = await candidateProfileService.addEducation(candidateId, req.body);
    res.status(201).json({ success: true, education });
  } catch (err) {
    next(err);
  }
};

exports.updateEducation = async (req, res, next) => {
  try {
    const candidateId = req.user?.userId || 'local_admin_1';
    const updated = await candidateProfileService.updateEducation(candidateId, req.params.id, req.body);
    res.json({ success: true, item: updated });
  } catch (err) {
    next(err);
  }
};

exports.deleteEducation = async (req, res, next) => {
  try {
    const candidateId = req.user?.userId || 'local_admin_1';
    const education = await candidateProfileService.deleteEducation(candidateId, req.params.id);
    res.json({ success: true, education });
  } catch (err) {
    next(err);
  }
};

exports.uploadDocument = async (req, res, next) => {
  try {
    const candidateId = req.user?.userId || 'local_admin_1';
    const type = req.body.type || 'resume';
    const result = await candidateProfileService.uploadDocument(candidateId, req.file, type);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

exports.getDocuments = async (req, res, next) => {
  try {
    const candidateId = req.user?.userId || 'local_admin_1';
    const { profile } = await candidateProfileService.getProfile(candidateId);
    res.json({ success: true, documents: profile.documents });
  } catch (err) {
    next(err);
  }
};

exports.updateApplicationAnswers = async (req, res, next) => {
  try {
    const candidateId = req.user?.userId || 'local_admin_1';
    const answers = await candidateProfileService.updateApplicationAnswer(candidateId, req.body);
    res.json({ success: true, applicationAnswers: answers });
  } catch (err) {
    next(err);
  }
};

exports.runPreflight = async (req, res, next) => {
  try {
    const candidateId = req.user?.userId || req.body.userId || 'local_admin_1';
    const { jobId, discoveredFields = [] } = req.body;

    let job = {};
    if (jobId) {
      job = await Job.findById(jobId).lean() || {};
    }

    const preflightReport = await candidateProfileService.runPreflight(candidateId, job, discoveredFields);
    res.json({ success: true, preflight: preflightReport });
  } catch (err) {
    next(err);
  }
};
