const fs = require('fs').promises;
const path = require('path');
const UserProfile = require('../../models/UserProfile');
const logger = require('../../config/logger');

class CandidateKnowledgeGraph {
  constructor(rawProfile = {}) {
    this.raw = rawProfile;
    this.graph = this._buildGraph(rawProfile);
  }

  /**
   * Fetches profile from MongoDB and builds a normalized Candidate Knowledge Graph.
   * @param {string} userId - Clerk User ID
   * @returns {Promise<CandidateKnowledgeGraph>} Candidate Knowledge Graph Instance
   */
  static async loadForUser(userId) {
    logger.info(`[KnowledgeGraph] Loading profile knowledge graph for user: ${userId}`);
    const profile = await UserProfile.findOne({ userId });
    if (!profile) {
      throw new Error(`Profile not found for userId: ${userId}. Please complete Profile Studio.`);
    }
    const raw = profile.toObject();
    const kg = new CandidateKnowledgeGraph(raw);
    await kg.verifyDocuments();
    return kg;
  }

  _buildGraph(raw) {
    const basic = raw.basicInfo || {};
    const loc = raw.location || {};
    const links = raw.links || {};
    const prof = raw.professionalInfo || {};
    const auth = raw.workAuthorization || {};
    const prefs = raw.preferences || {};
    const demo = raw.demographic || raw.demographics || {};

    return {
      userId: raw.userId || '',
      personal: {
        firstName: basic.firstName || raw.firstName || '',
        middleName: basic.middleName || '',
        lastName: basic.lastName || raw.lastName || '',
        preferredName: basic.preferredName || basic.firstName || raw.firstName || '',
        fullName: `${basic.firstName || raw.firstName || ''} ${basic.lastName || raw.lastName || ''}`.trim(),
        dob: basic.dob || '',
        pronouns: basic.pronouns || ''
      },
      contact: {
        email: basic.email || raw.email || '',
        secondaryEmail: basic.secondaryEmail || '',
        phone: basic.phone || raw.phone || '',
        countryCode: basic.countryCode || ''
      },
      location: {
        country: loc.country || '',
        state: loc.state || '',
        city: loc.city || '',
        address: loc.address || '',
        zipCode: loc.zipCode || '',
        timeZone: loc.timeZone || '',
        willingToRelocate: loc.willingToRelocate || false,
        relocationPreferences: loc.relocationPreferences || ''
      },
      links: {
        linkedin: links.linkedin || raw.linkedin || '',
        github: links.github || raw.github || '',
        portfolio: links.portfolio || raw.portfolio || '',
        personalWebsite: links.personalWebsite || '',
        kaggle: links.kaggle || '',
        medium: links.medium || '',
        devto: links.devto || '',
        stackoverflow: links.stackoverflow || '',
        behance: links.behance || '',
        dribbble: links.dribbble || '',
        googleScholar: links.googleScholar || '',
        orcid: links.orcid || ''
      },
      professional: {
        currentCompany: prof.currentCompany || '',
        currentPosition: prof.currentPosition || '',
        yearsExperience: prof.yearsExperience || prof.totalExperience || 0,
        currentSalary: prof.currentSalary || '',
        expectedSalary: prof.expectedSalary || '',
        currency: prof.currency || 'USD',
        noticePeriod: prof.noticePeriod || 'Immediate',
        joiningDate: prof.joiningDate || '',
        employmentStatus: prof.employmentStatus || 'Employed'
      },
      education: (raw.education || []).map(edu => ({
        school: edu.institution || edu.school || '',
        degree: edu.degree || '',
        discipline: edu.major || edu.discipline || '',
        gpa: edu.cgpa || edu.gpa || '',
        graduationDate: edu.graduationDate || ''
      })).sort((a, b) => new Date(b.graduationDate || 0) - new Date(a.graduationDate || 0)),

      experience: (raw.experience || []).map(exp => ({
        company: exp.company || '',
        title: exp.role || exp.title || '',
        startDate: exp.startDate || '',
        endDate: exp.endDate || '',
        responsibilities: exp.responsibilities || '',
        achievements: exp.achievements || '',
        technologies: exp.technologies || []
      })).sort((a, b) => new Date(b.endDate || Date.now()) - new Date(a.endDate || Date.now())),

      projects: (raw.projects || []).map(p => ({
        title: p.title || '',
        description: p.description || '',
        techStack: p.techStack || [],
        githubUrl: p.githubUrl || '',
        demoUrl: p.demoUrl || '',
        impact: p.impact || ''
      })),

      skills: {
        languages: raw.skills?.languages || [],
        frameworks: raw.skills?.frameworks || [],
        cloud: raw.skills?.cloud || [],
        devops: raw.skills?.devops || [],
        ai: raw.skills?.ai || [],
        ml: raw.skills?.ml || [],
        databases: raw.skills?.databases || [],
        tools: raw.skills?.tools || [],
        softSkills: raw.skills?.softSkills || []
      },

      certifications: (raw.certifications || []).map(c => ({
        name: c.name || '',
        issuer: c.issuer || '',
        issueDate: c.issueDate || '',
        credentialUrl: c.credentialUrl || ''
      })),

      workAuthorization: {
        country: auth.country || loc.country || 'United States',
        authorized: auth.citizen || auth.visa || false,
        requiresSponsorship: auth.needSponsorship || false,
        visaType: auth.visaType || '',
        authorizedUntil: auth.authorizedUntil || '',
        securityClearance: auth.securityClearance || 'None'
      },

      preferences: {
        preferredRoleTypes: prefs.preferredRoleTypes || [],
        desiredJobTitles: prefs.desiredJobTitles || [],
        preferredLocations: prefs.preferredLocations || [],
        remotePreference: prefs.remotePreference || 'Remote',
        desiredMinSalary: prefs.desiredMinSalary || 0,
        desiredTargetSalary: prefs.desiredTargetSalary || 0
      },

      demographics: {
        gender: demo.gender || 'Decline to self-identify',
        race: demo.race || 'Decline to self-identify',
        veteranStatus: demo.veteranStatus || 'I am not a protected veteran',
        disabilityStatus: demo.disabilityStatus || 'No, I do not have a disability'
      },

      answers: raw.answerBank || {},

      documents: {
        defaultResume: null,
        resumes: [],
        coverLetters: [],
        portfolios: [],
        transcripts: []
      }
    };
  }

