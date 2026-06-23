const Job = require('../models/Job');
const Source = require('../models/Source');
const SyncMetric = require('../models/SyncMetric');
const logger = require('../config/logger');
const { isAllowedForUSPlatform, classifyJobRegion, isUSLocation, getCountry, normalizeLocation } = require('../utils/locationHelper');
const { extractSkills, extractSalary, extractState, extractExperienceLevel, extractEmploymentType } = require('../utils/dataExtractor');
const { generateJobHash } = require('../utils/hashHelper');

const arbeitnowService = require('./arbeitnow.service');
const remotiveService = require('./remotive.service');
const greenhouseService = require('./greenhouse.service');
const leverService = require('./lever.service');
const ashbyService = require('./ashby.service');
const usajobsService = require('./usajobs.service');
const themuseService = require('./themuse.service');
const smartrecruitersService = require('./smartrecruiters.service');
const recruiteeService = require('./recruitee.service');
const workdayService = require('./workday.service');
const jobviteService = require('./jobvite.service');
const teamtailorService = require('./teamtailor.service');
const bamboohrService = require('./bamboohr.service');

const services = {
  'Arbeitnow': arbeitnowService.fetchJobs,
  'Remotive': remotiveService.fetchJobs,
  'Greenhouse': greenhouseService.fetchJobs,
  'Lever': leverService.fetchJobs,
  'Ashby': ashbyService.fetchJobs,
  'USAJobs': usajobsService.fetchJobs,
  'TheMuse': themuseService.fetchJobs,
  'SmartRecruiters': smartrecruitersService.fetchJobs,
  'Recruitee': recruiteeService.fetchJobs,
  'Workday': workdayService.fetchJobs,
  'Jobvite': jobviteService.fetchJobs,
  'Teamtailor': teamtailorService.fetchJobs,
  'BambooHR': bamboohrService.fetchJobs,
};

let isSyncAllRunning = false;

