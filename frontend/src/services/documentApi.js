const API_PREFIX = '/api';

function getOwnerHeaders(owner) {
  const normalizedOwner = String(owner || '').trim();

  if (!normalizedOwner) {
    throw new Error('Responsável é obrigatório.');
  }

  return {
    'x-owner-id': normalizedOwner,
  };
}

async function parseJsonOrThrow(response) {
  if (response.ok) {
    if (response.status === 204) {
      return null;
    }

    return response.json();
  }

  let message = 'Falha na comunicacao com o servidor.';

  try {
    const errorBody = await response.json();
    if (errorBody?.error) {
      message = errorBody.error;
    }
  } catch {
    // Mantem a mensagem padrao quando a resposta nao e JSON.
  }

  throw new Error(message);
}

function getFileNameFromContentDisposition(contentDisposition, fallbackName) {
  if (!contentDisposition) {
    return fallbackName;
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const basicMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  if (basicMatch?.[1]) {
    return basicMatch[1];
  }

  return fallbackName;
}

export async function listDocuments(owner) {
  const response = await fetch(`${API_PREFIX}/documents`, {
    headers: getOwnerHeaders(owner),
  });
  return parseJsonOrThrow(response);
}

export async function uploadDocument({ file, owner }) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_PREFIX}/upload`, {
    method: 'POST',
    headers: getOwnerHeaders(owner),
    body: formData,
  });

  return parseJsonOrThrow(response);
}

export async function downloadDocument(documentId, owner, fallbackName = 'documento') {
  const response = await fetch(`${API_PREFIX}/documents/${documentId}/download`, {
    headers: getOwnerHeaders(owner),
  });

  if (!response.ok) {
    await parseJsonOrThrow(response);
  }

  const blob = await response.blob();
  const contentDisposition = response.headers.get('content-disposition');
  const fileName = getFileNameFromContentDisposition(contentDisposition, fallbackName);

  return { blob, fileName };
}
