const ATSDetectionEngine = require('../connectors/factory/ATSDetectionEngine');
const ATSConnectorFactory = require('../connectors/factory/ATSConnectorFactory');
const logger = require('../../config/logger');

class ATSTestHarness {
  /**
   * Runs automated integration test suite across supported ATS URLs.
   */
  static async runTests() {
    logger.info('=====================================================');
    logger.info('   UNIVERSAL ATS PLATFORM TEST HARNESS INITIALIZING  ');
    logger.info('=====================================================');

    const testCases = [
      { url: 'https://boards.greenhouse.io/stripe/jobs/12345', expectedKey: 'greenhouse' },
      { url: 'https://jobs.lever.co/spotify/67890', expectedKey: 'lever' },
      { url: 'https://jobs.ashbyhq.com/figma/abcde', expectedKey: 'ashby' },
      { url: 'https://company.myworkdayjobs.com/careers/job/1', expectedKey: 'workday' },
      { url: 'https://jobs.smartrecruiters.com/Acme/1234', expectedKey: 'smartrecruiters' },
      { url: 'https://careers-icims.icims.com/jobs/555', expectedKey: 'icims' },
      { url: 'https://acme.taleo.net/careersection/jobdetail.ftl', expectedKey: 'taleo' },
      { url: 'https://career.sf.com/successfactors/job', expectedKey: 'successfactors' },
      { url: 'https://jobs.jobvite.com/company/job/111', expectedKey: 'jobvite' },
      { url: 'https://careers.recruitee.com/o/developer', expectedKey: 'recruitee' },
      { url: 'https://acme.bamboohr.com/careers/222', expectedKey: 'bamboohr' },
      { url: 'https://career.teamtailor.com/jobs/333', expectedKey: 'teamtailor' },
      { url: 'https://www.comeet.com/jobs/company/444', expectedKey: 'comeet' },
      { url: 'https://pinpointhq.com/careers/555', expectedKey: 'pinpoint' },
      { url: 'https://oraclecloud.com/hcmUI/candidate', expectedKey: 'oracle' },
      { url: 'https://apply.workable.com/company/j/666', expectedKey: 'workable' },
      { url: 'https://rippling.com/careers/777', expectedKey: 'rippling' },
      { url: 'https://personio.de/job/888', expectedKey: 'personio' },
      { url: 'https://wellfound.com/jobs/999', expectedKey: 'wellfound' },
      { url: 'https://linkedin.com/jobs/view/1000', expectedKey: 'linkedin' },
      { url: 'https://indeed.com/viewjob?jk=1001', expectedKey: 'indeed' },
      { url: 'https://ziprecruiter.com/jobs/1002', expectedKey: 'ziprecruiter' },
      { url: 'https://usajobs.gov/job/1003', expectedKey: 'usajobs' },
      { url: 'https://customcompany.com/careers/apply', expectedKey: 'generic' }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of testCases) {
      const result = await ATSDetectionEngine.detect(test.url);
      const isMatch = result.atsKey === test.expectedKey;
      if (isMatch) {
        passed++;
        logger.info(`[PASS] ${test.url} -> Detected: ${result.atsName} (${result.atsKey})`);
      } else {
        failed++;
        logger.error(`[FAIL] ${test.url} -> Expected: ${test.expectedKey}, Got: ${result.atsKey}`);
      }

      // Test connector factory instantiation
      try {
        const mockContext = { browser: {}, context: {}, page: {}, sessionId: 'test-session' };
        const connector = ATSConnectorFactory.createConnector(result.atsKey, mockContext, {});
        if (!connector) throw new Error('Factory returned null');
      } catch (err) {
        logger.error(`[FAIL Factory Instantiation] Key: ${result.atsKey} -> ${err.message}`);
      }
    }

    logger.info('=====================================================');
    logger.info(` TEST RESULTS: ${passed} PASSED, ${failed} FAILED (${testCases.length} total)`);
    logger.info('=====================================================');
    return { passed, failed, total: testCases.length };
  }
}

module.exports = ATSTestHarness;
