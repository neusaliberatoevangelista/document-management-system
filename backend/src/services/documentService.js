// Serviço de documentos: encapsula as regras de negócio.
const documentRepository = require('../repositories/documentRepository');

function listDocuments() {
  return documentRepository.findAll();
}

function addDocument({ originalName, size, owner, filename, path }) {
  return documentRepository.save({ originalName, size, owner, filename, path, uploadedAt: new Date().toISOString() });
}

function getDocument(id) {
  return documentRepository.findById(id);
}

module.exports = { listDocuments, addDocument, getDocument };
