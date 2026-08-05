const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const app = require('../src/app');
const documentRepository = require('../src/repositories/documentRepository');

let server;
let baseUrl;

before((_, done) => {
  server = http.createServer(app);
  server.listen(0, '127.0.0.1', () => {
    const { port } = server.address();
    baseUrl = `http://127.0.0.1:${port}`;
    done();
  });
});

after((_, done) => {
  server.close(done);
});

beforeEach(() => {
  documentRepository.reset();
});

// Helper: faz uma requisição HTTP e devolve { statusCode, body }
function request(method, url, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, { method, headers }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString();
        let parsed;
        try { parsed = JSON.parse(raw); } catch { parsed = raw; }
        resolve({ statusCode: res.statusCode, headers: res.headers, body: parsed });
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

// Helper: upload multipart simples sem dependência externa
function uploadFile(url, fieldName, fileName, fileContent) {
  const boundary = '----FormBoundary' + Date.now().toString(16);
  const crlf = '\r\n';
  const parts = [
    `--${boundary}${crlf}`,
    `Content-Disposition: form-data; name="${fieldName}"; filename="${fileName}"${crlf}`,
    `Content-Type: application/octet-stream${crlf}`,
    crlf,
    fileContent,
    crlf,
    `--${boundary}--${crlf}`,
  ];
  const bodyBuf = Buffer.from(parts.join(''));
  return request('POST', url, {
    'content-type': `multipart/form-data; boundary=${boundary}`,
    'content-length': bodyBuf.length,
  }, bodyBuf);
}

// Teste de fumaça do seed: garante que o app Express foi exportado.
test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('GET /health retorna status ok', async () => {
  const { statusCode, body } = await request('GET', `${baseUrl}/health`);
  assert.strictEqual(statusCode, 200);
  assert.strictEqual(body.status, 'ok');
});

test('POST /upload sem arquivo retorna 400', async () => {
  const boundary = '----Empty' + Date.now();
  const bodyBuf = Buffer.from(`--${boundary}--\r\n`);
  const { statusCode } = await request('POST', `${baseUrl}/upload`, {
    'content-type': `multipart/form-data; boundary=${boundary}`,
    'content-length': bodyBuf.length,
  }, bodyBuf);
  assert.strictEqual(statusCode, 400);
});

test('POST /upload com arquivo retorna 201 e metadados', async () => {
  const { statusCode, body } = await uploadFile(
    `${baseUrl}/upload`, 'file', 'teste.txt', 'conteúdo do arquivo'
  );
  assert.strictEqual(statusCode, 201);
  assert.ok(body.id, 'deve retornar um id');
  assert.strictEqual(body.originalName, 'teste.txt');
  // limpa o arquivo criado no disco
  if (body.path) fs.rmSync(body.path, { force: true });
});

test('GET /documents retorna lista vazia inicialmente', async () => {
  const { statusCode, body } = await request('GET', `${baseUrl}/documents`);
  assert.strictEqual(statusCode, 200);
  assert.deepStrictEqual(body, []);
});

test('GET /documents retorna documentos após upload', async () => {
  const { body: uploaded } = await uploadFile(
    `${baseUrl}/upload`, 'file', 'doc.txt', 'dados'
  );
  const { statusCode, body } = await request('GET', `${baseUrl}/documents`);
  assert.strictEqual(statusCode, 200);
  assert.strictEqual(body.length, 1);
  assert.strictEqual(body[0].originalName, 'doc.txt');
  if (uploaded.path) fs.rmSync(uploaded.path, { force: true });
});

test('GET /documents/:id/download retorna 404 para id inexistente', async () => {
  const { statusCode } = await request('GET', `${baseUrl}/documents/999/download`);
  assert.strictEqual(statusCode, 404);
});

test('GET /documents/:id/download retorna o arquivo após upload', async () => {
  const { body: uploaded } = await uploadFile(
    `${baseUrl}/upload`, 'file', 'baixar.txt', 'conteúdo baixado'
  );
  const { statusCode, headers } = await request(
    'GET', `${baseUrl}/documents/${uploaded.id}/download`
  );
  assert.strictEqual(statusCode, 200);
  assert.ok(
    headers['content-disposition'] && headers['content-disposition'].includes('baixar.txt'),
    'content-disposition deve conter o nome do arquivo'
  );
  if (uploaded.path) fs.rmSync(uploaded.path, { force: true });
});

