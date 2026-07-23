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
                    await locator.fill(String(value));
                    break;

                case 'select':
                case 'dropdown':
                case 'combobox':
                    const tagName = await locator.evaluate(el => el.tagName.toLowerCase()).catch(() => 'input');
                    const role = await locator.getAttribute('role').catch(() => '');

                    if (tagName === 'select') {
                        const options = await locator.locator('option').allInnerTexts().catch(() => []);
                        const match = DropdownNormalizer.findBestMatch(options, String(value));
                        if (match) {
                            await locator.selectOption({ label: match });
                        } else {
                            throw new Error(`Select Option Missing: No match for '${value}' in options [${options.join(', ')}]`);
                        }
                    } else if (role === 'combobox' || tagName !== 'select') {
                        // Custom React / Select2 / ARIA Combobox Strategy
                        const options = await locator.locator('option').allInnerTexts().catch(() => []);
                        if (options.length > 0) {
                            const match = DropdownNormalizer.findBestMatch(options, String(value));
                            if (match) await locator.selectOption({ label: match });
                        } else {
                            // Click to open custom dropdown overlay
                            await locator.click().catch(() => {});
                            await this.page.waitForTimeout(300);

                            // Look for matching dropdown option in DOM overlay
                            const optionMatch = this.page.locator('[role="option"], .select__option, .chosen-results li, li.option, div[class*="option"]').filter({ hasText: new RegExp(String(value), 'i') }).first();
                            
                            if (await optionMatch.count() > 0) {
                                await optionMatch.click();
                            } else {
                                // Fallback: Fill or type as text input if typing filter works
                                await locator.fill(String(value)).catch(async () => {
                                    await locator.type(String(value));
                                });
                            }
                        }
                    }
                    break;

                case 'checkbox':
                    const shouldCheck = value && String(value).toLowerCase() !== 'false' && value !== 0;
                    const isChecked = await locator.isChecked().catch(() => false);
                    if (shouldCheck && !isChecked) {
                        await locator.check().catch(() => locator.click());
                    } else if (!shouldCheck && isChecked) {
                        await locator.uncheck().catch(() => locator.click());
                    }
                    break;

                case 'radio':
                    // Radio button strategy: click/check target element
                    await locator.click().catch(() => locator.check());
                    break;

                case 'file':
                    // File upload strategy: setInputFiles
                    await locator.setInputFiles(value);
                    break;

                default:
                    await locator.fill(String(value));
                    break;
            }
        } catch (err) {
            throw err;
        }
    }
}

module.exports = FieldFillEngine;
