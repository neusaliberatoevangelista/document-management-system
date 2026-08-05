// Controller de documentos: trata entrada/saída HTTP.
const path = require('path');
const documentService = require('../services/documentService');

function upload(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
  }
  const owner = req.body.owner || 'anonymous';
  const doc = documentService.addDocument({
    originalName: req.file.originalname,
    size: req.file.size,
    owner,
    filename: req.file.filename,
    path: req.file.path,
  });
  return res.status(201).json(doc);
}

function list(req, res) {
  const docs = documentService.listDocuments();
  return res.json(docs);
}

function download(req, res) {
  const doc = documentService.getDocument(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Documento não encontrado.' });
  }
  return res.download(doc.path, doc.originalName);
}

module.exports = { upload, list, download };
