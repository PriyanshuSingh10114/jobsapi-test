const logger = require('../../config/logger');

class UniversalFieldMappingEngine {
  constructor() {
    this.dictionary = {
      // PERSONAL / IDENTITY
      'personal.firstName': [
        /\b(first name|given name|legal first name|forename|fname)\b/i,
        /^name\.first/i,
        /^first_name$/i
      ],
      'personal.lastName': [
        /\b(last name|family name|surname|legal last name|lname)\b/i,
        /^name\.last/i,
        /^last_name$/i
      ],
      'personal.fullName': [
        /\b(full name|candidate name|your name)\b/i,
        /^name$/i
      ],
      'personal.preferredName': [
        /\b(preferred name|chosen name|nickname)\b/i
      ],
      'personal.pronouns': [
        /\b(pronoun|pronouns|preferred pronouns)\b/i
      ],

      // CONTACT
      'contact.email': [
        /\b(email|email address|primary email|e-mail)\b/i,
        /^email$/i
      ],
      'contact.phone': [
        /\b(phone|mobile|cell|telephone|contact number|phone number)\b/i,
        /^phone$/i
      ],

      // LOCATION
      'location.country': [
        /\b(country|nation|residence country)\b/i
      ],
      'location.state': [
        /\b(state|province|region)\b/i
      ],
      'location.city': [
        /\b(city|town|municipality)\b/i
      ],
      'location.address': [
        /\b(street address|address line 1|street)\b/i
      ],
      'location.zipCode': [
        /\b(zip code|postal code|zip|postcode)\b/i
      ],

      // WORK AUTHORIZATION & VISA
      'authorization.isAuthorized': [
        /\b(authorized to work|legally authorized|right to work|eligible to work)\b/i,
        /\bwork authorization\b/i
      ],
      'authorization.requiresSponsorship': [
        /\b(require sponsorship|visa sponsorship|sponsorship in future|require visa)\b/i
      ],

      // LINKS & PROFILES
      'links.linkedin': [
        /linkedin/i
      ],
      'links.github': [
        /\b(github|gitlab|bitbucket)\b/i
      ],
      'links.portfolio': [
        /\b(portfolio|personal website|website|personal site)\b/i
      ],

      // COMPENSATION & PREFERENCES
      'preferences.desiredSalary': [
        /\b(desired salary|expected salary|compensation target|salary expectation)\b/i
      ],
      'preferences.noticePeriod': [
        /\b(notice period|earliest start date|availability|start date)\b/i
      ],
      'preferences.relocation': [
        /\b(willing to relocate|relocation|relocate)\b/i
      ],

      // EEO & DEMOGRAPHICS
      'demographics.gender': [
        /\b(gender|gender identity|sex)\b/i
      ],
      'demographics.race': [
        /\b(race|ethnicity|race\/ethnicity)\b/i
      ],
      'demographics.veteran': [
        /\b(veteran|veteran status|vevraa)\b/i
      ],
      'demographics.disability': [
        /\b(disability|disability status|form cc-305)\b/i
      ]
    };
  }

  /**
   * Maps a DOM element's metadata to a canonical internal property key.
   * @param {Object} fieldMetadata - { labelText, name, id, placeholder, autocomplete, parentSection }
   * @returns {string} Canonical key (e.g. 'personal.firstName') or 'custom.unmapped'
   */
  mapField(fieldMetadata) {
    const text = [
      fieldMetadata.labelText || '',
      fieldMetadata.name || '',
      fieldMetadata.id || '',
      fieldMetadata.placeholder || '',
      fieldMetadata.autocomplete || '',
      fieldMetadata.parentSection || ''
    ].join(' ').toLowerCase();

    // Check autocomplete attribute first for high confidence
    if (fieldMetadata.autocomplete === 'given-name') return 'personal.firstName';
    if (fieldMetadata.autocomplete === 'family-name') return 'personal.lastName';
    if (fieldMetadata.autocomplete === 'email') return 'contact.email';
    if (fieldMetadata.autocomplete === 'tel') return 'contact.phone';
    if (fieldMetadata.autocomplete === 'address-level2') return 'location.city';
    if (fieldMetadata.autocomplete === 'address-level1') return 'location.state';
    if (fieldMetadata.autocomplete === 'postal-code') return 'location.zipCode';

    for (const [canonicalKey, regexes] of Object.entries(this.dictionary)) {
      for (const regex of regexes) {
        if (regex.test(text)) {
          return canonicalKey;
        }
      }
    }

    return 'custom.unmapped';
  }
}

module.exports = new UniversalFieldMappingEngine();
