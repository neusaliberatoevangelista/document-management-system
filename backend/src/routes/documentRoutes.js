const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const documentController = require('../controllers/documentController');

const router = express.Router();

const storageDirectory = path.resolve(__dirname, '../../storage');
fs.mkdirSync(storageDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, storageDirectory);
  },
  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension).replace(/\s+/g, '-');
    const safeBaseName = baseName.replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 40) || 'document';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

    callback(null, `${safeBaseName}-${uniqueSuffix}${extension}`);
  },
});

const maxUploadSizeInBytes = Number(process.env.MAX_UPLOAD_SIZE_BYTES || 10 * 1024 * 1024);
const upload = multer({
  storage,
  limits: {
    fileSize: Number.isFinite(maxUploadSizeInBytes) && maxUploadSizeInBytes > 0 ? maxUploadSizeInBytes : 10 * 1024 * 1024,
    files: 1,
  },
});

router.post('/upload', upload.single('file'), documentController.uploadDocument);
router.get('/documents', documentController.listDocuments);
router.get('/documents/:id/download', documentController.downloadDocument);

router.use((error, req, res, next) => {
  if (!error) {
    return next();
  }

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Arquivo excede o limite permitido.' });
    }

    return res.status(400).json({ error: 'Falha ao processar upload.' });
  }

  return next(error);
});

module.exports = router;
