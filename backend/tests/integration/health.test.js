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
    await new Promise((resolve) => server.close(resolve));
  }
  // Allow pending Winston file buffers to flush
  setTimeout(() => process.exit(0), 100).unref();
});

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${port}${path}`, (res) => {
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
    }).on('error', reject);
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
