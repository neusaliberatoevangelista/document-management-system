const path = require('node:path');

function parsePositiveInteger(value, fallbackValue) {
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallbackValue;
  }

  return parsed;
}

const storageDir = path.resolve(
  process.env.DMS_STORAGE_DIR || path.join(__dirname, '..', 'storage')
);

module.exports = {
  port: parsePositiveInteger(process.env.PORT, 3000),
  maxUploadBytes: parsePositiveInteger(process.env.DMS_MAX_UPLOAD_BYTES, 5 * 1024 * 1024),
  storageDir,
};
