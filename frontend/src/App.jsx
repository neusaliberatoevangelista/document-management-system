import { useEffect, useMemo, useState } from 'react';
import UploadComponent from './components/UploadComponent';
import DocumentList from './components/DocumentList';
import { listDocuments, uploadDocument, downloadDocument } from './services/documentApi';

export default function App() {
  const [owner, setOwner] = useState('');
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  async function fetchDocuments(currentOwner) {
    if (!currentOwner.trim()) {
      setDocuments([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const data = await listDocuments(currentOwner);
      setDocuments(data);
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchDocuments(owner);
  }, [owner]);

  async function handleUpload(payload) {
    setIsUploading(true);
    setFeedback({ type: '', message: '' });

    try {
      await uploadDocument(payload);
      await fetchDocuments(owner);
      setFeedback({ type: 'success', message: 'Documento enviado com sucesso.' });
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDownload(documentId, fallbackName) {
    setFeedback({ type: '', message: '' });

    try {
      const { blob, fileName } = await downloadDocument(documentId, owner, fallbackName);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
    }
  }

  const feedbackStyle = useMemo(() => {
    if (feedback.type === 'error') {
      return { color: '#b00020' };
    }

    if (feedback.type === 'success') {
      return { color: '#006d3c' };
    }

    return { color: '#222' };
  }, [feedback.type]);

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Document Management System</h1>

      <UploadComponent
        onUpload={handleUpload}
        isUploading={isUploading}
        owner={owner}
        onOwnerChange={setOwner}
      />

      {!owner.trim() ? <p>Informe o responsável para listar, enviar e baixar documentos.</p> : null}

      {feedback.message ? <p style={feedbackStyle}>{feedback.message}</p> : null}

      <DocumentList documents={documents} isLoading={isLoading} onDownload={handleDownload} />
    </main>
  );
}
