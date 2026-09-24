const test = require('node:test');
const assert = require('node:assert');
const { escapeRegex, sanitizeNoSql, parsePagination } = require('../../src/utils/sanitizer');

test('escapeRegex escapes all special regular expression symbols', () => {
  const dangerousInput = 'Senior C++ Developer (Remote) [Contract] *.*';
  const escaped = escapeRegex(dangerousInput);
  
  assert.strictEqual(escaped, 'Senior C\\+\\+ Developer \\(Remote\\) \\[Contract\\] \\*\\.\\*');
  
  // Verify it can safely compile into a RegExp without runtime syntax error or ReDoS vulnerability
  assert.doesNotThrow(() => {
    new RegExp(escaped, 'i');
  });
});

test('sanitizeNoSql strips malicious MongoDB operators and nested keys', () => {
  const maliciousInput = {
    role: 'Software Engineer',
    $where: 'this.password.length > 0',
    'nested.key': 'injected',
    filter: {
      $gt: '',
      normalField: 'clean'
    }
  };

  const sanitized = sanitizeNoSql(maliciousInput);
  assert.strictEqual(sanitized.$where, undefined);
  assert.strictEqual(sanitized['nested.key'], undefined);
  assert.strictEqual(sanitized.role, 'Software Engineer');
  assert.strictEqual(sanitized.filter.$gt, undefined);
  assert.strictEqual(sanitized.filter.normalField, 'clean');
});

test('parsePagination enforces bounds on page and limit', () => {
  const result1 = parsePagination({ page: '-5', limit: '500' }, 20, 100);
  assert.strictEqual(result1.page, 1);
  assert.strictEqual(result1.limit, 100, 'Limit should be capped at maxLimit (100)');
  assert.strictEqual(result1.skip, 0);

  const result2 = parsePagination({ page: '3', limit: '25' }, 20, 100);
  assert.strictEqual(result2.page, 3);
  assert.strictEqual(result2.limit, 25);
  assert.strictEqual(result2.skip, 50);
});
