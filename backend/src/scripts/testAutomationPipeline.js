const mongoose = require('mongoose');
const logger = require('../config/logger');
const CandidateProfileResolver = require('../automation/engine/CandidateProfileResolver');
const CandidateResolutionEngine = require('../automation/engine/CandidateResolutionEngine');
const DropdownNormalizer = require('../automation/engine/DropdownNormalizer');
require('dotenv').config();

async function runTests() {
    logger.info('Starting Automated Tests for Automation Pipeline V2');
    let passed = 0;
    let failed = 0;

    const assert = (condition, message) => {
        if (condition) {
            logger.info(`✅ PASS: ${message}`);
            passed++;
        } else {
            logger.error(`❌ FAIL: ${message}`);
            failed++;
        }
    };

    // Test 1: Dropdown Normalizer
    const options = ['Bachelor of Science (B.Sc.)', 'Master of Arts', 'Ph.D'];
    const match1 = DropdownNormalizer.findBestMatch(options, 'Bachelors');
    assert(match1 === 'Bachelor of Science (B.Sc.)', `Dropdown Normalizer alias matching: Expected 'Bachelor of Science (B.Sc.)', got '${match1}'`);
    
    const match2 = DropdownNormalizer.findBestMatch(options, 'Doctorate');
    assert(match2 === 'Ph.D', `Dropdown Normalizer alias matching: Expected 'Ph.D', got '${match2}'`);

    // Test 2: Semantic Resolution (Simulated Profile)
    const mockProfile = {
        personal: { firstName: 'John', lastName: 'Doe', preferredName: 'Johnny' },
        location: { country: 'United States', city: 'New York' },
        education: [{ school: 'MIT', degree: 'Bachelors', discipline: 'Computer Science' }]
    };

    const resolver = new CandidateResolutionEngine(mockProfile, null);
    
    const res1 = await resolver.resolveValue('PREFERRED_NAME', { labelText: 'Preferred Name' });
    assert(res1 === 'Johnny', `Semantic Resolution (Preferred Name): Expected 'Johnny', got '${res1}'`);

    const res2 = await resolver.resolveValue('COUNTRY', { labelText: 'Country' });
    assert(res2 === 'United States', `Semantic Resolution (Country): Expected 'United States', got '${res2}'`);

    const res3 = await resolver.resolveValue('EDUCATION_SCHOOL', { labelText: 'University' });
    assert(res3 === 'MIT', `Semantic Resolution (School): Expected 'MIT', got '${res3}'`);

    logger.info(`\nTests Completed: ${passed} Passed, ${failed} Failed`);
    process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(e => {
    logger.error('Test Execution Failed:', e);
    process.exit(1);
});
