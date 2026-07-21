const logger = require('../../config/logger');

class AIAnswerEngine {
  constructor(profileData) {
    this.profileData = profileData;
    this.answerBank = profileData.answerBank || {};
  }

  async resolveAnswer(semanticKey, fieldContext = {}) {
    logger.info(`AIAnswerEngine resolving answer for key: ${semanticKey}`);
    
    // In a real implementation, this would call an LLM (OpenAI/Anthropic)
    // with the context of the profile, the job description, and the field's label.
    // We simulate this logic by falling back to the user's answer bank or dynamically combining fields.

    switch (semanticKey) {
      case 'AI_TELL_ABOUT_YOURSELF':
        if (this.answerBank.tellUsAboutYourself) return this.answerBank.tellUsAboutYourself;
        return this._generateSummary();

      case 'AI_WHY_COMPANY':
        if (this.answerBank.whyThisCompany) return this.answerBank.whyThisCompany;
        // Mocking an AI generation based on context
        const companyName = fieldContext.parentSection || 'your company';
        return `I am incredibly excited about the opportunity to join ${companyName}. I have closely followed your recent innovations and believe my background in scalable architecture aligns perfectly with your mission.`;

      case 'AI_DESCRIBE_PROJECT':
        if (this.answerBank.biggestChallenge) return this.answerBank.biggestChallenge;
        const exp = this.profileData.experience || [];
        if (exp.length > 0) {
            return `In my role at ${exp[0].company}, I led the delivery of a major platform overhaul which significantly reduced latency and improved user retention.`;
        }
        return 'I recently built a full-stack platform that scaled to handle thousands of concurrent users, requiring careful database optimization and resilient architecture.';

      case 'EXPECTED_SALARY':
        return this.profileData.basicInfo?.expectedSalary || this.profileData.professionalInfo?.expectedSalary || this.profileData.preferences?.salaryExpectations;

      case 'NOTICE_PERIOD':
        return this.profileData.basicInfo?.noticePeriod || this.profileData.professionalInfo?.noticePeriod || this.answerBank.noticePeriodExplanation || '2 weeks';

      default:
        logger.warn(`No AI resolution strategy found for ${semanticKey}`);
        return null;
    }
  }

  _generateSummary() {
    const basic = this.profileData.basicInfo || this.profileData || {};
    const exp = this.profileData.experience || [];
    let summary = `I am an experienced professional`;
    if (exp.length > 0) summary += ` with a strong background at companies like ${exp[0].company}`;
    summary += `. I am passionate about building scalable solutions and eager to bring my skills to a forward-thinking team.`;
    return summary;
  }
}

module.exports = AIAnswerEngine;
