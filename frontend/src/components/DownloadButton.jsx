import { useState } from 'react';

export default function DownloadButton({ documentId, fallbackName, onDownload }) {
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload() {
    if (isDownloading) {
      return;
    }

    setIsDownloading(true);

    try {
      await onDownload(documentId, fallbackName);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <button type="button" onClick={handleDownload} disabled={isDownloading}>
      {isDownloading ? 'Baixando...' : 'Baixar'}
    </button>
  );
}
