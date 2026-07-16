const Job = require('../models/Job');
const Source = require('../models/Source');
const SyncMetric = require('../models/SyncMetric');
const SyncLogger = require('./SyncLogger');
const { validateJob } = require('../utils/validationHelper');
const { generateJobHash } = require('../utils/hashHelper');
const { classifyJobRegion, isUSLocation, getCountry, normalizeLocation } = require('../utils/locationHelper');
const { extractSkills, extractSalary, extractState, extractExperienceLevel, extractEmploymentType } = require('../utils/dataExtractor');

class SyncPipeline {
  constructor(connectorName, fetchFunction) {
    this.connectorName = connectorName;
    this.fetchFunction = fetchFunction;
    this.syncLogger = new SyncLogger(connectorName);
  }

  async run() {
    let sourceDoc = await Source.findOne({ name: this.connectorName });
    if (!sourceDoc) {
      sourceDoc = new Source({ name: this.connectorName });
    }

    try {
      // 1. Fetch
      const fetchResult = await this.fetchFunction(this.syncLogger);
      let rawJobs = Array.isArray(fetchResult) ? fetchResult : fetchResult.jobs || [];
      const companiesScanned = fetchResult.companiesScanned || 0;
      const companiesFailed = fetchResult.companiesFailed || 0;

      this.syncLogger.stats.companiesScanned = companiesScanned;
      this.syncLogger.stats.companiesFailed = companiesFailed;
      this.syncLogger.setFetched(rawJobs.length);

      // Pre-fetch existing jobs for deduplication
      const existingJobs = await Job.find({ source: this.connectorName })
        .select('jobHash title company location remote jobType experienceLevel')
        .lean();
      const existingMap = new Map(existingJobs.map(j => [j.jobHash, j]));
      
      const bulkOps = [];
      const currentSyncHashes = new Set();
      const now = new Date();

      for (let i = 0; i < rawJobs.length; i++) {
        let job = rawJobs[i];

        // Yield event loop every 500 jobs to prevent blocking other connectors
        if (i > 0 && i % 500 === 0) {
          await new Promise(setImmediate);
        }

        const parseStart = Date.now();

        // 2. Normalize
        const normalizedLocation = normalizeLocation(job.location);
        job.location = normalizedLocation;
        job.jobRegion = classifyJobRegion(normalizedLocation, job.remote, job.title);
        job.isUSJob = isUSLocation(normalizedLocation);
        job.country = getCountry(normalizedLocation);
        job.isRemote = job.remote === true;

        const fullText = `${job.title || ''} ${job.description || ''}`;
        job.skills = extractSkills(fullText);
        job.experienceLevel = extractExperienceLevel(job.title, job.description, job.experienceLevel);
        job.jobType = extractEmploymentType(job.title, job.description, job.jobType);

        const salaryInfo = extractSalary(fullText);
        if (salaryInfo) job.salary = salaryInfo;
        job.state = extractState(job.location);
        
        job.last_seen = now;
        job.is_active = true;

        // 3. Deduplicate (Generate Hash)
        job.jobHash = generateJobHash(job);
        
        this.syncLogger.addParseTime(Date.now() - parseStart);

        if (currentSyncHashes.has(job.jobHash)) {
            this.syncLogger.logJobStatus('duplicate');
            continue;
        }
        currentSyncHashes.add(job.jobHash);

        // 4. Validate
        const validation = validateJob(job);
        if (!validation.isValid) {
          this.syncLogger.logJobStatus('skipped', validation.reason);
          continue;
        }

        // 5. Change Detection
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
            bulkOps.push({
              updateOne: {
                filter: { jobHash: job.jobHash },
                update: { $set: { last_seen: now, is_active: true } }
              }
            });
            this.syncLogger.logJobStatus('unchanged');
            continue;
          } else {
            this.syncLogger.logJobStatus('updated');
          }
        } else {
          job.first_seen = now;
          this.syncLogger.logJobStatus('inserted');
        }

        bulkOps.push({
          updateOne: {
            filter: { jobHash: job.jobHash },
            update: { $set: job, $setOnInsert: { first_seen: now } },
            upsert: true
          }
        });
      }

      // Memory optimization
      rawJobs = null;

      // 6. Persistence (Chunked to prevent memory spikes)
      if (bulkOps.length > 0) {
        const dbWriteStart = Date.now();
        const BATCH_SIZE = 1000;
        
        try {
          for (let i = 0; i < bulkOps.length; i += BATCH_SIZE) {
            const batch = bulkOps.slice(i, i + BATCH_SIZE);
            await Job.bulkWrite(batch, { ordered: false });
          }
        } catch (err) {
          this.syncLogger.stats.errors['Mongo BulkWrite Error'] = (this.syncLogger.stats.errors['Mongo BulkWrite Error'] || 0) + 1;
        }
        this.syncLogger.addDbWriteTime(Date.now() - dbWriteStart);
      }
      
      // Job Freshness: Mark jobs as inactive if not seen recently
      if (currentSyncHashes.size > 0) {
         // Using 1 day as threshold for missing cycles
         const inactiveThreshold = new Date(now.getTime() - (1000 * 60 * 60 * 24)); 
         await Job.updateMany(
            { source: this.connectorName, last_seen: { $lt: inactiveThreshold } },
            { $set: { is_active: false } }
         );
      }

      // 7. Metrics & Logger
      const finalStats = this.syncLogger.finish();

      // Update Source / Connector Health
      sourceDoc.lastSync = now;
      sourceDoc.status = 'Healthy';
      sourceDoc.jobCount = await Job.countDocuments({ source: this.connectorName, is_active: true });
      sourceDoc.lastError = null;
      sourceDoc.last_success = now;
      sourceDoc.latency = finalStats.durationMs;
      sourceDoc.jobs_fetched = finalStats.jobsFetched;
      sourceDoc.jobs_inserted = finalStats.inserted;
      sourceDoc.jobs_updated = finalStats.updated;
      sourceDoc.jobs_skipped = finalStats.skippedTotal;
      sourceDoc.failure_count = 0;
      sourceDoc.consecutive_failures = 0;
      
      // Update average duration
      if (sourceDoc.average_duration) {
        sourceDoc.average_duration = (sourceDoc.average_duration + finalStats.durationMs) / 2;
      } else {
        sourceDoc.average_duration = finalStats.durationMs;
      }
      
      const successRateNum = finalStats.jobsFetched > 0 ? ((finalStats.inserted + finalStats.updated + finalStats.unchanged + finalStats.duplicates) / finalStats.jobsFetched * 100).toFixed(2) : 0;
      sourceDoc.success_rate = parseFloat(successRateNum);

      await sourceDoc.save();

      await SyncMetric.create({
        source: this.connectorName,
        jobsFetched: finalStats.jobsFetched,
        jobsInserted: finalStats.inserted,
        jobsUpdated: finalStats.updated,
        duration: `${(finalStats.durationMs/1000).toFixed(1)}s`,
        durationMs: finalStats.durationMs
      });

      return { success: true, ...finalStats };

    } catch (error) {
      this.syncLogger.stats.errors[error.message] = 1;
      this.syncLogger.finish();

      sourceDoc.status = 'Failed';
      sourceDoc.lastError = error.message;
      sourceDoc.failure_count = (sourceDoc.failure_count || 0) + 1;
      sourceDoc.consecutive_failures = (sourceDoc.consecutive_failures || 0) + 1;
      await sourceDoc.save();

      return { success: false, error: error.message };
    }
  }
}

module.exports = SyncPipeline;
