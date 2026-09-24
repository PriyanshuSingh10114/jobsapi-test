const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const mongoose = require('mongoose');
const app = require('../../src/app');
const config = require('../../src/config');

let server;
let port;

test.before(async () => {
  mongoose.set('bufferCommands', false);
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      port = server.address().port;
      resolve();
    });
  });
});

test.after(async () => {
  if (server) {
    if (typeof server.closeAllConnections === 'function') {
      server.closeAllConnections();
    }
    await new Promise((resolve) => server.close(resolve));
  }
});

function requestApi(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port,
      path,
      method: options.method || 'GET',
      headers: {
        'Connection': 'close',
        ...(options.headers || {})
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

test('Admin API Key allows access to admin endpoints', async () => {
  const res = await requestApi('/api/admin/health', {
    headers: {
      'x-api-key': config.AUTH.adminApiKey
    }
  });

  // Admin key is accepted (does not return 401 or 403)
  assert.notStrictEqual(res.statusCode, 401);
  assert.notStrictEqual(res.statusCode, 403);
});

test('Malformed Bearer token returns 401 Unauthorized', async () => {
  const res = await requestApi('/api/admin/health', {
    headers: {
      'Authorization': 'Bearer invalid_garbage_token_structure'
    }
  });

  assert.strictEqual(res.statusCode, 401);
  assert.strictEqual(res.body.success, false);
  assert.strictEqual(res.body.error.code, 'AUTHENTICATION_REQUIRED');
});

test('Valid User JWT cannot access Admin-only routes (403 Forbidden)', async () => {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const payload = Buffer.from(JSON.stringify({ userId: 'user_123', role: 'USER' })).toString('base64');
  const userToken = `${header}.${payload}.signature`;

  const res = await requestApi('/api/admin/health', {
    headers: {
      'Authorization': `Bearer ${userToken}`
    }
  });

  assert.strictEqual(res.statusCode, 403);
  assert.strictEqual(res.body.success, false);
  assert.strictEqual(res.body.error.code, 'PERMISSION_DENIED');
});
