import { useState } from 'react';

export default function UploadComponent({ onUpload, isUploading }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [owner, setOwner] = useState('');

  function handleFileChange(event) {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!selectedFile || isUploading) {
      return;
    }

    await onUpload({ file: selectedFile, owner: owner.trim() });
    setSelectedFile(null);
    setOwner('');
    event.target.reset();
  }

  return (
    <section>
      <h2>Upload de Documento</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '0.75rem' }}>
          <label htmlFor="owner">Responsavel (opcional)</label>
          <br />
          <input
            id="owner"
            type="text"
            value={owner}
            onChange={(event) => setOwner(event.target.value)}
            placeholder="Ex.: Maria"
          />
        </div>

        <div style={{ marginBottom: '0.75rem' }}>
          <label htmlFor="document">Arquivo</label>
          <br />
          <input id="document" type="file" onChange={handleFileChange} required />
        </div>

        <button type="submit" disabled={!selectedFile || isUploading}>
          {isUploading ? 'Enviando...' : 'Enviar documento'}
        </button>
      </form>
    </section>
  );
}
