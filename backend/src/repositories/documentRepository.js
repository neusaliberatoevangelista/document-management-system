const documents = [];

function save(documentMetadata) {
  documents.push(documentMetadata);
  return documentMetadata;
}

function findAll() {
  return [...documents];
}

function findById(id) {
  return documents.find((document) => document.id === id) || null;
}

module.exports = {
  save,
  findAll,
  findById,
};
