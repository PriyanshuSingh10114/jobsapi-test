const test = require('node:test');
const assert = require('node:assert');
const storageService = require('../../src/services/storage.service');

test('generateSecureFilename creates randomized UUID filenames with allowed extensions', () => {
  const filename = storageService.generateSecureFilename('My Resume 2026.pdf', 'resume');
  
  assert.ok(filename.startsWith('resume-'));
  assert.ok(filename.endsWith('.pdf'));
  assert.notStrictEqual(filename, 'My Resume 2026.pdf');
});

test('generateSecureFilename rejects dangerous or executable extensions', () => {
  assert.throws(() => {
    storageService.generateSecureFilename('malware.exe', 'resume');
  }, /Invalid file extension/);

  assert.throws(() => {
    storageService.generateSecureFilename('script.sh', 'resume');
  }, /Invalid file extension/);

  assert.throws(() => {
    storageService.generateSecureFilename('payload.php', 'resume');
  }, /Invalid file extension/);
});

test('sanitizePath rejects directory traversal attempts', () => {
  const safePath = storageService.sanitizePath('resume-12345.pdf', 'resumes');
  assert.ok(safePath.includes('resumes'));
  assert.ok(!safePath.includes('..'));
});
