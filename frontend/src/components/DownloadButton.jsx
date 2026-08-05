import { downloadDocument } from '../services/documentService';

export default function DownloadButton({ ownerId, document, onError }) {
  async function handleDownload() {
    try {
      const { blob, fileName } = await downloadDocument({
        ownerId,
        documentId: document.id,
      });

      const objectUrl = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = objectUrl;
      link.download = fileName || document.originalName;
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      onError(error.message);
    }
  }

  return (
    <button type="button" onClick={handleDownload}>
      Download
    </button>
  );
}
