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

function findByOwner(owner) {
  return documents.filter((document) => document.owner === owner);
}

module.exports = {
  save,
  findAll,
  findById,
  findByOwner,
};
