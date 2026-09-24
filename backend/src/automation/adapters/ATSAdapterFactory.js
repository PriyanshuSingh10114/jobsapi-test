const GreenhouseAdapter = require('./GreenhouseAdapter');
const LeverAdapter = require('./LeverAdapter');
const AshbyAdapter = require('./AshbyAdapter');
const WorkdayAdapter = require('./WorkdayAdapter');
const GenericATSAdapter = require('./GenericATSAdapter');
const logger = require('../../config/logger');

class ATSAdapterFactory {
  static getAdapter(atsNameOrSource, page, options = {}) {
    const norm = (atsNameOrSource || '').toLowerCase().trim();

    if (norm.includes('greenhouse')) return new GreenhouseAdapter(page, options);
    if (norm.includes('lever')) return new LeverAdapter(page, options);
    if (norm.includes('ashby')) return new AshbyAdapter(page, options);
    if (norm.includes('workday')) return new WorkdayAdapter(page, options);

    return new GenericATSAdapter(page, options);
  }

  static async detectAndCreate(page, options = {}) {
    const adapters = [
      new GreenhouseAdapter(page, options),
      new LeverAdapter(page, options),
      new AshbyAdapter(page, options),
      new WorkdayAdapter(page, options),
    ];

    for (const adapter of adapters) {
      const isMatch = await adapter.detect(page).catch(() => false);
      if (isMatch) {
        logger.info(`ATSAdapterFactory: Detected active ATS provider [${adapter.atsName}]`);
        return adapter;
      }
    }

    logger.info('ATSAdapterFactory: No specialized ATS detected, using GenericATSAdapter');
    return new GenericATSAdapter(page, options);
  }
}

module.exports = ATSAdapterFactory;
