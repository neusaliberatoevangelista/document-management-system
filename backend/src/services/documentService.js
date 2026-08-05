const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const repository = require('../repositories/documentRepository');
const AppError = require('../errors/AppError');
const { storageDir } = require('../config');

const ID_PATTERN = /^[a-f0-9-]{36}$/i;

function sanitizeOriginalName(fileName) {
  const baseName = path.basename(String(fileName || 'document'));
  const normalized = baseName.replace(/[^a-zA-Z0-9. _()-]/g, '_').trim();

  if (!normalized) {
    return 'document';
  }

  return normalized.slice(0, 120);
}

function buildSafeAbsolutePath(storedFilename) {
  if (!storedFilename || storedFilename.includes('/') || storedFilename.includes('\\')) {
    throw new AppError('Arquivo invalido no armazenamento.', 500);
  }

  const absolutePath = path.resolve(storageDir, storedFilename);
  const storageDirWithSeparator = `${storageDir}${path.sep}`;

  if (!absolutePath.startsWith(storageDirWithSeparator)) {
    throw new AppError('Caminho de arquivo invalido.', 400);
  }

  return absolutePath;
}

function registerUploadedDocument({ storedFilename, originalName, mimeType, size, ownerId }) {
  const document = {
    id: crypto.randomUUID(),
    ownerId,
    originalName: sanitizeOriginalName(originalName),
    storedFilename,
    mimeType,
    size,
    createdAt: new Date().toISOString(),
  };

  return repository.save(document);
}

function listDocuments(ownerId) {
  return repository.listByOwner(ownerId);
}

function getDocumentForDownload({ id, ownerId }) {
  if (!ID_PATTERN.test(id)) {
    throw new AppError('Identificador de documento invalido.', 400);
  }

  const document = repository.findByIdAndOwner(id, ownerId);

  if (!document) {
    throw new AppError('Documento nao encontrado.', 404);
  }

  const absolutePath = buildSafeAbsolutePath(document.storedFilename);

  if (!fs.existsSync(absolutePath)) {
    throw new AppError('Arquivo do documento nao encontrado no servidor.', 404);
  }

  return {
    document,
    absolutePath,
  };
}

module.exports = {
  registerUploadedDocument,
  listDocuments,
  getDocumentForDownload,
};
