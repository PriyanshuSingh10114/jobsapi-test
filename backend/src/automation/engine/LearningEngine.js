const LearningRecord = require('../../models/LearningRecord');
const logger = require('../../config/logger');

class LearningEngine {
  /**
   * Records unknown or custom fields encountered during form scanning for continuous platform learning.
   * @param {string} connectorName - ATS name (e.g. 'greenhouse', 'lever', 'workday')
   * @param {Array<Object>} unmappedFields - List of field objects that were unclassified or custom
   * @param {string} currentUrl - Active job URL
   */
  static async recordUnmappedFields(connectorName, unmappedFields = [], currentUrl = '') {
    if (!unmappedFields || unmappedFields.length === 0) return;

    logger.info(`[LearningEngine] Processing ${unmappedFields.length} unmapped fields for ${connectorName}`);

    for (const field of unmappedFields) {
      try {
        const label = field.labelText || field.name || field.id || 'unlabeled_field';
        if (label.length < 3) continue;

        await LearningRecord.findOneAndUpdate(
          { connectorName: connectorName.toLowerCase(), fieldLabel: label },
          {
            $inc: { occurrences: 1 },
            $set: {
              fieldName: field.name || '',
              fieldType: field.controlType || field.type || 'text',
              parentSection: field.parentSection || '',
              lastSeenUrl: currentUrl
            }
          },
          { upsert: true, new: true }
        );
      } catch (err) {
        logger.warn(`[LearningEngine] Error recording unmapped field: ${err.message}`);
      }
    }
  }
}

module.exports = LearningEngine;
