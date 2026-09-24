const test = require('node:test');
const assert = require('node:assert');
const { generateJobHash } = require('../../src/utils/hashHelper');

test('generateJobHash produces deterministic 64-char hex SHA-256 hash', () => {
  const jobA = {
    company: 'Google',
    title: 'Senior Software Engineer',
    location: 'Mountain View, CA',
    jobType: 'Full Time',
    source: 'Greenhouse',
    applyUrl: 'https://boards.greenhouse.io/google/jobs/12345?gh_src=linkedin',
    description: 'Build large scale distributed systems in Node.js and Go.'
  };

  const jobB = {
    company: 'GOOGLE ',
    title: ' Senior Software Engineer',
    location: 'Mountain View, CA',
    jobType: 'Full Time',
    source: 'greenhouse',
    applyUrl: 'https://boards.greenhouse.io/google/jobs/12345#utm_source=twitter',
    description: 'Build large   scale distributed systems in Node.js and Go. '
  };

  const hashA = generateJobHash(jobA);
  const hashB = generateJobHash(jobB);

  assert.strictEqual(typeof hashA, 'string');
  assert.strictEqual(hashA.length, 64);
  assert.strictEqual(hashA, hashB, 'Hashes should match after whitespace/URL query normalization');
});

test('generateJobHash produces distinct hashes for different jobs', () => {
  const job1 = {
    company: 'Apple',
    title: 'iOS Engineer',
    location: 'Cupertino, CA',
    jobType: 'Full Time',
    source: 'Greenhouse',
    applyUrl: 'https://apple.com/jobs/1',
    description: 'Swift UI Developer'
  };

  const job2 = {
    company: 'Apple',
    title: 'Backend Engineer',
    location: 'Cupertino, CA',
    jobType: 'Full Time',
    source: 'Greenhouse',
    applyUrl: 'https://apple.com/jobs/2',
    description: 'Node.js Developer'
  };

  assert.notStrictEqual(generateJobHash(job1), generateJobHash(job2));
});
