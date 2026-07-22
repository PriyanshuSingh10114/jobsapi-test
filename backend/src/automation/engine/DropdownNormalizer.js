class DropdownNormalizer {
    /**
     * Normalizes a given profile value against the options available in a dropdown.
     * @param {Array<string>} options - The text options available in the <select> tag.
     * @param {string} profileValue - The resolved value from CandidateProfile.
     * @returns {string|null} The best matching option text, or null.
     */
    static findBestMatch(options, profileValue) {
        if (!options || options.length === 0 || !profileValue) return null;
        
        const cleanProfileValue = this.cleanString(profileValue);
        
        // Exact or strong substring match
        let match = options.find(opt => this.cleanString(opt) === cleanProfileValue);
        if (match) return match;

        match = options.find(opt => this.cleanString(opt).includes(cleanProfileValue) || cleanProfileValue.includes(this.cleanString(opt)));
        if (match) return match;

        // Custom Mappings
        const normalizedTarget = this.getStandardAlias(cleanProfileValue);
        match = options.find(opt => {
            const cleanOpt = this.cleanString(opt);
            const normalizedOpt = this.getStandardAlias(cleanOpt);
            
            // Check cross matches
            if (cleanOpt === normalizedTarget || cleanOpt.includes(normalizedTarget) || normalizedTarget.includes(cleanOpt)) return true;
            if (normalizedOpt === cleanProfileValue || normalizedOpt.includes(cleanProfileValue) || cleanProfileValue.includes(normalizedOpt)) return true;
            if (normalizedOpt === normalizedTarget) return true;
            
            return false;
        });
        
        return match || null;
    }

    static cleanString(str) {
        return String(str).toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    }

    static getStandardAlias(val) {
        const aliases = {
            'btech': 'bachelors',
            'bachelors of technology': 'bachelors',
            'bachelor of technology': 'bachelors',
            'bachelor of science': 'bachelors',
            'bs': 'bachelors',
            'bsc': 'bachelors',
            'bachelor of science bsc': 'bachelors',
            'masters': 'masters',
            'mtech': 'masters',
            'msc': 'masters',
            'ms': 'masters',
            'doctorate': 'phd',
            'phd': 'phd',
            'usa': 'united states',
            'us': 'united states',
            'uk': 'united kingdom',
            'true': 'yes',
            'false': 'no'
        };
        return aliases[val] || val;
    }
}

module.exports = DropdownNormalizer;
