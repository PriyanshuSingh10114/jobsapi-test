/**
 * Input Sanitization and ReDoS / NoSQL Injection Defense Utilities
 */

/**
 * Escapes special regex characters in a user-supplied string so it can be safely used in RegExp.
 * Prevents ReDoS attacks and RegExp syntax runtime exceptions.
 */
function escapeRegex(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Sanitizes input to prevent NoSQL operator injection in MongoDB queries.
 * Strips keys starting with '$' or containing '.'
 */
function sanitizeNoSql(input) {
  if (input === null || typeof input !== 'object') {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeNoSql);
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(input)) {
    // Drop any key starting with '$' or containing '.'
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }
    sanitized[key] = sanitizeNoSql(value);
  }
  return sanitized;
}

/**
 * Validates and bounds pagination parameters.
 */
function parsePagination(query = {}, defaultLimit = 20, maxLimit = 100) {
  let page = parseInt(query.page, 10);
  if (isNaN(page) || page < 1) page = 1;

  let limit = parseInt(query.limit, 10);
  if (isNaN(limit) || limit < 1) limit = defaultLimit;
  if (limit > maxLimit) limit = maxLimit;

  return {
    page,
    limit,
    skip: (page - 1) * limit
  };
}

module.exports = {
  escapeRegex,
  sanitizeNoSql,
  parsePagination
};
