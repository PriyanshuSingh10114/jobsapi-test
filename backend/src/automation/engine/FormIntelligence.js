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

        return {
          index,
          id: input.id,
          name: input.name,
          type: input.type,
          labelText: labelText.trim().replace(/\n/g, ' '),
          tagName: input.tagName.toLowerCase()
        };
      }).filter(field => field.type !== 'hidden' && field.type !== 'submit');
    });

    // Map labels to semantic meanings
    return this.mapFieldsToSemantics(formFields);
  }

  mapFieldsToSemantics(fields) {
    const semanticMap = {};
    
    fields.forEach(field => {
      const text = (field.labelText + ' ' + field.name).toLowerCase();
      
      if (text.includes('first name') || text.includes('given name') || text.includes('legal first name')) {
        semanticMap['FIRST_NAME'] = field;
      } else if (text.includes('last name') || text.includes('family name')) {
        semanticMap['LAST_NAME'] = field;
      } else if (text.includes('email')) {
        semanticMap['EMAIL'] = field;
      } else if (text.includes('phone') || text.includes('mobile')) {
        semanticMap['PHONE'] = field;
      } else if (text.includes('linkedin')) {
        semanticMap['LINKEDIN_URL'] = field;
      } else if (text.includes('github') || text.includes('portfolio') || text.includes('website')) {
        semanticMap['WEBSITE_URL'] = field;
      } else if (text.includes('resume') || text.includes('cv')) {
        semanticMap['RESUME_UPLOAD'] = field;
      } else if (text.includes('cover letter')) {
        semanticMap['COVER_LETTER_UPLOAD'] = field;
      }
    });

    logger.info(`Mapped ${Object.keys(semanticMap).length} fields to semantic meanings.`);
    return semanticMap;
  }
}

module.exports = FormIntelligence;
