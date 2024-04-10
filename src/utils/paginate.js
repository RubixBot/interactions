module.exports = (array, pageSize = 5, pageNumber = 1) => {
  let docs = JSON.parse(JSON.stringify(array));

  let chunks = [];
  while (docs.length > 0) chunks.push(docs.splice(0, pageSize));

  let page = Math.min(pageNumber, chunks.length) || 1;

  return {
    items: chunks[page - 1],
    pageNumber: page,
    totalPages: chunks.length,
    totalItems: docs.length
  };
};
