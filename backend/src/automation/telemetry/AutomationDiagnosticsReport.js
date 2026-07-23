const logger = require('../../config/logger');

class AutomationDiagnosticsReport {
  /**
   * Generates a comprehensive diagnostics report for the automation job.
   * @param {Object} params
   * @returns {Object} Structured diagnostics report
   */
  static generate({
    sessionId,
    connectorName,
    automationContext,
    classificationReport,
    profileValidationReport,
    completedFields = [],
    pendingFields = [],
    uploadResults = [],
    executionTimeSeconds = 0
  }) {
    const totalDetected = classificationReport?.totalDetected || 0;
    const totalClassified = classificationReport?.totalClassified || 0;
    const classificationPercentage = classificationReport?.classificationPercentage || 0;

    const report = {
      sessionId,
      connectorName,
      timestamp: new Date().toISOString(),
      executionTimeSeconds,
      browserOwnership: {
        owner: automationContext?.owner || 'WorkerProcessor',
        browserId: automationContext?.browserId || 'N/A',
        contextId: automationContext?.contextId || 'N/A',
        pageId: automationContext?.pageId || 'N/A'
      },
      semanticFieldClassification: {
        totalDetectedControls: totalDetected,
        totalClassifiedControls: totalClassified,
        classificationPercentage: `${classificationPercentage}%`,
        targetMet: classificationPercentage >= 95,
        fieldBreakdown: classificationReport?.fieldBreakdown || {}
      },
      candidateProfile: {
        validationReport: profileValidationReport || null,
        profileCompleteness: profileValidationReport?.completion || 0
      },
      fieldExecution: {
        totalFields: completedFields.length + pendingFields.length,
        fieldsFilledCount: completedFields.length,
        completedFields,
        skippedFieldsCount: pendingFields.length,
        skippedFields: pendingFields.map(p => ({ label: p.label || p.fieldKey, reason: p.reason }))
      },
      uploadVerification: uploadResults,
      status: pendingFields.length > 0 ? 'PausedForUser' : 'Completed'
    };

    logger.info(`[AutomationDiagnosticsReport] Generated report for session ${sessionId} (${report.status}): Classified ${totalClassified}/${totalDetected} (${classificationPercentage}%), Filled ${completedFields.length}, Skipped ${pendingFields.length}`);

    return report;
  }
}

module.exports = AutomationDiagnosticsReport;
