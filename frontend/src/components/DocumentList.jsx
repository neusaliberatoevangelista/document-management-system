import DownloadButton from './DownloadButton';

function formatBytes(size) {
  if (typeof size !== 'number') {
    return '-';
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentList({ ownerId, documents, onError }) {
  return (
    <section>
      <h2>Documentos</h2>
      {documents.length === 0 ? (
        <p>Nenhum documento encontrado para este usuario.</p>
      ) : (
        <ul>
          {documents.map((document) => (
            <li key={document.id}>
              <strong>{document.originalName}</strong> ({formatBytes(document.size)})
              {' '}
              <DownloadButton ownerId={ownerId} document={document} onError={onError} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
