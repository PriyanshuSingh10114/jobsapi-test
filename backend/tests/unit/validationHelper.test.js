const test = require('node:test');
const assert = require('node:assert');
const { validateJob } = require('../../src/utils/validationHelper');

test('validateJob accepts complete, fresh, valid US jobs', () => {
  const validJob = {
    title: 'Staff Platform Engineer',
    company: 'Stripe',
    location: 'San Francisco, CA',
    applyUrl: 'https://stripe.com/jobs/12345',
    source: 'Greenhouse',
    jobType: 'Full Time',
    description: 'Lead our core cloud infrastructure initiatives across multi-region clusters.',
    postedAt: new Date(),
    isUSJob: true,
    remote: false
  };

  const validation = validateJob(validJob);
  assert.strictEqual(validation.isValid, true);
  assert.strictEqual(validation.reason, null);
});

test('validateJob rejects incomplete jobs missing required fields', () => {
  const incompleteJob = {
    company: 'Stripe',
    applyUrl: 'https://stripe.com/jobs/12345'
  };

  const validation = validateJob(incompleteJob);
  assert.strictEqual(validation.isValid, false);
  assert.strictEqual(validation.reason, 'Title');
});

test('validateJob rejects jobs with invalid URLs', () => {
  const invalidUrlJob = {
    title: 'Engineer',
    company: 'TechCorp',
    location: 'Austin, TX',
    applyUrl: 'ftp://techcorp.com/file',
    source: 'Lever',
    jobType: 'Full Time',
    description: 'Full stack development with Node.js and React.',
    postedAt: new Date(),
    isUSJob: true,
    remote: false
  };

  const validation = validateJob(invalidUrlJob);
  assert.strictEqual(validation.isValid, false);
  assert.ok(validation.reason.includes('applyUrl'));
});

test('validateJob rejects expired jobs older than retention limit', () => {
  const oldDate = new Date();
  oldDate.setDate(oldDate.getDate() - 120); // 120 days ago

  const expiredJob = {
    title: 'Engineer',
    company: 'TechCorp',
    location: 'Austin, TX',
    applyUrl: 'https://techcorp.com/jobs/1',
    source: 'Lever',
    jobType: 'Full Time',
    description: 'Full stack development with Node.js and React.',
    postedAt: oldDate,
    isUSJob: true,
    remote: false
  };

  const validation = validateJob(expiredJob);
  assert.strictEqual(validation.isValid, false);
  assert.ok(validation.reason.includes('older than'));
});

