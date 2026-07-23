const logger = require('../../config/logger');

class AIQuestionEngine {
  constructor(candidateKnowledgeGraph, jobDetails = {}) {
    this.kg = candidateKnowledgeGraph;
    this.jobDetails = jobDetails;
    this.answerBank = candidateKnowledgeGraph?.graph?.answers || {};
  }

  /**
   * Resolves or generates an answer for any ATS question prompt.
   * @param {string} promptText - Label or prompt text of the question
   * @param {Object} [fieldInfo] - DOM field metadata (controlType, options, parentSection)
   * @returns {Promise<string>} Resolved answer
   */
  async answerQuestion(promptText = '', fieldInfo = {}) {
    logger.info(`[AIQuestionEngine] Generating answer for prompt: "${promptText.substring(0, 60)}..."`);
    const norm = promptText.toLowerCase();

    // 1. Direct answer bank lookup
    if (this.answerBank[promptText]) return this.answerBank[promptText];

    // 2. Behavioral / Cover Essay Questions
    if (norm.includes('why') && (norm.includes('company') || norm.includes('join') || norm.includes('role') || norm.includes('work here'))) {
      const company = this.jobDetails.companyName || fieldInfo.parentSection || 'your team';
      const title = this.jobDetails.title || 'this role';
      return `I am thrilled to apply for ${title} at ${company}. My background in software engineering and track record of building resilient, scalable architectures directly aligns with your engineering goals. I admire your commitment to innovation and would be honored to contribute to your growth.`;
    }

    if (norm.includes('tell us about yourself') || norm.includes('introduce yourself') || norm.includes('bio') || norm.includes('summary')) {
      const profile = this.kg.graph;
      const topExp = profile.experience[0];
      const school = profile.education[0];
      let bio = `I am a dedicated software engineer with ${profile.professional.yearsExperience || 'several'} years of professional experience.`;
      if (topExp) bio += ` Most recently at ${topExp.company}, I focused on ${topExp.title || 'engineering high-impact features'}.`;
      if (school) bio += ` I hold a degree in ${school.discipline || 'Computer Science'} from ${school.school}.`;
      bio += ` I specialize in building reliable products and am excited to bring my technical expertise to your team.`;
      return bio;
    }

    if (norm.includes('project') || norm.includes('challenge') || norm.includes('hardest problem') || norm.includes('accomplishment')) {
      const projects = this.kg.graph.projects;
      if (projects.length > 0) {
        return `One of my proudest projects is ${projects[0].title}. ${projects[0].description} Using ${projects[0].techStack.join(', ')}, I delivered ${projects[0].impact || 'measurable improvements in system efficiency'}.`;
      }
      const exp = this.kg.graph.experience[0];
      if (exp) {
        return `At ${exp.company}, I spearheaded the optimization of core platform services. ${exp.responsibilities} This resulted in enhanced reliability and reduced load times.`;
      }
    }

    // 3. Compensation & Availability
    if (norm.includes('salary') || norm.includes('compensation') || norm.includes('pay') || norm.includes('ctc')) {
      const expSal = this.kg.graph.professional.expectedSalary;
      const minSal = this.kg.graph.preferences.desiredMinSalary;
      if (expSal) return String(expSal);
      if (minSal) return `$${minSal.toLocaleString()}`;
      return 'Negotiable based on overall compensation package';
    }

    if (norm.includes('notice period') || norm.includes('start date') || norm.includes('availability') || norm.includes('available to start')) {
      return this.kg.graph.professional.noticePeriod || '2 weeks';
    }

    if (norm.includes('relocat') || norm.includes('willing to move')) {
      return this.kg.graph.location.willingToRelocate ? 'Yes' : 'No';
    }

    if (norm.includes('sponsorship') || norm.includes('visa')) {
      return this.kg.graph.workAuthorization.requiresSponsorship ? 'Yes' : 'No';
    }

    if (norm.includes('clearance') || norm.includes('security clearance')) {
      return this.kg.graph.workAuthorization.securityClearance || 'None';
    }

    // 4. Multiple Choice Option Selection
    if (fieldInfo.options && fieldInfo.options.length > 0) {
      const opts = fieldInfo.options;
      if (norm.includes('authorized') || norm.includes('right to work') || norm.includes('legally')) {
        const match = opts.find(o => /yes|authorized|citizen|eligible/i.test(o));
        if (match) return match;
      }
      if (norm.includes('sponsorship') || norm.includes('require')) {
        const match = opts.find(o => (this.kg.graph.workAuthorization.requiresSponsorship ? /yes/i : /no/i).test(o));
        if (match) return match;
      }
      return opts[0];
    }

    // Fallback default answer
    return `I am eager to discuss how my technical skills and experience align with your team's needs.`;
  }
}

module.exports = AIQuestionEngine;