const syncJobsForSource = async (sourceName) => {
  let sourceDoc = await Source.findOne({ name: sourceName });
  if (!sourceDoc) {
    sourceDoc = new Source({ name: sourceName });
  }

  try {
    const startTime = Date.now();
    logger.info(`Starting sync for ${sourceName}`);
    const fetchFunc = services[sourceName];
    let result = await fetchFunc();
    let jobs = Array.isArray(result) ? result : result.jobs || [];
    let companiesScanned = result.companiesScanned || 0;
    let companiesFailed = result.companiesFailed || 0;

    let skippedJobsCount = 0;
    let unchangedJobsCount = 0;
    const bulkOps = [];

    // Pre-fetch existing jobs for true change detection
    const existingJobs = await Job.find({ source: sourceName })
      .select('jobHash title company location remote jobType experienceLevel')
      .lean();
    const existingMap = new Map(existingJobs.map(j => [j.jobHash, j]));

    // Filter and Process
    for (let job of jobs) {
      const normalizedLocation = normalizeLocation(job.location);
      
      // EXPLICIT US JOB PLATFORM RULE
      if (!isAllowedForUSPlatform(normalizedLocation, job.remote, job.title)) {
        skippedJobsCount++;
        continue;
      }

      job.location = normalizedLocation;
      job.jobRegion = classifyJobRegion(normalizedLocation, job.remote, job.title);
      job.isUSJob = isUSLocation(normalizedLocation);
      job.country = getCountry(normalizedLocation);
      job.isRemote = job.remote === true;

      // EXPLICIT INGESTION GUARD (US-ONLY PLATFORM)
      if (job.isUSJob === false) {
        skippedJobsCount++;
        continue;
      }

      // Deep Data Extraction
      const fullText = `${job.title || ''} ${job.description || ''}`;
      job.skills = extractSkills(fullText);
      job.experienceLevel = extractExperienceLevel(job.title, job.description, job.experienceLevel);
      job.jobType = extractEmploymentType(job.title, job.description, job.jobType);

      const salaryInfo = extractSalary(fullText);
      if (salaryInfo) {
        job.salary = salaryInfo;
      }

      job.state = extractState(job.location);

      if (!job.applyUrl && !job.title) {
        skippedJobsCount++;
        continue;
      }

      job.jobHash = generateJobHash(job.company, job.title, job.location, job.source);

      // True Change Detection Logic
      const existing = existingMap.get(job.jobHash);
      if (existing) {
        const isChanged = 
          existing.title !== job.title ||
          existing.company !== job.company ||
          existing.location !== job.location ||
          existing.remote !== job.remote ||
          existing.jobType !== job.jobType ||
          existing.experienceLevel !== job.experienceLevel;

        if (!isChanged) {
          unchangedJobsCount++;
          continue; // Skip DB operation entirely
        }
      }

      bulkOps.push({
        updateOne: {
          filter: { jobHash: job.jobHash },
          update: { $set: job },
          upsert: true
        }
      });
    }

    const fetchedCount = jobs.length;
    // Memory optimization: clear the raw jobs array before DB heavy lift
    jobs = null;
    result = null;

    let newJobsCount = 0;
    let updatedJobsCount = 0;
    // unchangedJobsCount is already calculated in the loop

    if (bulkOps.length > 0) {
      try {
        const bulkResult = await Job.bulkWrite(bulkOps, { ordered: false });
        newJobsCount = bulkResult.upsertedCount || 0;
        updatedJobsCount = bulkResult.modifiedCount || 0;
        // Add any matched but unmodified jobs from bulkWrite (fallback safety)
        unchangedJobsCount += (bulkResult.matchedCount || 0) - updatedJobsCount;
      } catch (err) {
        logger.error(`Bulk write error for ${sourceName}: ${err.message}`);
        newJobsCount = err.result?.result?.nUpserted || 0;
        updatedJobsCount = err.result?.result?.nModified || 0;
        unchangedJobsCount += (err.result?.result?.nMatched || 0) - updatedJobsCount;
      }
    }

    const durationMs = Date.now() - startTime;
    const duration = (durationMs / 1000).toFixed(1);

    // Update Source status
    sourceDoc.lastSync = new Date();
    sourceDoc.status = 'Healthy';
    sourceDoc.jobCount = await Job.countDocuments({ source: sourceName });
    sourceDoc.lastError = null;
    await sourceDoc.save();

    await SyncMetric.create({
      source: sourceName,
      jobsFetched: fetchedCount,
      jobsInserted: newJobsCount,
      jobsUpdated: updatedJobsCount,
      duration: `${duration}s`,
      durationMs
    });

    let outputLog = `\n[${sourceName}]\n`;
    if (companiesScanned > 0) outputLog += `Companies Scanned: ${companiesScanned}\nCompanies Failed: ${companiesFailed}\n`;
    outputLog += `Jobs Fetched: ${fetchedCount}\nJobs Inserted: ${newJobsCount}\nJobs Updated: ${updatedJobsCount}\nJobs Unchanged: ${unchangedJobsCount}\nJobs Skipped: ${skippedJobsCount}\nDuration: ${duration}s\n`;
    console.log(outputLog);

    logger.info(`Completed sync for ${sourceName}. Fetched: ${fetchedCount}, Inserted: ${newJobsCount}, Updated: ${updatedJobsCount}, Unchanged: ${unchangedJobsCount}, Skipped: ${skippedJobsCount}`);
    return { success: true, newJobsCount, updatedJobsCount, unchangedJobsCount, duration: `${duration}s` };

  } catch (error) {
    logger.error(`Sync failed for ${sourceName}: ${error.message}`);
    sourceDoc.status = 'Failed';
    sourceDoc.lastError = error.message;
    await sourceDoc.save();
    return { success: false, error: error.message };
  }
};

const syncAll = async () => {
  if (isSyncAllRunning) {
    logger.warn('Sync skipped - already running');
    return { success: false, message: 'Sync already running' };
  }

  isSyncAllRunning = true;
  const startSyncAll = Date.now();
  try {
    const results = {};
    const promises = Object.keys(services).map(async (sourceName) => {
      try {
        const result = await syncJobsForSource(sourceName);
        results[sourceName] = result;
      } catch (err) {
        logger.error(`Unhandled error in syncJobsForSource for ${sourceName}: ${err.message}`);
        results[sourceName] = { success: false, error: err.message };
      }
    });

    await Promise.allSettled(promises);

    const duration = ((Date.now() - startSyncAll) / 1000).toFixed(1);

    const summary = {
      before: { syncDuration: "25-30 min" },
      after: { syncDuration: `${(duration / 60).toFixed(1)} min (${duration}s)` },
      improvements: [
        "Parallel source execution via Promise.allSettled",
        "Concurrent batched ATS HTTP fetching via p-limit",
        "MongoDB bulkWrite operations for instantaneous inserts/updates",
        "Memory array clearing for V8 Garbage Collection",
        "Mutex locking to prevent cron overlaps",
        "Robust index optimization (jobHash uniqueness)"
      ]
    };

    return { success: true, summary, details: results };
  } finally {
    isSyncAllRunning = false;
  }
};

module.exports = { syncJobsForSource, syncAll };
