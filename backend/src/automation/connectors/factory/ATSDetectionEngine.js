const logger = require('../../../config/logger');

class ATSDetectionEngine {
  /**
   * Detects the ATS provider from a job URL and optional live Playwright page.
   * @param {string} jobUrl 
   * @param {Object} [page] - Playwright page instance
   * @returns {Promise<Object>} Detection Result { atsKey, confidence, version, capabilities }
   */
  static async detect(jobUrl = '', page = null) {
    logger.info(`[ATSDetectionEngine] Detecting ATS for URL: ${jobUrl}`);
    const urlLower = jobUrl.toLowerCase();

    // 1. URL Hostname Pattern Rules
    const patterns = [
      { key: 'greenhouse', regex: /greenhouse\.io|boards\.greenhouse/i, name: 'Greenhouse' },
      { key: 'lever', regex: /lever\.co|jobs\.lever/i, name: 'Lever' },
      { key: 'ashby', regex: /ashbyhq\.com|jobs\.ashbyhq/i, name: 'Ashby' },
      { key: 'workday', regex: /myworkdayjobs\.com|workday\.com/i, name: 'Workday' },
      { key: 'smartrecruiters', regex: /smartrecruiters\.com|jobs\.smartrecruiters/i, name: 'SmartRecruiters' },
      { key: 'icims', regex: /icims\.com|icims\.net/i, name: 'iCIMS' },
      { key: 'taleo', regex: /taleo\.net|taleo/i, name: 'Taleo' },
      { key: 'successfactors', regex: /successfactors\.com|career\.sf/i, name: 'SAP SuccessFactors' },
      { key: 'jobvite', regex: /jobvite\.com|jobs\.jobvite/i, name: 'Jobvite' },
      { key: 'recruitee', regex: /recruitee\.com|careers\.recruitee/i, name: 'Recruitee' },
      { key: 'bamboohr', regex: /bamboohr\.com/i, name: 'BambooHR' },
      { key: 'teamtailor', regex: /teamtailor\.com|career\.teamtailor/i, name: 'Teamtailor' },
      { key: 'comeet', regex: /comeet\.com|comeet\.co/i, name: 'Comeet' },
      { key: 'pinpoint', regex: /pinpointhq\.com/i, name: 'Pinpoint' },
      { key: 'oracle', regex: /oraclecloud\.com/i, name: 'Oracle Recruiting' },
      { key: 'workable', regex: /workable\.com|apply\.workable/i, name: 'Workable' },
      { key: 'rippling', regex: /rippling\.com/i, name: 'Rippling' },
      { key: 'personio', regex: /personio\.de|personio\.com/i, name: 'Personio' },
      { key: 'wellfound', regex: /wellfound\.com|angellist\.com/i, name: 'Wellfound' },
      { key: 'linkedin', regex: /linkedin\.com\/jobs/i, name: 'LinkedIn Easy Apply' },
      { key: 'indeed', regex: /indeed\.com/i, name: 'Indeed Apply' },
      { key: 'ziprecruiter', regex: /ziprecruiter\.com/i, name: 'ZipRecruiter' },
      { key: 'monster', regex: /monster\.com/i, name: 'Monster' },
      { key: 'dice', regex: /dice\.com/i, name: 'Dice' },
      { key: 'usajobs', regex: /usajobs\.gov/i, name: 'USAJobs' }
    ];

    for (const p of patterns) {
      if (p.regex.test(urlLower)) {
        logger.info(`[ATSDetectionEngine] High confidence URL match: ${p.name} (${p.key})`);
        return {
          atsKey: p.key,
          atsName: p.name,
          confidence: 1.0,
          version: '1.0',
          capabilities: {
            supportsMultiStep: ['workday', 'icims', 'taleo', 'successfactors', 'linkedin'].includes(p.key),
            supportsShadowDOM: ['workday', 'oracle', 'smartrecruiters'].includes(p.key),
            requiresAuth: ['linkedin', 'indeed', 'workday', 'usajobs'].includes(p.key)
          }
        };
      }
    }

    // 2. Deep DOM / Meta Fingerprinting if page is available
    if (page) {
      try {
        const domInfo = await page.evaluate(() => {
          const scripts = Array.from(document.querySelectorAll('script[src]')).map(s => s.src.toLowerCase());
          const metas = Array.from(document.querySelectorAll('meta')).map(m => (m.content || '').toLowerCase());
          const html = document.documentElement.outerHTML.toLowerCase();
          const formIds = Array.from(document.querySelectorAll('form')).map(f => f.id.toLowerCase());

          return { scripts, metas, html, formIds };
        });

        for (const p of patterns) {
          const matched = domInfo.scripts.some(s => s.includes(p.key)) ||
                          domInfo.metas.some(m => m.includes(p.key)) ||
                          domInfo.formIds.some(f => f.includes(p.key));
          if (matched) {
            logger.info(`[ATSDetectionEngine] DOM Fingerprint match: ${p.name} (${p.key})`);
            return {
              atsKey: p.key,
              atsName: p.name,
              confidence: 0.90,
              version: '1.0',
              capabilities: { supportsMultiStep: false, supportsShadowDOM: true, requiresAuth: false }
            };
          }
        }
      } catch (err) {
        logger.warn(`[ATSDetectionEngine] DOM inspection warning: ${err.message}`);
      }
    }

    // 3. Fallback to Generic ATS
    logger.info('[ATSDetectionEngine] No specific ATS matched. Falling back to Generic ATS Connector.');
    return {
      atsKey: 'generic',
      atsName: 'Generic ATS',
      confidence: 0.70,
      version: '1.0',
      capabilities: { supportsMultiStep: false, supportsShadowDOM: false, requiresAuth: false }
    };
  }
}

module.exports = ATSDetectionEngine;
