import DownloadButton from './DownloadButton';

function formatFileSize(sizeInBytes) {
  if (!Number.isFinite(sizeInBytes)) {
    return '-';
  }

  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`;
  }

  if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatUploadDate(uploadedAt) {
  if (!uploadedAt) {
    return '-';
  }

  const date = new Date(uploadedAt);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleString('pt-BR');
}

export default function DocumentList({ documents, isLoading, onDownload }) {
  return (
    <section>
      <h2>Documentos</h2>

      {isLoading ? <p>Carregando documentos...</p> : null}

      {!isLoading && documents.length === 0 ? <p>Nenhum documento enviado ainda.</p> : null}

      {!isLoading && documents.length > 0 ? (
        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '0.75rem' }}>
          {documents.map((document) => (
            <li
              key={document.id}
              style={{
                border: '1px solid #ddd',
                borderRadius: 8,
                padding: '0.75rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <div>
                <strong>{document.originalName}</strong>
                <p style={{ margin: '0.25rem 0' }}>Dono: {document.owner || '-'}</p>
                <p style={{ margin: '0.25rem 0' }}>Tamanho: {formatFileSize(document.size)}</p>
                <p style={{ margin: 0 }}>Enviado em: {formatUploadDate(document.uploadedAt)}</p>
              </div>

              <DownloadButton
                documentId={document.id}
                fallbackName={document.originalName}
                onDownload={onDownload}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
