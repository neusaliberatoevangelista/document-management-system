const API_BASE_PATH = import.meta.env.VITE_API_BASE_PATH || '/api';

function ensureOk(response, defaultMessage) {
  if (response.ok) {
    return response;
  }

  return response
    .json()
    .catch(() => ({}))
    .then((payload) => {
      const message = payload.error || defaultMessage;
      throw new Error(message);
    });
}

export async function listDocuments(ownerId) {
  const response = await fetch(`${API_BASE_PATH}/documents`, {
    headers: {
      'x-user-id': ownerId,
    },
  });

  await ensureOk(response, 'Falha ao listar documentos.');
  const data = await response.json();
  return data.documents || [];
}

export async function uploadDocument({ ownerId, file }) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_PATH}/upload`, {
    method: 'POST',
    headers: {
      'x-user-id': ownerId,
    },
    body: formData,
  });

  await ensureOk(response, 'Falha ao enviar documento.');
  const data = await response.json();
  return data.document;
}

function parseFileNameFromDisposition(contentDispositionHeader) {
  if (!contentDispositionHeader) {
    return 'download';
  }

  const match = contentDispositionHeader.match(/filename="?([^";]+)"?/i);
  if (!match) {
    return 'download';
  }

  return match[1];
}

export async function downloadDocument({ ownerId, documentId }) {
  const response = await fetch(`${API_BASE_PATH}/documents/${documentId}/download`, {
    headers: {
      'x-user-id': ownerId,
    },
  });

  await ensureOk(response, 'Falha ao baixar documento.');

  const blob = await response.blob();
  const fileName = parseFileNameFromDisposition(response.headers.get('content-disposition'));

  return { blob, fileName };
}
