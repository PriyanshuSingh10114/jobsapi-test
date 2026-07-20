const logger = require('../../config/logger');

class FormIntelligence {
  constructor(page, locatorEngine) {
    this.page = page;
    this.locatorEngine = locatorEngine;
  }

  /**
   * Analyzes the page DOM to build a map of inputs and their semantic meanings.
   */
  async analyzeForm(context = this.page) {
    logger.info('Analyzing DOM for form intelligence...');
    
    // Inject a script into the page or iframe to extract all inputs and their associated labels
    const formFields = await context.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
      return inputs.map((input, index) => {
        let labelText = '';
        
        // 1. Try finding explicit label element
        if (input.id) {
          const label = document.querySelector(`label[for="${input.id}"]`);
          if (label) labelText = label.innerText;
        }
        
        // 2. Try closest wrapping label
        if (!labelText) {
          const wrapper = input.closest('label');
          if (wrapper) labelText = wrapper.innerText;
        }

        // 3. Try aria-label
        if (!labelText) {
          labelText = input.getAttribute('aria-label') || '';
        }

        // 4. Try placeholder
        if (!labelText) {
          labelText = input.getAttribute('placeholder') || '';
        }

        // 5. Try autocomplete
        const autocomplete = input.getAttribute('autocomplete') || '';

        return {
          index,
          id: input.id,
          name: input.name,
          type: input.type,
          autocomplete,
          labelText: labelText.trim().replace(/\n/g, ' '),
          tagName: input.tagName.toLowerCase()
        };
      }).filter(field => field.type !== 'hidden' && field.type !== 'submit');
    });

    this.allFields = formFields;

    // Map labels to semantic meanings
    return this.mapFieldsToSemantics(formFields);
  }

  mapFieldsToSemantics(fields) {
    const semanticMap = {};
    
    fields.forEach(field => {
      const text = (field.labelText + ' ' + field.name + ' ' + field.autocomplete).toLowerCase();
      
      const assign = (key, confidence = 1.0) => {
         if (!semanticMap[key] || semanticMap[key].confidence < confidence) {
             semanticMap[key] = { ...field, confidence };
         }
      };
      
      // Auto-complete high confidence matches
      if (field.autocomplete === 'given-name') assign('FIRST_NAME', 1.0);
      else if (field.autocomplete === 'family-name') assign('LAST_NAME', 1.0);
      else if (field.autocomplete === 'email') assign('EMAIL', 1.0);
      else if (field.autocomplete === 'tel') assign('PHONE', 1.0);

      // Basic Info
      if (text.includes('first name') || text.includes('given name') || text.includes('legal first name')) assign('FIRST_NAME', 0.99);
      else if (text.includes('last name') || text.includes('family name')) assign('LAST_NAME', 0.99);
      else if (text.includes('email')) assign('EMAIL', 0.99);
      else if (text.includes('phone') || text.includes('mobile')) assign('PHONE', 0.95);
      
      // Links
      else if (text.includes('linkedin')) assign('LINKEDIN_URL', 0.99);
      else if (text.includes('github') || text.includes('portfolio') || text.includes('website')) assign('WEBSITE_URL', 0.90);
      
      // Professional Info
      else if (text.includes('salary') || text.includes('expected pay') || text.includes('compensation')) assign('EXPECTED_SALARY', 0.90);
      else if (text.includes('notice period') || text.includes('start date') || text.includes('available to start')) assign('NOTICE_PERIOD', 0.90);
      else if (text.includes('current company') || text.includes('employer')) assign('CURRENT_COMPANY', 0.85);
      
      // Work Auth
      else if (text.includes('visa') || text.includes('sponsorship') || text.includes('authorized to work')) assign('VISA_STATUS', 0.85);
      
      // Assets
      else if (text.includes('resume') || text.includes('cv')) assign('RESUME_UPLOAD', 0.95);
      else if (text.includes('cover letter')) assign('COVER_LETTER_UPLOAD', 0.95);
      
      // AI Questions
      else if (text.includes('tell us about yourself') || text.includes('summary')) assign('AI_TELL_ABOUT_YOURSELF', 0.80);
      else if (text.includes('why') && (text.includes('company') || text.includes('work here'))) assign('AI_WHY_COMPANY', 0.85);
    });

    logger.info(`Mapped ${Object.keys(semanticMap).length} fields to semantic meanings.`);
    return semanticMap;
  }
}

module.exports = FormIntelligence;
