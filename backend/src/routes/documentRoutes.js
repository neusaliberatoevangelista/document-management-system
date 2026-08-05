const express = require('express');
const upload = require('./uploadMiddleware');
const {
  uploadDocument,
  listDocuments,
  downloadDocument,
} = require('../controllers/documentController');

const router = express.Router();

router.post('/upload', upload.single('file'), uploadDocument);
router.get('/documents', listDocuments);
router.get('/documents/:id/download', downloadDocument);

module.exports = router;