  async verifyDocuments() {
    const assets = this.raw.assets || [];
    for (const asset of assets) {
      if (!asset.filePath) continue;
      try {
        await fs.access(asset.filePath);
        const docRecord = {
          id: asset._id ? asset._id.toString() : 'asset_' + Date.now(),
          filename: asset.name || path.basename(asset.filePath),
          storagePath: asset.filePath,
          atsScore: asset.atsScore || 0
        };

        if (asset.isCoverLetter) {
          this.graph.documents.coverLetters.push(docRecord);
        } else if (asset.isPortfolio) {
          this.graph.documents.portfolios.push(docRecord);
        } else if (asset.isCertificate) {
          this.graph.documents.transcripts.push(docRecord);
        } else {
          this.graph.documents.resumes.push(docRecord);
        }
      } catch (err) {
        logger.warn(`[KnowledgeGraph] Asset file missing on disk: ${asset.filePath}`);
      }
    }

    // Root legacy resumePath fallback
    if (this.graph.documents.resumes.length === 0 && this.raw.resumePath) {
      try {
        await fs.access(this.raw.resumePath);
        this.graph.documents.resumes.push({
          id: 'legacy-root-resume',
          filename: path.basename(this.raw.resumePath),
          storagePath: this.raw.resumePath,
          atsScore: 0
        });
      } catch (e) {}
    }

    if (this.graph.documents.resumes.length > 0) {
      this.graph.documents.resumes.sort((a, b) => b.atsScore - a.atsScore);
      this.graph.documents.defaultResume = this.graph.documents.resumes[0].storagePath;
    }
  }

  toNormalizedProfile() {
    return this.graph;
  }
}

module.exports = CandidateKnowledgeGraph;
