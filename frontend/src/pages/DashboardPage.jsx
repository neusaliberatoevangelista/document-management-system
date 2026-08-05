import { useCallback, useEffect, useState } from 'react';
import UploadComponent from '../components/UploadComponent';
import DocumentList from '../components/DocumentList';
import { listDocuments, uploadDocument } from '../services/documentService';

export default function DashboardPage() {
  const [ownerId, setOwnerId] = useState('anonymous');
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const items = await listDocuments(ownerId);
      setDocuments(items);
    } catch (error) {
      setMessage(error.message);
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  async function handleUpload(file) {
    setMessage('');

    try {
      await uploadDocument({ ownerId, file });
      await loadDocuments();
    } catch (error) {
      setMessage(error.message);
      throw error;
    }
  }

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
      <h1>Document Management System</h1>

      <section>
        <label htmlFor="ownerIdInput">Usuario</label>
        <input
          id="ownerIdInput"
          type="text"
          value={ownerId}
          onChange={(event) => setOwnerId(event.target.value || 'anonymous')}
          placeholder="anonymous"
        />
        <button type="button" onClick={loadDocuments} disabled={isLoading}>
          Atualizar lista
        </button>
      </section>

      <UploadComponent disabled={isLoading} onUpload={handleUpload} />

      {message ? <p role="alert">{message}</p> : null}
      {isLoading ? <p>Carregando documentos...</p> : null}

      <DocumentList ownerId={ownerId} documents={documents} onError={setMessage} />
    </main>
  );
}
