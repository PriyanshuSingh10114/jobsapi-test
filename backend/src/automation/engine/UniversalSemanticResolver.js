/**
 * Universal Semantic Resolver
 * File: backend/src/automation/engine/UniversalSemanticResolver.js
 * Translates raw DOM field attributes and ATS IDs (e.g. Lever cards[07fdf...]) into canonical semantic fields.
 */

const logger = require('../../config/logger');

class UniversalSemanticResolver {
  constructor() {
    this.semanticRules = [
      // IDENTITY
      { pattern: /\b(first name|given name|legal first name|forename|fname)\b/i, canonicalKey: 'identity.firstName', category: 'Identity' },
      { pattern: /\b(middle name|middle initial)\b/i, canonicalKey: 'identity.middleName', category: 'Identity' },
      { pattern: /\b(last name|family name|surname|legal last name|lname)\b/i, canonicalKey: 'identity.lastName', category: 'Identity' },
      { pattern: /\b(full name|candidate name|your name)\b/i, canonicalKey: 'identity.fullName', category: 'Identity' },
      { pattern: /\b(preferred name|chosen name|nickname)\b/i, canonicalKey: 'identity.preferredName', category: 'Identity' },
      { pattern: /\b(pronoun|pronouns)\b/i, canonicalKey: 'identity.pronouns', category: 'Identity' },

      // CONTACT
      { pattern: /\b(email|email address|primary email|e-mail)\b/i, canonicalKey: 'contact.email', category: 'Contact' },
      { pattern: /\b(phone|mobile|cell|telephone|contact number|phone number)\b/i, canonicalKey: 'contact.phone', category: 'Contact' },

      // LOCATION
      { pattern: /\b(country|nation|residence country)\b/i, canonicalKey: 'location.country', category: 'Location' },
      { pattern: /\b(state|province|region)\b/i, canonicalKey: 'location.state', category: 'Location' },
      { pattern: /\b(city|town|municipality)\b/i, canonicalKey: 'location.city', category: 'Location' },
      { pattern: /\b(street address|address line 1|street)\b/i, canonicalKey: 'location.address', category: 'Location' },
      { pattern: /\b(zip code|postal code|zip|postcode)\b/i, canonicalKey: 'location.zipCode', category: 'Location' },

      // WORK AUTHORIZATION & MILITARY / DEFENSE
      { pattern: /\b(authorized to work|legally authorized|right to work|work permit)\b/i, canonicalKey: 'authorization.isAuthorizedInUS', category: 'Authorization' },
      { pattern: /\b(visa|sponsorship|require sponsorship|need sponsorship)\b/i, canonicalKey: 'authorization.requiresSponsorshipNowOrFuture', category: 'Authorization' },
      { pattern: /\b(military|military program|service member|veteran)\b/i, canonicalKey: 'military.program', category: 'Defense' },
      { pattern: /\b(itar|us person|export control)\b/i, canonicalKey: 'compliance.isITARUSPerson', category: 'Defense' },
      { pattern: /\b(clearance|security clearance)\b/i, canonicalKey: 'compliance.securityClearance', category: 'Defense' },

      // LINKS
      { pattern: /linkedin/i, canonicalKey: 'links.linkedin', category: 'Links' },
      { pattern: /\b(github|gitlab|bitbucket)\b/i, canonicalKey: 'links.github', category: 'Links' },
      { pattern: /\b(portfolio|personal site|website|blog)\b/i, canonicalKey: 'links.portfolio', category: 'Links' },

      // COMPENSATION & PREFERENCES
      { pattern: /\b(desired salary|expected salary|compensation target|desired pay)\b/i, canonicalKey: 'preferences.desiredMinSalary', category: 'Preferences' },
      { pattern: /\b(notice period|earliest start date|availability|start date)\b/i, canonicalKey: 'preferences.noticePeriod', category: 'Preferences' },
      { pattern: /\b(referral|how did you hear|hear about us|source)\b/i, canonicalKey: 'referral.source', category: 'Preferences' },
      { pattern: /\b(relocat|willing to relocate|relocation)\b/i, canonicalKey: 'preferences.willingToRelocate', category: 'Preferences' },

      // EEO & DEMOGRAPHICS
      { pattern: /\b(gender|sex)\b/i, canonicalKey: 'demographics.gender', category: 'Demographics' },
      { pattern: /\b(race|ethnicity)\b/i, canonicalKey: 'demographics.raceEthnicity', category: 'Demographics' },
      { pattern: /\b(veteran status|vevraa)\b/i, canonicalKey: 'demographics.veteranStatus', category: 'Demographics' },
      { pattern: /\b(disability|form cc-305)\b/i, canonicalKey: 'demographics.disabilityStatus', category: 'Demographics' }
    ];
  }

  /**
   * Resolves raw DOM element metadata into a clean canonical semantic key.
   * @param {Object} fieldMetadata - { labelText, name, id, placeholder, autocomplete, parentSection }
   * @returns {Object} { canonicalKey, cleanLabelText, category, confidence }
   */
  resolve(fieldMetadata) {
    let rawText = [
      fieldMetadata.labelText || '',
      fieldMetadata.placeholder || '',
      fieldMetadata.name || '',
      fieldMetadata.id || '',
      fieldMetadata.parentSection || ''
    ].join(' ');

    // Clean raw Lever IDs (e.g. cards[07fdf...] or field1)
    let cleanLabelText = fieldMetadata.labelText || '';
    if (!cleanLabelText || cleanLabelText.startsWith('cards[') || cleanLabelText.startsWith('field')) {
      cleanLabelText = fieldMetadata.placeholder || fieldMetadata.name || 'Application Field';
      // Clean Lever bracket prefixes
      cleanLabelText = cleanLabelText.replace(/^cards\[[a-z0-9]+\]/i, '').replace(/_/g, ' ').trim();
    }

    // Match autocomplete attributes first
    if (fieldMetadata.autocomplete === 'given-name') return { canonicalKey: 'identity.firstName', cleanLabelText: 'First Name', category: 'Identity', confidence: 1.0 };
    if (fieldMetadata.autocomplete === 'family-name') return { canonicalKey: 'identity.lastName', cleanLabelText: 'Last Name', category: 'Identity', confidence: 1.0 };
    if (fieldMetadata.autocomplete === 'email') return { canonicalKey: 'contact.email', cleanLabelText: 'Email', category: 'Contact', confidence: 1.0 };
    if (fieldMetadata.autocomplete === 'tel') return { canonicalKey: 'contact.phone', cleanLabelText: 'Phone', category: 'Contact', confidence: 1.0 };

    for (const rule of this.semanticRules) {
      if (rule.pattern.test(rawText)) {
        return {
          canonicalKey: rule.canonicalKey,
          cleanLabelText,
          category: rule.category,
          confidence: 0.95
        };
      }
    }

    // Fallback for custom questions
    const safeKey = `custom.question_${(cleanLabelText || 'unmapped').toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 30)}`;
    return {
      canonicalKey: safeKey,
      cleanLabelText: cleanLabelText || 'Custom Question',
      category: 'CustomQuestion',
      confidence: 0.85
    };
  }
}

module.exports = new UniversalSemanticResolver();
