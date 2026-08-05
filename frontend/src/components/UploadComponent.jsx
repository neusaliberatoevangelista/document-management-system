import { useState } from 'react';

export default function UploadComponent({ disabled, onUpload }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isDisabled = disabled || isSubmitting;

  async function handleSubmit(event) {
    event.preventDefault();

    if (!selectedFile || isDisabled) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onUpload(selectedFile);
      setSelectedFile(null);
      event.currentTarget.reset();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section>
      <h2>Enviar documento</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          name="file"
          onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
          disabled={isDisabled}
          required
        />
        <button type="submit" disabled={!selectedFile || isDisabled}>
          {isSubmitting ? 'Enviando...' : 'Enviar'}
        </button>
      </form>
    </section>
  );
}
