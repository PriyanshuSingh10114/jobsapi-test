const ATSTestHarness = require('../automation/testing/ATSTestHarness');

async function test() {
  try {
    const results = await ATSTestHarness.runTests();
    console.log('\nFINAL TEST RESULTS:', results);
    process.exit(results.failed === 0 ? 0 : 1);
  } catch (err) {
    console.error('Test run failed:', err);
    process.exit(1);
  }
}

test();
