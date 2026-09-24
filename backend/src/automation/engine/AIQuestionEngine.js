const logger = require('../../config/logger');
const ApplicationMemory = require('../../models/ApplicationMemory');

class AIQuestionEngine {
  constructor(candidateKnowledgeGraph, jobDetails = {}, applicationContext = null) {
    this.kg = candidateKnowledgeGraph;
    this.jobDetails = jobDetails;
    this.appContext = applicationContext;
    this.answerBank = candidateKnowledgeGraph?.graph?.answers || {};
  }

  /**
   * Resolves or generates an answer for any ATS question prompt using the 5-layer hierarchy:
   * ApplicationContext -> ApplicationMemory -> ApplicationDefaults -> PermanentProfile -> AIGenerated
   */
  async answerQuestion(promptText = '', fieldInfo = {}) {
    logger.info(`[AIQuestionEngine] Resolving answer for prompt: "${promptText.substring(0, 60)}..."`);
    const norm = promptText.toLowerCase().trim();

    // LAYER 4: Application Context Check (Job-Specific Submission Context)
    if (this.appContext && Array.isArray(this.appContext.answers)) {
      const match = this.appContext.answers.find(a => a.questionText.toLowerCase() === norm);
      if (match && match.answerValue) {
        logger.info(`[AIQuestionEngine] Layer 4 (ApplicationContext) hit for prompt.`);
        return match.answerValue;
      }
    }

    // LAYER MEMORY: Application Memory Check (Company-Specific Historical Memory)
    if (this.jobDetails.companyName || this.jobDetails.company) {
      try {
        const compNorm = (this.jobDetails.companyName || this.jobDetails.company).toLowerCase().replace(/[^a-z0-9]/g, '_');
        const memory = await ApplicationMemory.findOne({ companyNormalized: compNorm });
        if (memory && Array.isArray(memory.qaPairs)) {
          const memMatch = memory.qaPairs.find(qa => qa.normalizedPrompt === norm || qa.questionText.toLowerCase() === norm);
          if (memMatch && memMatch.answerValue) {
            logger.info(`[AIQuestionEngine] ApplicationMemory hit for ${compNorm}. Reusing previous company answer.`);
            return memMatch.answerValue;
          }
        }
      } catch (e) {}
    }

    // LAYER 3 & 1: Application Defaults & Direct Profile Answer Bank
    if (this.answerBank[promptText]) return this.answerBank[promptText];

    // Common Referral Source Questions ("How did you hear about us?")
    if (norm.includes('hear about us') || norm.includes('referral source') || norm.includes('how did you find')) {
      return 'LinkedIn';
    }

    // LAYER 1 & 2: Behavioral / Cover Essays / Facts from Candidate Knowledge Graph
    if (norm.includes('why') && (norm.includes('company') || norm.includes('join') || norm.includes('role') || norm.includes('work here'))) {
      const company = this.jobDetails.companyName || this.jobDetails.company || fieldInfo.parentSection || 'your engineering team';
      const title = this.jobDetails.title || 'this role';
      return `I am thrilled to apply for ${title} at ${company}. My background in software engineering and track record of building resilient, scalable architectures directly aligns with your engineering goals. I admire your commitment to innovation and would be honored to contribute to your growth.`;
    }

    if (norm.includes('tell us about yourself') || norm.includes('introduce yourself') || norm.includes('bio') || norm.includes('summary')) {
      const profile = this.kg?.graph || {};
      const topExp = profile.experience?.[0] || profile.employment?.[0];
      const school = profile.education?.[0];
      let bio = `I am a dedicated software engineer with ${profile.professional?.yearsExperience || 'several'} years of professional experience.`;
      if (topExp) bio += ` Most recently at ${topExp.company}, I focused on ${topExp.title || topExp.role || 'engineering high-impact features'}.`;
      if (school) bio += ` I hold a degree from ${school.school || school.institution || 'university'}.`;
      bio += ` I specialize in building reliable products and am excited to bring my technical expertise to your team.`;
      return bio;
    }

    if (norm.includes('project') || norm.includes('challenge') || norm.includes('hardest problem') || norm.includes('accomplishment')) {
      const projects = this.kg?.graph?.projects || [];
      if (projects.length > 0) {
        return `One of my proudest projects is ${projects[0].title}. ${projects[0].description} Using ${(projects[0].techStack || []).join(', ')}, I delivered ${projects[0].impact || 'measurable improvements in system efficiency'}.`;
      }
      const exp = this.kg?.graph?.experience?.[0] || this.kg?.graph?.employment?.[0];
      if (exp) {
        return `At ${exp.company}, I spearheaded the optimization of core platform services. ${exp.responsibilities || ''} This resulted in enhanced reliability and reduced load times.`;
      }
    }

    // LAYER 2: Compensation, Notice Period, Mobility
    if (norm.includes('salary') || norm.includes('compensation') || norm.includes('pay') || norm.includes('ctc')) {
      const expSal = this.kg?.graph?.professional?.expectedSalary || this.kg?.graph?.preferences?.desiredMinSalary;
      if (expSal) return String(expSal);
      return 'Negotiable based on overall compensation package';
    }

    if (norm.includes('notice period') || norm.includes('start date') || norm.includes('availability') || norm.includes('available to start')) {
      return this.kg?.graph?.preferences?.noticePeriod || this.kg?.graph?.professional?.noticePeriod || '2 weeks';
    }

    if (norm.includes('relocat') || norm.includes('willing to move')) {
      return (this.kg?.graph?.preferences?.willingToRelocate || this.kg?.graph?.location?.willingToRelocate) ? 'Yes' : 'No';
    }

    if (norm.includes('sponsorship') || norm.includes('visa')) {
      return (this.kg?.graph?.authorization?.requiresSponsorshipNowOrFuture || this.kg?.graph?.workAuthorization?.requiresSponsorship) ? 'Yes' : 'No';
    }

    if (norm.includes('clearance') || norm.includes('security clearance')) {
      return this.kg?.graph?.compliance?.securityClearance || this.kg?.graph?.workAuthorization?.securityClearance || 'None';
    }

    // MULTIPLE CHOICE OPTIONS RESOLUTION
    if (fieldInfo.options && fieldInfo.options.length > 0) {
      const opts = fieldInfo.options;
      if (norm.includes('authorized') || norm.includes('right to work') || norm.includes('legally')) {
        const match = opts.find(o => /yes|authorized|citizen|eligible/i.test(o));
        if (match) return match;
      }
      if (norm.includes('sponsorship') || norm.includes('require')) {
        const req = this.kg?.graph?.authorization?.requiresSponsorshipNowOrFuture || this.kg?.graph?.workAuthorization?.requiresSponsorship;
        const match = opts.find(o => (req ? /yes/i : /no/i).test(o));
        if (match) return match;
      }
      return opts[0];
    }

    // FALLBACK
    return `I am eager to discuss how my technical skills and experience align with your team's needs.`;
  }
}

module.exports = AIQuestionEngine;
