// Repositório de metadados de documentos (armazenamento em memória).
const documents = [];
let nextId = 1;

function save(doc) {
  const newDoc = { id: nextId++, ...doc };
  documents.push(newDoc);
  return newDoc;
}

function findAll() {
  return [...documents];
}

function findById(id) {
  return documents.find((d) => d.id === Number(id)) || null;
}

// Permite resetar o estado para testes
function reset() {
  documents.length = 0;
  nextId = 1;
}

module.exports = { save, findAll, findById, reset };
