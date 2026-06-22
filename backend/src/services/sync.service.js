const Job = require('../models/Job');
const Source = require('../models/Source');
const logger = require('../config/logger');
const { isUSLocation } = require('../utils/locationHelper');

const arbeitnowService = require('./arbeitnow.service');
const remotiveService = require('./remotive.service');
const greenhouseService = require('./greenhouse.service');
const leverService = require('./lever.service');
const ashbyService = require('./ashby.service');
const usajobsService = require('./usajobs.service');
const themuseService = require('./themuse.service');

const services = {
  'Arbeitnow': arbeitnowService.fetchJobs,
  'Remotive': remotiveService.fetchJobs,
  'Greenhouse': greenhouseService.fetchJobs,
  'Lever': leverService.fetchJobs,
  'Ashby': ashbyService.fetchJobs,
  'USAJobs': usajobsService.fetchJobs,
  'TheMuse': themuseService.fetchJobs,
};

const syncJobsForSource = async (sourceName) => {
  let sourceDoc = await Source.findOne({ name: sourceName });
  if (!sourceDoc) {
    sourceDoc = new Source({ name: sourceName });
  }

  try {
    logger.info(`Starting sync for ${sourceName}`);
    const fetchFunc = services[sourceName];
    let jobs = await fetchFunc();

    // Filter to US-oriented jobs only
    jobs = jobs.filter(job => isUSLocation(job.location));

    let newJobsCount = 0;
    let updatedJobsCount = 0;

    for (const jobData of jobs) {
      if (!jobData.applyUrl) continue;

      const existingJob = await Job.findOne({ applyUrl: jobData.applyUrl });
      
      if (existingJob) {
        // Update existing to keep it fresh
        await Job.updateOne({ _id: existingJob._id }, { $set: jobData });
        updatedJobsCount++;
      } else {
        // Insert new
        await Job.create(jobData);
        newJobsCount++;
      }
    }

    // Update Source status
    sourceDoc.lastSync = new Date();
    sourceDoc.status = 'Healthy';
    sourceDoc.jobCount = await Job.countDocuments({ source: sourceName });
    sourceDoc.lastError = null;
    await sourceDoc.save();

    logger.info(`Completed sync for ${sourceName}. New: ${newJobsCount}, Updated: ${updatedJobsCount}`);
    return { success: true, newJobsCount, updatedJobsCount };

  } catch (error) {
    logger.error(`Sync failed for ${sourceName}: ${error.message}`);
    sourceDoc.status = 'Failed';
    sourceDoc.lastError = error.message;
    await sourceDoc.save();
    return { success: false, error: error.message };
  }
};

const syncAll = async () => {
  const results = {};
  for (const sourceName of Object.keys(services)) {
    results[sourceName] = await syncJobsForSource(sourceName);
  }
  return results;
};

module.exports = { syncJobsForSource, syncAll };
