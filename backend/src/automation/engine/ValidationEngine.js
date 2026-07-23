const logger = require('../../config/logger');

class ValidationEngine {
    constructor(page) {
        this.page = page;
    }

    /**
     * Validates if a field is successfully filled based on its controlType.
     * @param {Object} field - The detected field object from FormIntelligence.
     * @param {Object} locator - The playwright locator to act on.
     * @returns {boolean} True if the field contains data.
     */
    async isFilled(field, locator) {
        try {
            if (await locator.count() === 0) return false;

            const el = locator.first();

            switch (field.controlType) {
                case 'checkbox':
                case 'radio':
                    const isChecked = await el.isChecked().catch(() => false);
                    if (isChecked) return true;
                    const ariaChecked = await el.getAttribute('aria-checked').catch(() => null);
                    return ariaChecked === 'true';

                case 'dropdown':
                case 'combobox':
                case 'select':
                    return await el.evaluate(e => {
                        if (!e) return false;
                        if (e.tagName.toLowerCase() === 'select') {
                            return e.value !== '' && e.options && e.options[e.selectedIndex] && e.options[e.selectedIndex].text.trim() !== '';
                        }
                        // Custom React / Select2 / ARIA combobox evaluation
                        const text = (e.innerText || e.textContent || '').trim();
                        const val = e.getAttribute('data-value') || e.getAttribute('aria-valuenow') || '';
                        const hasSelectedChild = !!e.querySelector('.select__single-value, .chosen-single, .selected, [class*="singleValue"], [class*="chosen"]');
                        return text.length > 0 || val.length > 0 || hasSelectedChild;
                    }).catch(() => false);

                case 'file':
                    // 1. Direct input.files property check
                    const hasFileInputProperty = await el.evaluate(e => e.files && e.files.length > 0).catch(() => false);
                    if (hasFileInputProperty) return true;

                    // 2. DOM Badge / Attachment Indicator Inspection (Greenhouse, Lever, Workday, etc.)
                    const parentContainer = el.locator('xpath=ancestor::*[contains(@class, "field") or contains(@class, "wrapper") or contains(@class, "group") or contains(@class, "upload") or name()="fieldset" or name()="div"][1]');
                    
                    if (await parentContainer.count() > 0) {
                        const badgeFound = await parentContainer.first().evaluate(container => {
                            const badgeSelectors = [
                                '.chosen-file',
                                '.filename',
                                '.file-name',
                                '.upload-status',
                                '.uploaded-file',
                                '[data-source]',
                                'div[class*="attachment"]',
                                'div[class*="chip"]',
                                'span[id*="filename"]',
                                'a[class*="download"]'
                            ];
                            const badge = container.querySelector(badgeSelectors.join(','));
                            if (badge && badge.innerText.trim().length > 0) return true;

                            // Text matching file extensions or status indicators
                            const fullText = container.innerText || '';
                            const hasExtension = /\.(pdf|doc|docx|txt|rtf)\b/i.test(fullText);
                            const hasStatusText = /(uploaded|attached|remove|change file)/i.test(fullText);
                            return hasExtension || hasStatusText;
                        }).catch(() => false);

                        if (badgeFound) return true;
                    }
                    return false;

                case 'text':
                case 'textarea':
                default:
                    const val = await el.inputValue().catch(async () => {
                        return await el.evaluate(e => e.innerText || e.textContent || '');
                    });
                    return (val || '').trim().length > 0;
            }
        } catch (err) {
            logger.warn(`Validation Error on field ${field.labelText}: ${err.message}`);
            return false;
        }
    }
}

module.exports = ValidationEngine;
