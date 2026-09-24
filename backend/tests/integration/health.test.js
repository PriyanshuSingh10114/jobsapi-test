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

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port,
      path,
      method: 'GET',
      headers: {
        'Connection': 'close'
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
    req.end();
  });
}

test('GET /health returns 200 and liveness metadata', async () => {
  const res = await makeRequest('/health');
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.status, 'ok');
  assert.ok(res.body.timestamp);
  assert.ok(typeof res.body.uptimeSeconds === 'number');
});

test('GET / returns root API index with status and documentation link', async () => {
  const res = await makeRequest('/');
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.status, 'online');
  assert.strictEqual(res.body.documentation, '/api-docs');
});

test('Request correlation ID is returned in response header', async () => {
  const res = await makeRequest('/health');
  assert.ok(res.headers['x-request-id'], 'Response should have X-Request-Id header');
});
