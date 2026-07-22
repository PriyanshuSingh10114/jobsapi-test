const logger = require('../../config/logger');
const DropdownNormalizer = require('./DropdownNormalizer');

class FieldFillEngine {
    constructor(page) {
        this.page = page;
    }

    /**
     * Fills a specific field based on its controlType.
     * @param {Object} field - The detected field object from FormIntelligence.
     * @param {string} value - The resolved value from CandidateProfile.
     * @param {Object} locator - The playwright locator to act on.
     */
    async fillField(field, value, locator) {
        try {
            switch (field.controlType) {
                case 'text':
                case 'textarea':
                    await locator.fill(value);
                    break;

                case 'dropdown':
                case 'combobox':
                case 'select':
                    const options = await locator.locator('option').allInnerTexts().catch(() => []);
                    const match = DropdownNormalizer.findBestMatch(options, value);
                    if (match) {
                        await locator.selectOption({ label: match });
                    } else {
                        // Fallback: Some comboboxes are just text inputs (like custom React selects)
                        // If there are no options, try filling it as text.
                        if (options.length === 0) {
                             await locator.fill(value);
                        } else {
                             throw new Error(`Dropdown Option Missing: No match for '${value}'`);
                        }
                    }
                    break;

                case 'checkbox':
                    if (value && value.toString().toLowerCase() !== 'false') {
                        await locator.check();
                    } else {
                        await locator.uncheck();
                    }
                    break;

                case 'radio':
                    // Radio buttons usually share the same name, we need to find the one with the correct value
                    // This locator should already point to the correct radio button based on FormIntelligence
                    await locator.check();
                    break;

                case 'file':
                    // handled by UploadManager usually, but fallback here
                    await locator.setInputFiles(value);
                    break;

                default:
                    await locator.fill(value);
                    break;
            }
        } catch (err) {
            throw err;
        }
    }
}

module.exports = FieldFillEngine;
