const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const multer = require('multer');
const { maxUploadBytes, storageDir } = require('../config');
const AppError = require('../errors/AppError');

const allowedMimeTypes = new Set([
  'application/pdf',
  'text/plain',
  'image/png',
  'image/jpeg',
]);

const allowedExtensions = new Set(['.pdf', '.txt', '.png', '.jpg', '.jpeg']);

fs.mkdirSync(storageDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, storageDir);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname || '').toLowerCase();
    const safeExtension = allowedExtensions.has(extension) ? extension : '.bin';
    const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${safeExtension}`;

    callback(null, uniqueName);
  },
});

function fileFilter(_req, file, callback) {
  const extension = path.extname(file.originalname || '').toLowerCase();

  if (!allowedExtensions.has(extension) || !allowedMimeTypes.has(file.mimetype)) {
    callback(new AppError('Tipo de arquivo nao permitido.', 400));
    return;
  }

  callback(null, true);
}

module.exports = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: maxUploadBytes,
  },
});
