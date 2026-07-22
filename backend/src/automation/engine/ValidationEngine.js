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
                    return await el.isChecked();

                case 'dropdown':
                case 'combobox':
                case 'select':
                    const selectedValue = await el.evaluate(e => {
                        if (e.tagName.toLowerCase() === 'select') {
                             return e.value !== '' && e.options[e.selectedIndex]?.text !== '';
                        }
                        return e.innerText.trim() !== '';
                    });
                    return selectedValue;

                case 'file':
                    const hasFile = await el.evaluate(e => e.files && e.files.length > 0);
                    // Also check for UI badges indicating upload success if file input property is wiped
                    return hasFile;

                case 'text':
                case 'textarea':
                default:
                    const val = await el.inputValue().catch(() => '');
                    return val.trim().length > 0;
            }
        } catch (err) {
            logger.warn(`Validation Error on field ${field.labelText}: ${err.message}`);
            return false;
        }
    }
}

module.exports = ValidationEngine;
