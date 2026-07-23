const logger = require('../../config/logger');

class UniversalDOMEngine {
  constructor(page) {
    this.page = page;
  }

  /**
   * Scans document, Iframes, and Shadow DOM trees to extract every interactive element.
   * @param {Object} [targetContext] - Playwright page or frame context
   * @returns {Promise<Array<Object>>} Scanned interactive fields
   */
  async scanDOM(targetContext = this.page) {
    logger.info('[UniversalDOMEngine] Deep Scanning DOM, Iframes, and Shadow DOM roots...');

    // Execute deep traversal in browser context
    const scannedFields = await targetContext.evaluate(() => {
      const allExtractedControls = [];

      const buildCssPath = (el) => {
        if (!(el instanceof Element)) return '';
        const path = [];
        let curr = el;
        while (curr && curr.nodeType === Node.ELEMENT_NODE) {
          let selector = curr.nodeName.toLowerCase();
          if (curr.id) {
            selector += '#' + CSS.escape(curr.id);
            path.unshift(selector);
            break;
          } else {
            let sib = curr, nth = 1;
            while (sib = sib.previousElementSibling) {
              if (sib.nodeName.toLowerCase() === selector) nth++;
            }
            if (nth !== 1) selector += `:nth-of-type(${nth})`;
          }
          path.unshift(selector);
          curr = curr.parentNode;
        }
        return path.join(' > ');
      };

      const getLabelText = (input) => {
        let labelText = '';
        
        // 1. Explicit <label for="id">
        if (input.id) {
          try {
            const labelEl = document.querySelector(`label[for="${CSS.escape(input.id)}"]`);
            if (labelEl) labelText = labelEl.innerText;
          } catch(e) {}
        }

        // 2. Closest wrapper or container
        if (!labelText) {
          const wrapper = input.closest('label, .field-wrapper, .form-group, .form-field, .field, [class*="field"], [class*="question"], [class*="form-item"]');
          if (wrapper) {
            const lbl = wrapper.querySelector('label, .label, [class*="label"], [class*="title"]');
            labelText = lbl ? lbl.innerText : wrapper.innerText;
          }
        }

        // 3. ARIA attributes
        if (!labelText && input.getAttribute) {
          const ariaLabelledBy = input.getAttribute('aria-labelledby');
          if (ariaLabelledBy) {
            const lblEl = document.getElementById(ariaLabelledBy);
            if (lblEl) labelText = lblEl.innerText;
          }
          if (!labelText) labelText = input.getAttribute('aria-label') || '';
          if (!labelText) labelText = input.getAttribute('placeholder') || '';
          if (!labelText) labelText = input.getAttribute('title') || '';
          if (!labelText) labelText = input.getAttribute('name') || '';
        }

        // 4. Sibling text node fallback
        if (!labelText && input.previousElementSibling) {
          labelText = input.previousElementSibling.innerText || '';
        }

        return (labelText || '').trim().replace(/\s+/g, ' ');
      };

      const getParentSection = (input) => {
        const sectionEl = input.closest('fieldset, section, .section, .block, [class*="section"], [class*="step"], [data-automation-id*="section"]');
        if (sectionEl) {
          const heading = sectionEl.querySelector('legend, h1, h2, h3, h4, .section-title, [class*="header"]');
          if (heading) return heading.innerText.trim().replace(/\s+/g, ' ');
        }
        return '';
      };

      // Traversal helper supporting Shadow DOM
      const traverseTree = (root) => {
        const queryList = [
          'input',
          'select',
          'textarea',
          '[role="combobox"]',
          '[role="listbox"]',
          '[role="checkbox"]',
          '[role="radio"]',
          '[contenteditable="true"]',
          '[data-automation-id*="input"]',
          '[data-automation-id*="select"]',
          'div[class*="select"]',
          'div[class*="picker"]'
        ];

        const elements = Array.from(root.querySelectorAll(queryList.join(',')));

        elements.forEach((el, index) => {
          const tagName = el.tagName.toLowerCase();
          const type = (el.type || '').toLowerCase();
          const role = (el.getAttribute('role') || '').toLowerCase();
          
          if (type === 'hidden' || type === 'submit' || type === 'button') return;

          let controlType = 'text';
          if (tagName === 'select' || role === 'combobox' || role === 'listbox' || el.className?.includes?.('select')) controlType = 'dropdown';
          else if (type === 'checkbox' || role === 'checkbox') controlType = 'checkbox';
          else if (type === 'radio' || role === 'radio') controlType = 'radio';
          else if (type === 'file') controlType = 'file';
          else if (tagName === 'textarea') controlType = 'textarea';
          else if (type === 'date' || el.className?.includes?.('picker')) controlType = 'date';

          let options = [];
          if (tagName === 'select') {
            options = Array.from(el.options).map(o => o.text.trim()).filter(Boolean);
          }

          allExtractedControls.push({
            index,
            id: el.id || '',
            name: el.name || '',
            type,
            role,
            tagName,
            controlType,
            labelText: getLabelText(el),
            parentSection: getParentSection(el),
            autocomplete: el.getAttribute('autocomplete') || '',
            required: el.hasAttribute('required') || el.getAttribute('aria-required') === 'true',
            options,
            cssPath: buildCssPath(el),
            isVisible: el.offsetWidth > 0 && el.offsetHeight > 0
          });
        });

        // Recurse into Shadow DOM roots
        const allShadowHosts = root.querySelectorAll('*');
        allShadowHosts.forEach(host => {
          if (host.shadowRoot) {
            traverseTree(host.shadowRoot);
          }
        });
      };

      traverseTree(document);
      return allExtractedControls;
    });

    logger.info(`[UniversalDOMEngine] Scanned ${scannedFields.length} interactive elements across DOM and Shadow DOM roots.`);
    return scannedFields;
  }
}

module.exports = UniversalDOMEngine;
