const documentService = require('../services/documentService');

function getRequestOwner(req) {
  const ownerFromHeader = req.get('x-owner-id');
  const ownerFromBody = req.body?.owner;

  return String(ownerFromHeader || ownerFromBody || '').trim();
}

function serializeDocument(document) {
  return {
    id: document.id,
    originalName: document.originalName,
    storedName: document.filename,
    mimeType: document.mimeType,
    size: document.size,
    uploadedAt: document.uploadedAt,
    owner: document.owner,
  };
}

function uploadDocument(req, res) {
  try {
    const owner = getRequestOwner(req);

    if (!owner) {
      return res.status(400).json({ error: 'Responsável é obrigatório.' });
    }

    const document = documentService.registerUploadedDocument(req.file, owner);

    res.status(201).json(serializeDocument(document));
  } catch (error) {
    if (error.message === 'FILE_REQUIRED') {
      return res.status(400).json({ error: 'Arquivo é obrigatório.' });
    }

    return res.status(500).json({ error: 'Falha ao processar upload.' });
  }
}

function listDocuments(req, res) {
  try {
    const owner = getRequestOwner(req);

    if (!owner) {
      return res.status(400).json({ error: 'Responsável é obrigatório.' });
    }

    const documents = documentService.listDocuments(owner).map(serializeDocument);

    res.json(documents);
  } catch (error) {
    if (error.message === 'OWNER_REQUIRED') {
      return res.status(400).json({ error: 'Responsável é obrigatório.' });
    }

    res.status(500).json({ error: 'Falha ao listar documentos.' });
  }
}

function downloadDocument(req, res) {
  try {
    const owner = getRequestOwner(req);

    if (!owner) {
      return res.status(400).json({ error: 'Responsável é obrigatório.' });
    }

    const document = documentService.getDocumentById(req.params.id, owner);

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

    if (error.message === 'DOCUMENT_FORBIDDEN') {
      return res.status(403).json({ error: 'Sem permissão para acessar este documento.' });
    }

    if (error.message === 'DOCUMENT_FILE_NOT_FOUND') {
      return res.status(404).json({ error: 'Arquivo do documento não encontrado.' });
    }

    if (error.message === 'OWNER_REQUIRED') {
      return res.status(400).json({ error: 'Responsável é obrigatório.' });
    }

    return res.status(500).json({ error: 'Falha ao baixar documento.' });
  }
}

module.exports = {
  uploadDocument,
  listDocuments,
  downloadDocument,
};
