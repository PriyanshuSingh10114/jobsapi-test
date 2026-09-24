const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const app = require('../../src/app');

let server;
let port;

test.before(async () => {
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
        ...(options.headers || { 'Content-Type': 'application/json' })
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

test('Non-existent route returns standard 404 NOT_FOUND error response', async () => {
  const res = await requestApi('/api/non_existent_route_12345');
  assert.strictEqual(res.statusCode, 404);
  assert.strictEqual(res.body.success, false);
  assert.strictEqual(res.body.error.code, 'NOT_FOUND');
  assert.ok(res.body.requestId);
});

test('Malformed JSON payload returns 400 MALFORMED_JSON', async () => {
  const res = await requestApi('/api/discovery/ingest', {
    method: 'POST',
    body: '{"invalid": json payload missing closing bracket'
  });

  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.success, false);
  assert.strictEqual(res.body.error.code, 'MALFORMED_JSON');
});

test('Missing fields on automation start returns 400 VALIDATION_ERROR', async () => {
  const res = await requestApi('/api/automation/start', {
    method: 'POST',
    body: {}
  });

  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.success, false);
  assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
  assert.ok(res.body.error.details);
});
