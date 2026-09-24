const { CanonicalFieldRegistry } = require('../canonical/CanonicalFieldRegistry');
const logger = require('../../config/logger');

/**
 * Base ATS Adapter Interface
 * Isolates ATS-specific DOM selectors, form discovery, field mappings,
 * validation, and submission mechanics from candidate profile data.
 */
class ATSAdapter {
  constructor(page, options = {}) {
    this.page = page;
    this.options = options;
    this.atsName = 'generic';
  }

  /**
   * Detects if the current Playwright page matches this ATS adapter
   * @param {import('playwright').Page} page
   * @returns {Promise<boolean>}
   */
  async detect(page) {
    throw new Error('detect() must be implemented by subclass');
  }

  /**
   * Discovers all interactive application input fields on the page
   * @param {import('playwright').Page} page
   * @returns {Promise<Array<Object>>} List of discovered field descriptors
   */
  async discoverFields(page) {
    const fields = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]), select, textarea'));
      return inputs.map((el, idx) => {
        const id = el.id || '';
        const name = el.name || '';
        const type = el.type || el.tagName.toLowerCase();
        const placeholder = el.placeholder || '';
        const ariaLabel = el.getAttribute('aria-label') || '';
        const isRequired = el.required || el.getAttribute('aria-required') === 'true' || !!el.closest('.required');

        // Locate closest label
        let labelText = '';
        if (id) {
          const labelEl = document.querySelector(`label[for="${id}"]`);
          if (labelEl) labelText = labelEl.innerText;
        }
        if (!labelText && el.closest('label')) {
          labelText = el.closest('label').innerText;
        }
        if (!labelText && el.previousElementSibling && el.previousElementSibling.tagName === 'LABEL') {
          labelText = el.previousElementSibling.innerText;
        }

        const selector = id ? `#${id}` : (name ? `[name="${name}"]` : `input:nth-of-type(${idx + 1})`);

        return {
          id,
          name,
          selector,
          type,
          label: (labelText || ariaLabel || placeholder || name || id).trim(),
          placeholder,
          ariaLabel,
          required: isRequired
        };
      });
    });

    return fields;
  }

  /**
   * Maps a discovered DOM field to a canonical field in the registry
   * @param {Object} field - Discovered field descriptor
   * @returns {{ canonicalKey: string, confidence: number, fieldDef: Object } | null}
   */
  mapField(field) {
    const match = CanonicalFieldRegistry.resolveFieldMatch(field.label) ||
                  CanonicalFieldRegistry.resolveFieldMatch(field.placeholder) ||
                  CanonicalFieldRegistry.resolveFieldMatch(field.name) ||
                  CanonicalFieldRegistry.resolveFieldMatch(field.id);
    return match;
  }

  /**
   * Fills a single mapped field on the page
   * @param {Object} field - Discovered field descriptor
   * @param {*} value - Canonical value to inject
   * @returns {Promise<boolean>}
   */
  async fillField(field, value) {
    if (value === null || value === undefined || value === 'unknown') return false;

    try {
      const locator = this.page.locator(field.selector).first();
      const isVisible = await locator.isVisible().catch(() => false);
      if (!isVisible) return false;

      if (field.type === 'file' && typeof value === 'string') {
        await locator.setInputFiles(value);
        return true;
      }

      if (field.type === 'checkbox') {
        const shouldCheck = Boolean(value);
        if (shouldCheck) await locator.check({ force: true });
        else await locator.uncheck({ force: true });
        return true;
      }

      if (field.type === 'select-one' || field.type === 'select') {
        await locator.selectOption({ label: String(value) }).catch(async () => {
          await locator.selectOption({ value: String(value) }).catch(() => {});
        });
        return true;
      }

      // Standard text / email / tel / textarea
      await locator.fill(String(value));
      return true;
    } catch (err) {
      logger.warn(`ATSAdapter [${this.atsName}] failed to fill field "${field.label}": ${err.message}`);
      return false;
    }
  }

  /**
   * Validates form completion before submission
   * @param {import('playwright').Page} page
   * @returns {Promise<{ valid: boolean, errors: string[] }>}
   */
  async validate(page) {
    const errors = await page.evaluate(() => {
      const errorElements = Array.from(document.querySelectorAll('.error, [aria-invalid="true"], .invalid-feedback'));
      return errorElements.map(el => el.innerText.trim()).filter(Boolean);
    });
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Submits the application
   * @param {import('playwright').Page} page
   * @returns {Promise<{ success: boolean, confirmationText?: string }>}
   */
  async submit(page) {
    throw new Error('submit() must be implemented by subclass');
  }
}

module.exports = ATSAdapter;
