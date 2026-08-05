const { test, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const testStorageDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dms-storage-'));
process.env.DMS_STORAGE_DIR = testStorageDir;

const app = require('../src/app');

let server;
let baseUrl;

before(() => {
  server = app.listen(0);
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(() => {
  if (server) {
    server.close();
  }

  fs.rmSync(testStorageDir, { recursive: true, force: true });
});

async function uploadFile({ ownerId, name, content, type = 'text/plain' }) {
  const formData = new FormData();
  const file = new File([content], name, { type });

  formData.append('file', file);

  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: {
      'x-user-id': ownerId,
    },
    body: formData,
  });

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  return { response, data };
}

test('GET /health retorna status ok', async () => {
  const response = await fetch(`${baseUrl}/health`);
  const data = await response.json();

  assert.strictEqual(response.status, 200);
  assert.deepStrictEqual(data, { status: 'ok' });
});

test('POST /upload + GET /documents + GET /documents/:id/download funciona para o mesmo usuario', async () => {
  const ownerId = 'qa-user';
  const content = 'conteudo de teste';

  const uploadResult = await uploadFile({
    ownerId,
    name: 'relatorio.txt',
    content,
  });

  assert.strictEqual(uploadResult.response.status, 201);
  assert.ok(uploadResult.data.document.id);

  const listResponse = await fetch(`${baseUrl}/documents`, {
    headers: {
      'x-user-id': ownerId,
    },
  });
  const listData = await listResponse.json();

  assert.strictEqual(listResponse.status, 200);
  assert.strictEqual(Array.isArray(listData.documents), true);
  assert.strictEqual(listData.documents.length >= 1, true);

  const documentId = uploadResult.data.document.id;
  const downloadResponse = await fetch(`${baseUrl}/documents/${documentId}/download`, {
    headers: {
      'x-user-id': ownerId,
    },
  });

  assert.strictEqual(downloadResponse.status, 200);
  const downloadedContent = await downloadResponse.text();
  assert.strictEqual(downloadedContent, content);
});

test('isolamento por usuario impede acesso cruzado ao download', async () => {
  const uploadResult = await uploadFile({
    ownerId: 'owner-a',
    name: 'private.txt',
    content: 'arquivo privado',
  });

  const documentId = uploadResult.data.document.id;

  const forbiddenDownload = await fetch(`${baseUrl}/documents/${documentId}/download`, {
    headers: {
      'x-user-id': 'owner-b',
    },
  });

  assert.strictEqual(forbiddenDownload.status, 404);
});

test('id invalido no download retorna 400', async () => {
  const response = await fetch(`${baseUrl}/documents/not-a-valid-id/download`, {
    headers: {
      'x-user-id': 'qa-user',
    },
  });

  assert.strictEqual(response.status, 400);
});

test('upload com tipo nao permitido retorna 400', async () => {
  const result = await uploadFile({
    ownerId: 'qa-user',
    name: 'script.js',
    content: 'console.log(1);',
    type: 'application/javascript',
  });

  assert.strictEqual(result.response.status, 400);
});
