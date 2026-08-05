const documentService = require('../services/documentService');
const AppError = require('../errors/AppError');

const OWNER_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

function getOwnerIdFromRequest(req) {
  const ownerHeader = req.get('x-user-id') || 'anonymous';

  if (!OWNER_PATTERN.test(ownerHeader)) {
    throw new AppError('Identificador de usuario invalido.', 400);
  }

  return ownerHeader;
}

function toDocumentResponse(document) {
  return {
    id: document.id,
    ownerId: document.ownerId,
    originalName: document.originalName,
    size: document.size,
    mimeType: document.mimeType,
    createdAt: document.createdAt,
  };
}

function uploadDocument(req, res, next) {
  try {
    if (!req.file) {
      throw new AppError('Nenhum arquivo foi enviado no campo "file".', 400);
    }

    const ownerId = getOwnerIdFromRequest(req);

    const document = documentService.registerUploadedDocument({
      storedFilename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      ownerId,
    });

    res.status(201).json({
      document: toDocumentResponse(document),
    });
  } catch (error) {
    next(error);
  }
}

function listDocuments(req, res, next) {
  try {
    const ownerId = getOwnerIdFromRequest(req);
    const documents = documentService.listDocuments(ownerId).map(toDocumentResponse);

    res.json({ documents });
  } catch (error) {
    next(error);
  }
}

function downloadDocument(req, res, next) {
  try {
    const ownerId = getOwnerIdFromRequest(req);
    const { id } = req.params;

    const { document, absolutePath } = documentService.getDocumentForDownload({ id, ownerId });

    res.download(absolutePath, document.originalName);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  uploadDocument,
  listDocuments,
  downloadDocument,
};
