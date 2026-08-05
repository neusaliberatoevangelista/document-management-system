class DocumentRepository {
  constructor() {
    this.documents = [];
  }

  save(document) {
    this.documents.push(document);
    return document;
  }

  listByOwner(ownerId) {
    return this.documents
      .filter((document) => document.ownerId === ownerId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  findByIdAndOwner(id, ownerId) {
    return this.documents.find((document) => document.id === id && document.ownerId === ownerId) || null;
  }
}

module.exports = new DocumentRepository();
