const { test } = require('node:test');
const assert = require('node:assert');
const { once } = require('node:events');
const http = require('node:http');
const app = require('../src/app');

async function withServer(callback) {
  const server = http.createServer(app);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');

  const { port } = server.address();

  try {
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    server.close();
    await once(server, 'close');
  }
}

test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('upload, listagem e download respeitam o owner', async () => {
  const owner = `owner-${Date.now()}`;
  const otherOwner = `${owner}-outro`;

  await withServer(async (baseUrl) => {
    const formData = new FormData();
    formData.append('file', new Blob(['conteudo'], { type: 'text/plain' }), 'relatorio.txt');

    const uploadResponse = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers: {
        'x-owner-id': owner,
      },
      body: formData,
    });

    assert.strictEqual(uploadResponse.status, 201);

    const uploadBody = await uploadResponse.json();
    assert.strictEqual(uploadBody.owner, owner);
    assert.strictEqual(uploadBody.originalName, 'relatorio.txt');
    assert.strictEqual(uploadBody.mimeType, 'text/plain');
    assert.ok(uploadBody.storedName, 'o nome armazenado deve ser retornado');

    const listResponse = await fetch(`${baseUrl}/documents`, {
      headers: {
        'x-owner-id': owner,
      },
    });

    assert.strictEqual(listResponse.status, 200);

    const documents = await listResponse.json();
    assert.strictEqual(documents.length, 1);
    assert.strictEqual(documents[0].owner, owner);
    assert.strictEqual(documents[0].storedName, uploadBody.storedName);

    const forbiddenDownloadResponse = await fetch(`${baseUrl}/documents/${uploadBody.id}/download`, {
      headers: {
        'x-owner-id': otherOwner,
      },
    });

    assert.strictEqual(forbiddenDownloadResponse.status, 403);

    const downloadResponse = await fetch(`${baseUrl}/documents/${uploadBody.id}/download`, {
      headers: {
        'x-owner-id': owner,
      },
    });

    assert.strictEqual(downloadResponse.status, 200);
    assert.match(downloadResponse.headers.get('content-disposition') || '', /relatorio\.txt/);
    assert.strictEqual(await downloadResponse.text(), 'conteudo');
  });
});

test('owner ausente retorna erro de validação', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/documents`);

    assert.strictEqual(response.status, 400);

    const body = await response.json();
    assert.strictEqual(body.error, 'Responsável é obrigatório.');
  });
});
