const logger = require('../../config/logger');
const UniversalDOMEngine = require('./UniversalDOMEngine');

class FormIntelligence {
  constructor(page, locatorEngine) {
    this.page = page;
    this.locatorEngine = locatorEngine;
    this.domEngine = new UniversalDOMEngine(page);
    this.allFields = [];
    this.classificationReport = null;
  }

  /**
   * Analyzes the page or iframe DOM to build a comprehensive map of inputs and their semantic meanings.
   */
  async analyzeForm(context = this.page) {
    logger.info('[FormIntelligence] Analyzing DOM for universal form intelligence...');
    
    const formFields = await this.domEngine.scanDOM(context);
    this.allFields = formFields;

    return this.mapFieldsToSemantics(formFields);
  }

  mapFieldsToSemantics(fields) {
    const semanticMap = {};
    let classifiedCount = 0;
    const fieldBreakdown = {};

    fields.forEach((field, idx) => {
      const text = (field.labelText + ' ' + field.name + ' ' + field.autocomplete + ' ' + field.parentSection).toLowerCase();
      let matchedKey = null;
      let confidence = 0.90;

      // Autocomplete high confidence matches
      if (field.autocomplete === 'given-name') matchedKey = 'FIRST_NAME';
      else if (field.autocomplete === 'family-name') matchedKey = 'LAST_NAME';
      else if (field.autocomplete === 'email') matchedKey = 'EMAIL';
      else if (field.autocomplete === 'tel') matchedKey = 'PHONE';
      else if (field.autocomplete === 'address-level2') matchedKey = 'CITY';
      else if (field.autocomplete === 'country') matchedKey = 'COUNTRY';

      // --- BASIC INFO ---
      else if (text.match(/\b(full name|candidate name|your name)\b/)) matchedKey = 'FULL_NAME';
      else if (text.match(/\b(first name|given name|legal first name|forename)\b/)) matchedKey = 'FIRST_NAME';
      else if (text.match(/\b(middle name|middle initial)\b/)) matchedKey = 'MIDDLE_NAME';
      else if (text.match(/\b(last name|family name|surname)\b/)) matchedKey = 'LAST_NAME';
      else if (text.match(/\b(preferred name|chosen name|nickname)\b/)) matchedKey = 'PREFERRED_NAME';
      else if (text.match(/\b(email|email address|primary email)\b/)) matchedKey = 'EMAIL';
      else if (text.match(/\b(secondary email|alternate email)\b/)) matchedKey = 'SECONDARY_EMAIL';
      else if (text.match(/\b(phone|mobile|cell|telephone|contact number)\b/)) matchedKey = 'PHONE';
      else if (text.match(/\b(date of birth|dob|birth date)\b/)) matchedKey = 'DOB';
      else if (text.match(/\b(pronoun|pronouns)\b/)) matchedKey = 'PRONOUNS';

      // --- LOCATION ---
      else if (text.match(/\b(country|nation|residence country)\b/)) matchedKey = 'COUNTRY';
      else if (text.match(/\b(state|province|region)\b/)) matchedKey = 'STATE';
      else if (text.match(/\b(city|town|municipality)\b/)) matchedKey = 'CITY';
      else if (text.match(/\b(street address|address line 1|street)\b/)) matchedKey = 'ADDRESS';
      else if (text.match(/\b(zip code|postal code|zip|postcode)\b/)) matchedKey = 'ZIP_CODE';
      else if (text.match(/\b(relocat|willing to relocate|relocation)\b/)) matchedKey = 'RELOCATION';

      // --- LINKS ---
      else if (text.includes('linkedin')) matchedKey = 'LINKEDIN_URL';
      else if (text.match(/\b(github|gitlab|bitbucket)\b/)) matchedKey = 'GITHUB_URL';
      else if (text.match(/\b(portfolio|personal site|website|blog)\b/)) matchedKey = 'PORTFOLIO_URL';
      else if (text.match(/\b(twitter|x profile|x handle)\b/)) matchedKey = 'TWITTER_URL';
      else if (text.match(/\b(kaggle)\b/)) matchedKey = 'KAGGLE_URL';
      else if (text.match(/\b(medium)\b/)) matchedKey = 'MEDIUM_URL';
      else if (text.match(/\b(dev\.to|devto)\b/)) matchedKey = 'DEVTO_URL';
      else if (text.match(/\b(stackoverflow)\b/)) matchedKey = 'STACKOVERFLOW_URL';

      // --- PROFESSIONAL INFO ---
      else if (text.match(/\b(current company|employer|current employer)\b/)) matchedKey = 'CURRENT_COMPANY';
      else if (text.match(/\b(current title|current position|role title)\b/)) matchedKey = 'CURRENT_TITLE';
      else if (text.match(/\b(years of experience|total experience|experience level)\b/)) matchedKey = 'YEARS_EXPERIENCE';
      else if (text.match(/\b(current salary|current ctc|current pay)\b/)) matchedKey = 'CURRENT_SALARY';
      else if (text.match(/\b(expected salary|desired pay|expected ctc|compensation expectations)\b/)) matchedKey = 'EXPECTED_SALARY';
      else if (text.match(/\b(notice period|start date|available to start|availability)\b/)) matchedKey = 'NOTICE_PERIOD';

      // --- WORK AUTHORIZATION ---
      else if (text.match(/\b(authorized to work|legally authorized|right to work|work permit)\b/)) matchedKey = 'WORK_AUTHORIZATION';
      else if (text.match(/\b(visa|sponsorship|require sponsorship|need sponsorship)\b/)) matchedKey = 'VISA_SPONSORSHIP';
      else if (text.match(/\b(citizenship|nationality)\b/)) matchedKey = 'CITIZENSHIP';
      else if (text.match(/\b(clearance|security clearance)\b/)) matchedKey = 'SECURITY_CLEARANCE';

      // --- EDUCATION ---
      else if (text.match(/\b(university|college|school|institution)\b/)) matchedKey = 'EDUCATION_SCHOOL';
      else if (text.match(/\b(degree|qualification|education level)\b/)) matchedKey = 'EDUCATION_DEGREE';
      else if (text.match(/\b(program|major|discipline|field of study)\b/)) matchedKey = 'EDUCATION_DISCIPLINE';
      else if (text.match(/\b(gpa|grade|score)\b/)) matchedKey = 'EDUCATION_GPA';
      else if (text.match(/\b(graduation year|class of|end year)\b/)) matchedKey = 'EDUCATION_GRAD_YEAR';

      // --- ASSETS ---
      else if (text.match(/\b(resume|cv|curriculum vitae)\b/)) matchedKey = 'RESUME_UPLOAD';
      else if (text.match(/\b(cover letter)\b/)) matchedKey = 'COVER_LETTER_UPLOAD';
      else if (text.match(/\b(transcript)\b/)) matchedKey = 'TRANSCRIPT_UPLOAD';
      else if (text.match(/\b(portfolio file|attachment)\b/)) matchedKey = 'PORTFOLIO_UPLOAD';

      // --- VOLUNTARY / DEMOGRAPHICS ---
      else if (text.match(/\b(gender|sex)\b/)) matchedKey = 'VOLUNTARY_GENDER';
      else if (text.match(/\b(race|ethnicity)\b/)) matchedKey = 'VOLUNTARY_RACE';
      else if (text.match(/\b(veteran|protected veteran)\b/)) matchedKey = 'VOLUNTARY_VETERAN';
      else if (text.match(/\b(disability)\b/)) matchedKey = 'VOLUNTARY_DISABILITY';

      // --- AI QUESTIONS ---
      else if (text.match(/\b(tell us about yourself|summary|who are you)\b/)) matchedKey = 'AI_TELL_ABOUT_YOURSELF';
      else if (text.includes('why') && text.match(/\b(company|work here|join us)\b/)) matchedKey = 'AI_WHY_COMPANY';
      else if (text.match(/\b(describe a project|hardest problem|biggest challenge)\b/)) matchedKey = 'AI_DESCRIBE_PROJECT';

      // Dynamic Custom Questions
      else {
        matchedKey = `CUSTOM_QUESTION_${idx + 1}`;
        confidence = 0.85;
      }

      if (matchedKey) {
        classifiedCount++;
        fieldBreakdown[matchedKey] = (fieldBreakdown[matchedKey] || 0) + 1;
        if (!semanticMap[matchedKey] || semanticMap[matchedKey].confidence < confidence) {
          semanticMap[matchedKey] = { ...field, confidence, semanticKey: matchedKey };
        }
      }
    });

    const totalDetected = fields.length;
    const classificationPercentage = totalDetected > 0 ? Math.round((classifiedCount / totalDetected) * 100) : 100;

    this.classificationReport = {
      totalDetected,
      totalClassified: classifiedCount,
      classificationPercentage,
      fieldBreakdown
    };

    logger.info(`[FormIntelligence] Classified ${classifiedCount}/${totalDetected} fields (${classificationPercentage}% coverage). Primary keys: ${Object.keys(semanticMap).length}`);

    return semanticMap;
  }
}

module.exports = FormIntelligence;
