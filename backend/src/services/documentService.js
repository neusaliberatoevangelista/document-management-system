const path = require('path');
const { randomUUID } = require('crypto');
const documentRepository = require('../repositories/documentRepository');

function createDocumentMetadata(file, owner) {
  return {
    id: randomUUID(),
    originalName: file.originalname,
    filename: file.filename,
    mimeType: file.mimetype,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
    filePath: path.resolve(file.path),
  };
}

function registerUploadedDocument(file, owner = 'anonymous') {
  if (!file) {
    throw new Error('FILE_REQUIRED');
  }

  const normalizedOwner = String(owner || 'anonymous').trim() || 'anonymous';
  const documentMetadata = createDocumentMetadata(file, normalizedOwner);
  return documentRepository.save(documentMetadata);
}

function listDocuments() {
  return documentRepository.findAll();
}

function getDocumentById(id) {
  const document = documentRepository.findById(id);

  if (!document) {
    throw new Error('DOCUMENT_NOT_FOUND');
  }

  return document;
}

module.exports = {
  registerUploadedDocument,
  listDocuments,
  getDocumentById,
};
