const logger = require('../../config/logger');

class ResumeTailoringService {
  /**
   * Tailors application assets (resume selection, cover letter, recruiter summary) for a specific job posting.
   * @param {Object} candidateKnowledgeGraph - Instance of CandidateKnowledgeGraph
   * @param {Object} jobDetails - Object containing title, companyName, description, requirements
   * @returns {Promise<Object>} Tailoring Result
   */
  static async tailorForJob(candidateKnowledgeGraph, jobDetails = {}) {
    logger.info(`[ResumeTailoringService] Tailoring assets for ${jobDetails.title || 'Role'} at ${jobDetails.companyName || 'Company'}`);

    const graph = candidateKnowledgeGraph.graph;
    const resumes = graph.documents.resumes || [];
    const defaultResume = graph.documents.defaultResume;

    // 1. Keyword extraction from job description
    const textToAnalyze = `${jobDetails.title || ''} ${jobDetails.description || ''} ${jobDetails.requirements || ''}`.toLowerCase();
    const skills = [...(graph.skills.languages || []), ...(graph.skills.frameworks || []), ...(graph.skills.cloud || []), ...(graph.skills.tools || [])];

    const matchedKeywords = skills.filter(skill => textToAnalyze.includes(skill.toLowerCase()));

    // 2. Select best matching resume version
    let bestResumePath = defaultResume;
    if (resumes.length > 1) {
      let highestScore = -1;
      for (const res of resumes) {
        let score = res.atsScore || 0;
        if (res.filename.toLowerCase().includes(jobDetails.title?.toLowerCase() || '')) {
          score += 20;
        }
        if (score > highestScore) {
          highestScore = score;
          bestResumePath = res.storagePath;
        }
      }
    }

    // 3. Generate customized cover letter text if not already attached
    const coverLetterText = `Dear Hiring Team at ${jobDetails.companyName || 'your company'},\n\nI am writing to express my strong interest in the ${jobDetails.title || 'Software Engineer'} role. With my background in ${matchedKeywords.slice(0, 4).join(', ') || 'software engineering'}, I have successfully delivered high-performance systems and user-centric features.\n\nI look forward to discussing how my experience can support your engineering goals.\n\nSincerely,\n${graph.personal.fullName}`;

    // 4. Recruiter summary snippet
    const recruiterSummary = `${graph.personal.fullName} - ${graph.professional.yearsExperience || 'Experienced'} years exp. Key skills: ${matchedKeywords.slice(0, 5).join(', ') || 'Full-stack software engineering'}.`;

    return {
      selectedResumePath: bestResumePath,
      matchedKeywords,
      coverLetterText,
      recruiterSummary,
      tailored: true
    };
  }
}

module.exports = ResumeTailoringService;
