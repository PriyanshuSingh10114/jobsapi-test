class LocatorEngine {
  constructor(page) {
    this.page = page;
  }

  /**
   * Finds an element using an array of prioritized strategies.
   * Priority: data-testid > aria-label > role > label > placeholder > text > xpath
   */
  async findElement(strategies) {
    for (const strategy of strategies) {
      try {
        let locator;
        switch (strategy.type) {
          case 'testid':
            locator = this.page.getByTestId(strategy.value);
            break;
          case 'aria-label':
            locator = this.page.getByLabel(strategy.value);
            break;
          case 'role':
            locator = this.page.getByRole(strategy.value.role, { name: strategy.value.name });
            break;
          case 'placeholder':
            locator = this.page.getByPlaceholder(strategy.value);
            break;
          case 'text':
            locator = this.page.getByText(strategy.value, { exact: strategy.exact || false });
            break;
          case 'css':
            locator = this.page.locator(strategy.value);
            break;
          case 'xpath':
            locator = this.page.locator(`xpath=${strategy.value}`);
            break;
        }

        if (locator) {
          // Check if it resolves to at least one element quickly
          const count = await locator.count();
          if (count > 0) {
             // If multiple, default to first or visible
             return locator.first();
          }
        }
      } catch (err) {
        // Continue to next strategy
      }
    }
    return null; // Not found via any strategy
  }
}

module.exports = LocatorEngine;
