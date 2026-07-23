const crypto = require('crypto');
const DiscoveredJob = require('../../models/DiscoveredJob');
const ATSDetectionEngine = require('../connectors/factory/ATSDetectionEngine');
const logger = require('../../config/logger');

class JobDiscoveryEngine {
  /**
   * Generates a unique deduplication hash for a job posting.
   */
  static generateDedupHash(companyName, title, location, applyUrl) {
    const raw = `${(companyName || '').toLowerCase()}:${(title || '').toLowerCase()}:${(location || '').toLowerCase()}:${(applyUrl || '').toLowerCase()}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  /**
   * Ingests, detects ATS, scores, deduplicates, and saves discovered jobs.
   * @param {Array<Object>} rawJobs List of job objects
   * @param {Object} [candidateKnowledgeGraph] Optional candidate profile for match scoring
   * @returns {Promise<Array<Object>>} Processed DiscoveredJob documents
   */
  static async ingestJobs(rawJobs = [], candidateKnowledgeGraph = null) {
    logger.info(`[JobDiscoveryEngine] Ingesting ${rawJobs.length} discovered jobs...`);
    const savedJobs = [];

    for (const raw of rawJobs) {
      try {
        if (!raw.applyUrl || !raw.title || !raw.companyName) continue;

        const hash = this.generateDedupHash(raw.companyName, raw.title, raw.location, raw.applyUrl);
        const detection = await ATSDetectionEngine.detect(raw.applyUrl);

        let matchScore = 80; // Baseline
        if (candidateKnowledgeGraph) {
          const profile = candidateKnowledgeGraph.graph;
          const skills = [...(profile.skills.languages || []), ...(profile.skills.frameworks || [])];
          const text = `${raw.title} ${raw.description || ''}`.toLowerCase();
          const matchedCount = skills.filter(s => text.includes(s.toLowerCase())).length;
          matchScore = Math.min(100, 60 + matchedCount * 8);
        }

        const jobDoc = await DiscoveredJob.findOneAndUpdate(
          { dedupHash: hash },
          {
            $setOnInsert: {
              title: raw.title,
              companyName: raw.companyName,
              location: raw.location || 'Remote',
              applyUrl: raw.applyUrl,
              atsKey: detection.atsKey,
              atsName: detection.atsName,
              dedupHash: hash,
              description: raw.description || '',
              requirements: raw.requirements || [],
              isRemote: raw.isRemote || (raw.location || '').toLowerCase().includes('remote'),
              techStack: raw.techStack || [],
              matchScore,
              status: 'Discovered'
            }
          },
          { upsert: true, new: true }
        );

        savedJobs.push(jobDoc);
      } catch (err) {
        logger.warn(`[JobDiscoveryEngine] Error ingesting job ${raw.title}: ${err.message}`);
      }
    }

    logger.info(`[JobDiscoveryEngine] Ingested and deduplicated ${savedJobs.length} jobs.`);
    return savedJobs;
  }
}

module.exports = JobDiscoveryEngine;
