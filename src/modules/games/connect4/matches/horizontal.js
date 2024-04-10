module.exports = (grid) => {

  const rowsNum = 6;
  const columnsNum = 7;

  let found = 0;
  let foundPiece = 0;

  for (let x = 0; x < rowsNum; x++) {
    for (let y = 0; y < columnsNum; y++) {
      let piece = grid[y][x];

      if (piece === 0) {
        found = 0;
        foundPiece = 0;
        continue;
      }

      if (piece !== foundPiece) {
        found = 1;
        foundPiece = piece;
        continue;
      }

      found++;

      if (found >= 4) {
        return true;
      }
    }
  }

  return false;
};
