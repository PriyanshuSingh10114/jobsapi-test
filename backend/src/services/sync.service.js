const Job = require('../models/Job');
const Source = require('../models/Source');
const logger = require('../config/logger');
const { classifyJobRegion, isUSLocation, getCountry } = require('../utils/locationHelper');
const { extractSkills, extractSalary, extractState } = require('../utils/dataExtractor');
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

const syncJobsForSource = async (sourceName) => {
  let sourceDoc = await Source.findOne({ name: sourceName });
  if (!sourceDoc) {
    sourceDoc = new Source({ name: sourceName });
  }

  try {
    const startTime = Date.now();
    logger.info(`Starting sync for ${sourceName}`);
    const fetchFunc = services[sourceName];
    let jobs = await fetchFunc();

    // Do not filter out jobs, just assign properties
    jobs = jobs.map((job) => {
      job.jobRegion = classifyJobRegion(job.location, job.remote, job.title);
      job.isUSJob = isUSLocation(job.location);
      job.country = getCountry(job.location);
      job.isRemote = job.remote === true;
      
      // Deep Data Extraction
      const fullText = `${job.title || ''} ${job.description || ''}`;
      job.skills = extractSkills(fullText);
      
      const salaryInfo = extractSalary(fullText);
      if (salaryInfo) {
        job.salary = salaryInfo;
      }
      
      job.state = extractState(job.location);

      return job;
    });

    let newJobsCount = 0;
    let updatedJobsCount = 0;
    let skippedJobsCount = 0;

    for (const jobData of jobs) {
      if (!jobData.applyUrl && !jobData.title) {
        skippedJobsCount++;
        continue;
      }

      jobData.jobHash = generateJobHash(jobData.company, jobData.title, jobData.location, jobData.source);

      const existingJob = await Job.findOne({ jobHash: jobData.jobHash });
      
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

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    // Update Source status
    sourceDoc.lastSync = new Date();
    sourceDoc.status = 'Healthy';
    sourceDoc.jobCount = await Job.countDocuments({ source: sourceName });
    sourceDoc.lastError = null;
    await sourceDoc.save();

    console.log(`\n[${sourceName}]
Jobs Fetched: ${jobs.length}
Jobs Inserted: ${newJobsCount}
Jobs Updated: ${updatedJobsCount}
Jobs Skipped: ${skippedJobsCount}
Duration: ${duration}s\n`);

    logger.info(`Completed sync for ${sourceName}. New: ${newJobsCount}, Updated: ${updatedJobsCount}`);
    return { success: true, newJobsCount, updatedJobsCount, duration: `${duration}s` };

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
