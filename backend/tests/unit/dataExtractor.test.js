const test = require('node:test');
const assert = require('node:assert');
const { extractSkills, extractSalary, extractExperienceLevel, extractEmploymentType } = require('../../src/utils/dataExtractor');

test('extractSkills extracts common tech skills from text', () => {
  const text = 'We are hiring a Full Stack Engineer proficient in React, Node.js, Python, AWS, Docker, and MongoDB.';
  const skills = extractSkills(text);

  assert.ok(Array.isArray(skills));
  assert.ok(skills.includes('React'));
  assert.ok(skills.includes('Node.js'));
  assert.ok(skills.includes('Python'));
  assert.ok(skills.includes('AWS'));
  assert.ok(skills.includes('Docker'));
  assert.ok(skills.includes('MongoDB'));
});

test('extractSalary parses annual compensation ranges', () => {
  const annualText = 'Salary range: $130,000 - $170,000 per year plus equity and bonus.';
  const salaryAnnual = extractSalary(annualText);

  assert.ok(salaryAnnual);
  assert.strictEqual(salaryAnnual.min, 130000);
  assert.strictEqual(salaryAnnual.max, 170000);
  assert.strictEqual(salaryAnnual.average, 150000);

  const kNotationText = 'Compensation: $120k to $160k depending on experience.';
  const salaryK = extractSalary(kNotationText);

  assert.ok(salaryK);
  assert.strictEqual(salaryK.min, 120000);
  assert.strictEqual(salaryK.max, 160000);
  assert.strictEqual(salaryK.average, 140000);
});

test('extractExperienceLevel identifies seniority from title and description', () => {
  assert.strictEqual(extractExperienceLevel('Senior Staff Software Engineer', '', 'Unknown'), 'Senior');
  assert.strictEqual(extractExperienceLevel('Junior Frontend Developer', '', 'Unknown'), 'Entry Level');
  assert.strictEqual(extractExperienceLevel('Engineering Intern - Summer 2026', '', 'Unknown'), 'Internship');
  assert.strictEqual(extractExperienceLevel('Engineering Director', '', 'Unknown'), 'Leadership');
});

test('extractEmploymentType correctly categorizes work types', () => {
  assert.strictEqual(extractEmploymentType('Software Engineer (Full-time)', '', 'Full Time'), 'Full Time');
  assert.strictEqual(extractEmploymentType('Contract Backend Specialist', '', 'Contract'), 'Contract');
  assert.strictEqual(extractEmploymentType('Part-time Technical Writer', '', 'Part Time'), 'Part Time');
  assert.strictEqual(extractEmploymentType('Software Engineer Intern', '', 'Internship'), 'Internship');
});
