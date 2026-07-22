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
      // Find all standard and custom input fields (including React Select, contenteditable, etc)
      const inputs = Array.from(document.querySelectorAll('input, select, textarea, [role="combobox"], [contenteditable="true"]'));
        const generateCssPath = (el) => {
            if (!(el instanceof Element)) return;
            const path = [];
            while (el.nodeType === Node.ELEMENT_NODE) {
                let selector = el.nodeName.toLowerCase();
                if (el.id) {
                    selector += '#' + el.id;
                    path.unshift(selector);
                    break;
                } else {
                    let sib = el, nth = 1;
                    while (sib = sib.previousElementSibling) {
                        if (sib.nodeName.toLowerCase() == selector) nth++;
                    }
                    if (nth != 1) selector += ":nth-of-type("+nth+")";
                }
                path.unshift(selector);
                el = el.parentNode;
            }
            return path.join(" > ");
        };

        return inputs.map((input, index) => {
          let labelText = '';
          
          // 1. Explicit label
          if (input.id) {
            const label = document.querySelector(`label[for="${input.id}"]`);
            if (label) labelText = label.innerText;
          }
          
          // 2. Closest wrapper
          if (!labelText) {
            const wrapper = input.closest('label, .field-wrapper, .form-group');
            if (wrapper) {
               const lbl = wrapper.querySelector('label');
               labelText = lbl ? lbl.innerText : wrapper.innerText;
            }
          }

          // 3. ARIA label
          if (!labelText) labelText = input.getAttribute('aria-label') || '';

          // 4. Placeholder
          if (!labelText) labelText = input.getAttribute('placeholder') || '';
          
          // 5. Check parent section for context (e.g. 'Education', 'Experience')
          let parentSection = '';
          const sectionEl = input.closest('fieldset, section, .section, .block');
          if (sectionEl) {
             const heading = sectionEl.querySelector('legend, h1, h2, h3, h4');
             if (heading) parentSection = heading.innerText;
          }

          const autocomplete = input.getAttribute('autocomplete') || '';
          const required = input.hasAttribute('required') || input.getAttribute('aria-required') === 'true';
          const role = input.getAttribute('role') || '';
          
          const isHiddenFile = input.type === 'file' && (input.style.display === 'none' || input.style.visibility === 'hidden' || input.style.opacity === '0');

          let controlType = 'text';
          const tagName = input.tagName.toLowerCase();
          if (tagName === 'select' || role === 'combobox' || role === 'listbox') controlType = 'dropdown';
          else if (input.type === 'checkbox') controlType = 'checkbox';
          else if (input.type === 'radio') controlType = 'radio';
          else if (input.type === 'file') controlType = 'file';
          else if (tagName === 'textarea') controlType = 'textarea';

          const cssPath = generateCssPath(input);

          return {
            index,
            id: input.id,
            name: input.name,
            type: input.type,
            autocomplete,
            required,
            role,
            parentSection: parentSection.trim().replace(/\n/g, ' '),
            isHiddenFile,
            labelText: labelText.trim().replace(/\n/g, ' '),
            tagName,
            controlType,
            cssPath,
            isVisible: input.offsetWidth > 0 && input.offsetHeight > 0
          };
        }).filter(field => field.type !== 'hidden' && field.type !== 'submit'); // Skip normal hidden inputs, but we keep hidden files logic above
    });

    this.allFields = formFields;

    // Map labels to semantic meanings
    return this.mapFieldsToSemantics(formFields);
  }

  mapFieldsToSemantics(fields) {
    const semanticMap = {};
    
    fields.forEach(field => {
      const text = (field.labelText + ' ' + field.name + ' ' + field.autocomplete + ' ' + field.parentSection).toLowerCase();
      
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

      // --- BASIC INFO ---
      if (text.match(/\b(first name|given name|legal first name|preferred name)\b/)) assign('FIRST_NAME', 0.99);
      else if (text.match(/\b(last name|family name|surname)\b/)) assign('LAST_NAME', 0.99);
      else if (text.match(/\b(email|email address|primary email)\b/)) assign('EMAIL', 0.99);
      else if (text.match(/\b(phone|mobile|cell|telephone|contact number)\b/)) assign('PHONE', 0.95);
      
      // --- LINKS ---
      else if (text.includes('linkedin')) assign('LINKEDIN_URL', 0.99);
      else if (text.match(/\b(github|gitlab|bitbucket)\b/)) assign('GITHUB_URL', 0.95);
      else if (text.match(/\b(portfolio|personal site|website|blog)\b/)) assign('PORTFOLIO_URL', 0.90);
      else if (text.match(/\b(twitter|x)\b/)) assign('TWITTER_URL', 0.90);
      
      // --- PROFESSIONAL INFO ---
      else if (text.match(/\b(salary|expected pay|compensation|desired pay|ctc)\b/)) assign('EXPECTED_SALARY', 0.90);
      else if (text.match(/\b(current salary|current ctc)\b/)) assign('CURRENT_SALARY', 0.90);
      else if (text.match(/\b(notice period|start date|available to start)\b/)) assign('NOTICE_PERIOD', 0.90);
      else if (text.match(/\b(current company|employer|current employer)\b/)) assign('CURRENT_COMPANY', 0.85);
      
      // --- WORK AUTHORIZATION ---
      else if (text.match(/\b(visa|sponsorship|authorized to work|citizenship|right to work)\b/)) assign('WORK_AUTHORIZATION', 0.85);
      
      // --- EDUCATION ---
      else if (text.match(/\b(university|college|school|institution)\b/)) assign('EDUCATION_SCHOOL', 0.85);
      else if (text.match(/\b(program|major|discipline|field of study)\b/)) assign('EDUCATION_DISCIPLINE', 0.85);
      else if (text.match(/\b(degree|qualification|education level)\b/)) assign('EDUCATION_DEGREE', 0.85);
      else if (text.match(/\b(gpa|grade|score)\b/)) assign('EDUCATION_GPA', 0.85);
      else if (text.match(/\b(graduation year|class of|end year)\b/)) assign('EDUCATION_GRAD_YEAR', 0.85);
      
      // --- EXPERIENCE ---
      else if (text.match(/\b(job title|role|position)\b/)) assign('EXPERIENCE_TITLE', 0.85);
      else if (text.match(/\b(years of experience|total experience|experience level)\b/)) assign('EXPERIENCE_YEARS', 0.85);
      
      // --- VOLUNTARY / DEMOGRAPHICS (PHASE 9) ---
      else if (text.match(/\b(gender|sex)\b/)) assign('VOLUNTARY_GENDER', 0.95);
      else if (text.match(/\b(race|ethnicity)\b/)) assign('VOLUNTARY_RACE', 0.95);
      else if (text.match(/\b(veteran|protected veteran)\b/)) assign('VOLUNTARY_VETERAN', 0.95);
      else if (text.match(/\b(disability)\b/)) assign('VOLUNTARY_DISABILITY', 0.95);
      
      // --- ASSETS ---
      else if (text.match(/\b(resume|cv)\b/)) assign('RESUME_UPLOAD', 0.95);
      else if (text.match(/\b(cover letter)\b/)) assign('COVER_LETTER_UPLOAD', 0.95);
      
      // --- AI QUESTIONS ---
      else if (text.match(/\b(tell us about yourself|summary|who are you)\b/)) assign('AI_TELL_ABOUT_YOURSELF', 0.80);
      else if (text.includes('why') && text.match(/\b(company|work here|join us)\b/)) assign('AI_WHY_COMPANY', 0.85);
      else if (text.match(/\b(describe a project|hardest problem|biggest challenge)\b/)) assign('AI_DESCRIBE_PROJECT', 0.80);
      
      // Track unknown fields for Learning Engine (Phase 12)
      else if (field.labelText && field.labelText.trim().length > 5) {
          assign('UNKNOWN_FIELD', 0.1); 
      }
    });

    logger.info(`Mapped ${Object.keys(semanticMap).length} fields to semantic meanings.`);
    return semanticMap;
  }
}

module.exports = FormIntelligence;
