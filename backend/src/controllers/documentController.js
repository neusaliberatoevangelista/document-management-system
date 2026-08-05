const documentService = require('../services/documentService');

function uploadDocument(req, res) {
  try {
    const owner = req.body?.owner;
    const document = documentService.registerUploadedDocument(req.file, owner);

    res.status(201).json({
      id: document.id,
      originalName: document.originalName,
      size: document.size,
      uploadedAt: document.uploadedAt,
      owner: document.owner,
    });
  } catch (error) {
    if (error.message === 'FILE_REQUIRED') {
      return res.status(400).json({ error: 'Arquivo é obrigatório.' });
    }

    return res.status(500).json({ error: 'Falha ao processar upload.' });
  }
}

function listDocuments(req, res) {
  try {
    const documents = documentService.listDocuments().map((document) => ({
      id: document.id,
      originalName: document.originalName,
      size: document.size,
      uploadedAt: document.uploadedAt,
      owner: document.owner,
    }));

    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: 'Falha ao listar documentos.' });
  }
}

function downloadDocument(req, res) {
  try {
    const document = documentService.getDocumentById(req.params.id);

    res.download(document.filePath, document.originalName, (error) => {
      if (!error) {
        return;
      }

      if (!res.headersSent) {
        res.status(500).json({ error: 'Falha ao baixar documento.' });
      }
    });
  } catch (error) {
    if (error.message === 'DOCUMENT_NOT_FOUND') {
      return res.status(404).json({ error: 'Documento não encontrado.' });
    }

    return res.status(500).json({ error: 'Falha ao baixar documento.' });
  }
}

module.exports = {
  uploadDocument,
  listDocuments,
  downloadDocument,
};
